import os
import sys
import uuid
import logging
from pathlib import Path as FilePath
from typing import List, Dict, Any, Optional

# Add project root and backend dir to sys.path to support execution from any directory
FILE_PATH = FilePath(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parent.parent
BACKEND_DIR = FILE_PATH.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, HTTPException, BackgroundTasks, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

try:
    from backend import database
    from backend.models import (
        JobApplicationResponse,
        ApprovalAction,
        ExecuteRequest,
        SeedResumeRequest,
        ApplicationStatus
    )
    from backend.graph import agent_graph, executor_node, AgentState
except ImportError:
    import database
    from models import (
        JobApplicationResponse,
        ApprovalAction,
        ExecuteRequest,
        SeedResumeRequest,
        ApplicationStatus
    )
    from graph import agent_graph, executor_node, AgentState

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("austral_ai_backend")

app = FastAPI(
    title="Austral AI Job-Search & Application Agent API",
    description="Agentic RAG pipeline & HITL automation engine for intelligent job search and application.",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure screenshot output directory exists and mount static route
os.makedirs("screenshots", exist_ok=True)
app.mount("/screenshots", StaticFiles(directory="screenshots"), name="screenshots")

class JobScoutRequest(BaseModel):
    job_url: str = Field(..., description="Target job application URL")
    title: Optional[str] = None
    company: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Austral AI Agent Backend Server...")
    # Seed initial candidate master resume if database is currently empty
    initial_chunks = [
        {
            "category": "experience",
            "content": "Principal AI & Full-Stack Architect with 7+ years experience designing multi-agent orchestration frameworks (LangGraph, AutoGen), production RAG pipelines using Supabase pgvector, and high-performance microservices in Python (FastAPI) and React (TypeScript, Tailwind CSS)."
        },
        {
            "category": "experience",
            "content": "Engineered automated web browser workflows using Playwright for enterprise form navigation, dynamic web page parsing, and human-in-the-loop validation, achieving 99.4% execution reliability."
        },
        {
            "category": "skills",
            "content": "Expert Technical Stack: Python, FastAPI, LangGraph, RAG, pgvector, Supabase, PostgreSQL, OpenAI API, Gemini API, Playwright, React, TypeScript, Tailwind CSS, Docker, Kubernetes."
        },
        {
            "category": "education",
            "content": "B.S. in Computer Science & Artificial Intelligence. Specialization in Machine Learning and Distributed Systems."
        }
    ]
    await database.save_master_resume_chunks(initial_chunks)
    logger.info("Master resume default vector chunks initialized successfully.")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Austral AI Backend", "version": "1.0.0"}

@app.post("/api/seed-resume", response_model=Dict[str, Any])
async def seed_master_resume(request: SeedResumeRequest):
    """Seed or update candidate master resume vector embeddings in pgvector."""
    try:
        chunks = [c.model_dump() for c in request.candidate_profile.parsed_chunks]
        if not chunks and request.candidate_profile.master_resume_text:
            # Auto chunking text paragraphs
            paras = [p.strip() for p in request.candidate_profile.master_resume_text.split("\n\n") if p.strip()]
            chunks = [{"category": "general", "content": p} for p in paras]
            
        success = await database.save_master_resume_chunks(chunks)
        return {"status": "success", "message": f"Successfully indexed {len(chunks)} resume chunks into vector database."}
    except Exception as e:
        logger.error(f"Error seeding master resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs/scout", response_model=Dict[str, Any])
async def scout_job_and_run_pipeline(req: JobScoutRequest, background_tasks: BackgroundTasks):
    """Trigger the Scout -> Evaluator -> Tailor agentic workflow for a target job URL."""
    app_id = str(uuid.uuid4())
    
    initial_state: AgentState = {
        "application_id": app_id,
        "job_url": req.job_url,
        "override_title": req.title,
        "override_company": req.company,
        "job_posting": None,
        "fit_score": None,
        "retrieved_chunks": None,
        "tailored_application": None,
        "status": ApplicationStatus.SCOUTING.value,
        "human_approved": None,
        "user_feedback": None,
        "edited_cover_letter": None,
        "execution_result": None,
        "error_message": None
    }
    
    # Run graph execution asynchronously
    async def run_pipeline():
        logger.info(f"Executing LangGraph pipeline for App ID {app_id}")
        await agent_graph.ainvoke(initial_state)

    background_tasks.add_task(run_pipeline)
    
    return {
        "message": "Agent workflow initiated",
        "application_id": app_id,
        "status": ApplicationStatus.SCOUTING.value
    }

@app.get("/api/applications", response_model=List[Dict[str, Any]])
async def get_applications():
    """Retrieve all job applications and their current workflow states."""
    apps = await database.list_job_applications()
    return apps

@app.get("/api/applications/{app_id}", response_model=Dict[str, Any])
async def get_application_details(app_id: str = Path(..., description="Application UUID")):
    """Get complete details for a specific application."""
    record = await database.get_job_application(app_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job application not found")
    return record

@app.post("/api/applications/{app_id}/approve")
async def approve_application(
    action: ApprovalAction,
    background_tasks: BackgroundTasks,
    app_id: str = Path(...)
):
    """HITL Controller route: User approves tailored application and triggers Execution Agent."""
    record = await database.get_job_application(app_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job application not found")

    cover_letter = action.edited_cover_letter or record.get("tailored_cover_letter", "")
    bullets = [b.model_dump() for b in action.edited_bullets] if action.edited_bullets else record.get("tailored_resume_bullets", [])

    await database.update_job_application(app_id, {
        "status": ApplicationStatus.APPROVED.value,
        "tailored_cover_letter": cover_letter,
        "tailored_resume_bullets": bullets,
        "user_feedback": action.feedback,
        "approved_at": database.datetime.utcnow().isoformat() if hasattr(database, 'datetime') else None
    })

    # Trigger Playwright Execution Agent in background
    async def execute_task():
        state: AgentState = {
            "application_id": app_id,
            "job_url": record["job_url"],
            "override_title": None,
            "override_company": None,
            "job_posting": record.get("raw_payload"),
            "fit_score": record.get("fit_breakdown"),
            "retrieved_chunks": record.get("retrieved_context"),
            "tailored_application": {"cover_letter": cover_letter},
            "status": ApplicationStatus.APPROVED.value,
            "human_approved": True,
            "user_feedback": action.feedback,
            "edited_cover_letter": cover_letter,
            "execution_result": None,
            "error_message": None
        }
        await executor_node(state)

    background_tasks.add_task(execute_task)

    return {"message": "Application approved. Execution Agent dispatched.", "application_id": app_id, "status": "approved"}

@app.post("/api/applications/{app_id}/reject")
async def reject_application(app_id: str = Path(...), feedback: Optional[str] = None):
    """HITL Controller route: User rejects application."""
    record = await database.get_job_application(app_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job application not found")

    await database.update_job_application(app_id, {
        "status": ApplicationStatus.REJECTED.value,
        "user_feedback": feedback or "User rejected application"
    })
    return {"message": "Application rejected", "application_id": app_id, "status": "rejected"}

@app.post("/api/applications/{app_id}/execute")
async def trigger_execution_manually(app_id: str = Path(...), background_tasks: BackgroundTasks = None):
    """Manually trigger Playwright execution agent on demand."""
    record = await database.get_job_application(app_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job application not found")

    async def execute_task():
        state: AgentState = {
            "application_id": app_id,
            "job_url": record["job_url"],
            "override_title": None,
            "override_company": None,
            "job_posting": record.get("raw_payload"),
            "fit_score": record.get("fit_breakdown"),
            "retrieved_chunks": record.get("retrieved_context"),
            "tailored_application": {"cover_letter": record.get("tailored_cover_letter")},
            "status": ApplicationStatus.APPROVED.value,
            "human_approved": True,
            "user_feedback": None,
            "edited_cover_letter": record.get("tailored_cover_letter"),
            "execution_result": None,
            "error_message": None
        }
        await executor_node(state)

    if background_tasks:
        background_tasks.add_task(execute_task)
    else:
        import asyncio
        asyncio.create_task(execute_task())

    return {"message": "Execution agent launched in background", "application_id": app_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
