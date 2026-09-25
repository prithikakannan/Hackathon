export type ApplicationStatus = 
  | 'scouting' 
  | 'evaluated' 
  | 'tailored' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'applying' 
  | 'applied' 
  | 'failed';

export interface SkillMatchDetail {
  skill: string;
  matched: boolean;
  evidence?: string;
}

export interface FitScore {
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  skill_matrix?: SkillMatchDetail[];
  reasoning: string;
  key_strengths: string[];
  potential_gaps: string[];
}

export interface BulletModification {
  original: string;
  tailored: string;
  rationale: string;
}

export interface ExecutionLog {
  timestamp: string;
  step: string;
  status: 'running' | 'success' | 'failed' | 'warning' | 'info' | 'simulated';
  details?: string;
}

export interface JobApplication {
  id: string;
  job_url: string;
  company_name: string;
  job_title: string;
  location?: string;
  job_description: string;
  fit_score?: number;
  fit_breakdown?: FitScore;
  retrieved_context?: Array<{
    category: string;
    content: string;
    similarity?: number;
  }>;
  tailored_cover_letter?: string;
  tailored_resume_bullets?: BulletModification[];
  status: ApplicationStatus;
  user_feedback?: string;
  approved_at?: string;
  execution_logs?: ExecutionLog[];
  screenshot_url?: string;
  submitted_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
