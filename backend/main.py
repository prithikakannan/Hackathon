import os
import sys
import uuid
import logging
import asyncio
from pathlib import Path as FilePath
from typing import List, Dict, Any, Optional

# Ensure Windows event loop policy supports subprocesses for Playwright
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

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

# Mount screenshots directory for verification captures
screenshots_dir = os.path.join(os.getcwd(), "screenshots")
os.makedirs(screenshots_dir, exist_ok=True)
app.mount("/screenshots", StaticFiles(directory=screenshots_dir), name="screenshots")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Austral AI Agentic Application Automation API",
        "endpoints": ["/api/applications", "/api/jobs/scout", "/api/resume/seed"]
    }

@app.post("/api/resume/seed")
async def seed_master_resume(payload: SeedResumeRequest):
    """Embeds and indexes candidate's master resume into pgvector RAG database."""
    try:
        chunks_data = [chunk.model_dump() for chunk in payload.chunks]
        success = await database.save_master_resume_chunks(chunks_data)
        return {"success": success, "chunk_count": len(chunks_data)}
    except Exception as e:
        logger.error(f"Error seeding master resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications", response_model=List[Dict[str, Any]])
async def list_applications():
    """Retrieves all tracked job applications in the pipeline."""
    try:
        apps = await database.list_job_applications()
        return apps
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/{app_id}", response_model=Dict[str, Any])
async def get_application(app_id: str):
    """Retrieves a single application by ID."""
    app_data = await database.get_job_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Job application not found")
    return app_data

class ScoutJobRequest(BaseModel):
    job_url: str
    title: Optional[str] = None
    company: Optional[str] = None

@app.post("/api/jobs/scout")
async def scout_new_job(request: ScoutJobRequest, background_tasks: BackgroundTasks):
    """Triggers Scout Agent -> RAG Evaluator -> Resume Tailor pipeline."""
    app_id = str(uuid.uuid4())
    
    initial_record = {
        "id": app_id,
        "job_url": request.job_url,
        "job_title": request.title or "Scouting Position...",
        "company_name": request.company or "Extracting Company...",
        "status": ApplicationStatus.SCOUTING.value,
        "created_at": database.datetime.utcnow().isoformat() if hasattr(database, 'datetime') else __import__('datetime').datetime.utcnow().isoformat()
    }
    
    await database.save_job_application(initial_record)
    
    async def run_pipeline():
        try:
            initial_state: AgentState = {
                "application_id": app_id,
                "job_url": request.job_url,
                "job_title": request.title or "",
                "company_name": request.company or "",
                "status": ApplicationStatus.SCOUTING.value,
                "execution_logs": []
            }
            await agent_graph.ainvoke(initial_state)
        except Exception as e:
            logger.error(f"Error running pipeline for {app_id}: {e}")
            await database.update_job_application(app_id, {
                "status": ApplicationStatus.FAILED.value,
                "execution_logs": [{"step": "Pipeline Execution", "status": "failed", "details": str(e)}]
            })

    background_tasks.add_task(run_pipeline)
    
    return {
        "application_id": app_id,
        "message": "Scout agent launched. Pipeline executing asynchronously.",
        "status": ApplicationStatus.SCOUTING.value
    }

@app.post("/api/applications/{app_id}/approve")
async def approve_application(app_id: str, payload: ApprovalAction):
    """Human-in-the-Loop approval endpoint."""
    app_data = await database.get_job_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    updates: Dict[str, Any] = {
        "status": ApplicationStatus.APPROVED.value if payload.approved else ApplicationStatus.REJECTED.value,
        "user_approved": payload.approved
    }
    
    if payload.edited_cover_letter:
        updates["tailored_cover_letter"] = payload.edited_cover_letter
    if payload.edited_bullets:
        updates["tailored_resume_bullets"] = [b.model_dump() for b in payload.edited_bullets]
    if payload.feedback:
        updates["user_feedback"] = payload.feedback

    await database.update_job_application(app_id, updates)
    
    return {"success": True, "application_id": app_id, "status": updates["status"]}

@app.post("/api/applications/{app_id}/reject")
async def reject_application(app_id: str, payload: ApprovalAction):
    """Rejects application candidate."""
    await database.update_job_application(app_id, {
        "status": ApplicationStatus.REJECTED.value,
        "user_approved": False,
        "user_feedback": payload.feedback or "Rejected by user in HITL review"
    })
    return {"success": True, "application_id": app_id, "status": ApplicationStatus.REJECTED.value}

@app.post("/api/applications/{app_id}/execute")
async def execute_playwright_automation(app_id: str, background_tasks: BackgroundTasks):
    """Triggers Playwright execution agent for approved application."""
    app_data = await database.get_job_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    await database.update_job_application(app_id, {
        "status": ApplicationStatus.APPLYING.value
    })

    async def run_execution():
        try:
            state: AgentState = {
                "application_id": app_id,
                "job_url": app_data.get("job_url", ""),
                "job_title": app_data.get("job_title", ""),
                "company_name": app_data.get("company_name", ""),
                "tailored_cover_letter": app_data.get("tailored_cover_letter", ""),
                "status": ApplicationStatus.APPLYING.value,
                "execution_logs": app_data.get("execution_logs", [])
            }
            res = await executor_node(state)
            
            updates = {
                "status": res.get("status", ApplicationStatus.APPLIED.value),
                "execution_logs": res.get("execution_logs", []),
                "screenshot_url": res.get("screenshot_url"),
                "submitted_at": res.get("submitted_at")
            }
            await database.update_job_application(app_id, updates)
        except Exception as e:
            logger.error(f"Error executing automation for {app_id}: {e}")
            await database.update_job_application(app_id, {
                "status": ApplicationStatus.FAILED.value,
                "execution_logs": app_data.get("execution_logs", []) + [{"step": "Execution", "status": "failed", "details": str(e)}]
            })

    background_tasks.add_task(run_execution)
    
    return {
        "success": True,
        "application_id": app_id,
        "status": ApplicationStatus.APPLYING.value,
        "message": "Playwright worker launched in background."
    }
