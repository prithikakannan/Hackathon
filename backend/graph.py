import sys
import logging
from pathlib import Path
from typing import TypedDict, Dict, Any, List, Optional
from langgraph.graph import StateGraph, END

# Add project root and backend dir to sys.path
FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parent.parent
BACKEND_DIR = FILE_PATH.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.models import ApplicationStatus
    from backend.agents.scout import ScoutAgent
    from backend.agents.evaluator import EvaluatorAgent
    from backend.agents.tailor import TailorAgent
    from backend.agents.executor import ExecutionAgent
    from backend import database
except ImportError:
    from models import ApplicationStatus
    from agents.scout import ScoutAgent
    from agents.evaluator import EvaluatorAgent
    from agents.tailor import TailorAgent
    from agents.executor import ExecutionAgent
    import database

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    application_id: str
    job_url: str
    override_title: Optional[str]
    override_company: Optional[str]
    job_posting: Optional[Dict[str, Any]]
    fit_score: Optional[Dict[str, Any]]
    retrieved_chunks: Optional[List[Dict[str, Any]]]
    tailored_application: Optional[Dict[str, Any]]
    status: str
    human_approved: Optional[bool]
    user_feedback: Optional[str]
    edited_cover_letter: Optional[str]
    execution_result: Optional[Dict[str, Any]]
    error_message: Optional[str]

# Define Agent Node Functions for LangGraph workflow
async def scout_node(state: AgentState) -> AgentState:
    logger.info(f"--- [LANGGRAPH] NODE 1: SCOUT AGENT --- ({state['job_url']})")
    try:
        posting = await ScoutAgent.fetch_job_from_url(
            url=state["job_url"],
            override_title=state.get("override_title"),
            override_company=state.get("override_company")
        )
        posting_dict = posting.model_dump()
        
        # Save initial record to database
        app_record = {
            "id": state["application_id"],
            "job_url": posting.url,
            "company_name": posting.company,
            "job_title": posting.title,
            "location": posting.location,
            "job_description": posting.raw_description,
            "raw_payload": posting_dict,
            "status": ApplicationStatus.SCOUTING.value
        }
        await database.save_job_application(app_record)
        
        state["job_posting"] = posting_dict
        state["status"] = ApplicationStatus.SCOUTING.value
        return state
    except Exception as e:
        logger.error(f"Error in scout_node: {e}")
        state["status"] = ApplicationStatus.FAILED.value
        state["error_message"] = f"Scout Agent failed: {str(e)}"
        return state

async def evaluator_node(state: AgentState) -> AgentState:
    logger.info("--- [LANGGRAPH] NODE 2: EVALUATOR AGENT (RAG + SCORING) ---")
    try:
        from backend.models import JobPosting
        posting = JobPosting(**state["job_posting"])
        
        fit_score, chunks = await EvaluatorAgent.evaluate_fit(posting)
        
        fit_dict = fit_score.model_dump()
        chunks_dict = [c.model_dump() for c in chunks]
        
        state["fit_score"] = fit_dict
        state["retrieved_chunks"] = chunks_dict
        state["status"] = ApplicationStatus.EVALUATED.value
        
        # Update database record
        await database.update_job_application(state["application_id"], {
            "fit_score": fit_score.score,
            "fit_breakdown": fit_dict,
            "retrieved_context": chunks_dict,
            "status": ApplicationStatus.EVALUATED.value
        })
        
        return state
    except Exception as e:
        logger.error(f"Error in evaluator_node: {e}")
        state["status"] = ApplicationStatus.FAILED.value
        state["error_message"] = f"Evaluator Agent failed: {str(e)}"
        return state

async def tailor_node(state: AgentState) -> AgentState:
    logger.info("--- [LANGGRAPH] NODE 3: TAILOR AGENT (COVER LETTER & RESUME) ---")
    try:
        from backend.models import JobPosting, ResumeChunk
        posting = JobPosting(**state["job_posting"])
        chunks = [ResumeChunk(**c) for c in (state.get("retrieved_chunks") or [])]
        
        tailored = await TailorAgent.generate_tailored_application(posting, chunks)
        tailored_dict = tailored.model_dump()
        
        state["tailored_application"] = tailored_dict
        state["status"] = ApplicationStatus.PENDING_APPROVAL.value
        
        # Update database record to PENDING_APPROVAL
        await database.update_job_application(state["application_id"], {
            "tailored_cover_letter": tailored.cover_letter,
            "tailored_resume_bullets": [b.model_dump() for b in tailored.bullet_modifications],
            "status": ApplicationStatus.PENDING_APPROVAL.value
        })
        
        return state
    except Exception as e:
        logger.error(f"Error in tailor_node: {e}")
        state["status"] = ApplicationStatus.FAILED.value
        state["error_message"] = f"Tailor Agent failed: {str(e)}"
        return state

async def executor_node(state: AgentState) -> AgentState:
    logger.info("--- [LANGGRAPH] NODE 5: EXECUTION AGENT (PLAYWRIGHT AUTOMATION) ---")
    try:
        # Check human approval condition
        if not state.get("human_approved"):
            logger.info("Human rejected or did not approve. Skipping browser execution.")
            state["status"] = ApplicationStatus.REJECTED.value
            await database.update_job_application(state["application_id"], {
                "status": ApplicationStatus.REJECTED.value,
                "user_feedback": state.get("user_feedback", "Rejected by user")
            })
            return state

        # Execute browser application script
        cover_letter = state.get("edited_cover_letter") or (state.get("tailored_application") or {}).get("cover_letter", "")
        
        applicant_data = {
            "full_name": "Austral AI Candidate",
            "email": "candidate@austral.ai",
            "phone": "+1 800-555-0199",
            "linkedin_url": "https://linkedin.com/in/austral-ai-candidate",
            "portfolio_url": "https://github.com/austral-ai"
        }
        
        await database.update_job_application(state["application_id"], {
            "status": ApplicationStatus.APPLYING.value
        })
        
        result = await ExecutionAgent.run_application_automation(
            application_id=state["application_id"],
            job_url=state["job_url"],
            applicant_data=applicant_data,
            cover_letter_text=cover_letter,
            headless=True
        )
        
        state["execution_result"] = result
        new_status = ApplicationStatus.APPLIED.value if result.get("success") else ApplicationStatus.FAILED.value
        state["status"] = new_status
        
        await database.update_job_application(state["application_id"], {
            "status": new_status,
            "execution_logs": result.get("execution_logs", []),
            "screenshot_url": result.get("screenshot_url"),
            "submitted_at": result.get("submitted_at")
        })
        
        return state
    except Exception as e:
        logger.error(f"Error in executor_node: {e}")
        state["status"] = ApplicationStatus.FAILED.value
        state["error_message"] = f"Execution Agent failed: {str(e)}"
        return state

def should_continue_to_execution(state: AgentState) -> str:
    """Conditional router function for LangGraph."""
    if state.get("status") == ApplicationStatus.FAILED.value:
        return END
    return "hitl_wait"

# Build and compile the LangGraph workflow
def build_agent_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("scout", scout_node)
    workflow.add_node("evaluator", evaluator_node)
    workflow.add_node("tailor", tailor_node)
    workflow.add_node("executor", executor_node)
    
    workflow.set_entry_point("scout")
    
    workflow.add_edge("scout", "evaluator")
    workflow.add_edge("evaluator", "tailor")
    workflow.add_edge("tailor", END) # Pauses workflow for HITL Approval via FastAPI Route
    
    return workflow.compile()

agent_graph = build_agent_graph()
