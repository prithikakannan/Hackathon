from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class ApplicationStatus(str, Enum):
    SCOUTING = "scouting"
    EVALUATED = "evaluated"
    TAILORED = "tailored"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLYING = "applying"
    APPLIED = "applied"
    FAILED = "failed"

class JobPosting(BaseModel):
    url: str = Field(..., description="Target job application URL")
    title: str = Field(..., description="Job title parsed from target page")
    company: str = Field(..., description="Company name")
    location: Optional[str] = Field(None, description="Job location or Remote status")
    raw_description: str = Field(..., description="Full text description of the job posting")
    key_requirements: List[str] = Field(default_factory=list, description="Extracted key skills & qualifications")
    scouted_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeChunk(BaseModel):
    id: Optional[str] = None
    chunk_index: int
    category: str = Field(..., description="e.g. experience, education, skills, projects")
    content: str = Field(..., description="Verifiable facts and description from master resume")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    similarity: Optional[float] = None

class CandidateProfile(BaseModel):
    full_name: str
    email: str
    phone: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    location: str
    master_resume_text: str
    parsed_chunks: List[ResumeChunk] = Field(default_factory=list)

class SkillMatchDetail(BaseModel):
    skill: str
    matched: bool
    evidence: Optional[str] = None

class FitScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall match score from 0 to 100")
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    skill_matrix: List[SkillMatchDetail] = Field(default_factory=list)
    reasoning: str = Field(..., description="Detailed textual rationale for the assigned fit score")
    key_strengths: List[str] = Field(default_factory=list)
    potential_gaps: List[str] = Field(default_factory=list)

class BulletPointModification(BaseModel):
    original: str = Field(..., description="Original resume bullet point")
    tailored: str = Field(..., description="Rewritten bullet point highlighting job-relevant emphasis without fabrication")
    rationale: str = Field(..., description="Why this edit was made based on job criteria")

class TailoredApplication(BaseModel):
    job_id: str
    cover_letter: str = Field(..., description="Customized Markdown cover letter")
    bullet_modifications: List[BulletPointModification] = Field(default_factory=list)
    tailored_at: datetime = Field(default_factory=datetime.utcnow)

class ApprovalAction(BaseModel):
    approved: bool
    feedback: Optional[str] = None
    edited_cover_letter: Optional[str] = None
    edited_bullets: Optional[List[BulletPointModification]] = None

class FollowUpAction(BaseModel):
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "scheduled"

class ExecuteRequest(BaseModel):
    application_id: str
    headless: bool = True

class ExecutionLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    step: str
    status: str
    details: Optional[str] = None

class JobApplicationResponse(BaseModel):
    id: str
    job_url: str
    company_name: str
    job_title: str
    location: Optional[str] = None
    job_description: str
    fit_score: Optional[int] = None
    fit_breakdown: Optional[Dict[str, Any]] = None
    retrieved_context: Optional[List[Dict[str, Any]]] = None
    tailored_cover_letter: Optional[str] = None
    tailored_resume_bullets: Optional[List[Dict[str, Any]]] = None
    status: ApplicationStatus
    user_feedback: Optional[str] = None
    approved_at: Optional[datetime] = None
    execution_logs: Optional[List[Dict[str, Any]]] = None
    screenshot_url: Optional[str] = None
    submitted_at: Optional[datetime] = None
    follow_up_date: Optional[str] = None
    follow_up_status: Optional[str] = None
    follow_up_notes: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SeedResumeRequest(BaseModel):
    chunks: List[ResumeChunk] = Field(default_factory=list)
    master_text: Optional[str] = None
