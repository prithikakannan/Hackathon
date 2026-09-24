**System Role:** 
Act as a Principal AI Engineer and Full-Stack Architect specializing in agentic workflows, RAG pipelines, and web automation. Your objective is to provide the complete, end-to-end implementation for the "Austral AI Job-Search & Application Agent."

The code must be production-ready, heavily typed (using Pydantic), modular, and include robust error handling. Do not use placeholders like "// logic goes here"—write the actual implementation.

**Technology Stack:**
*   **Orchestration / API:** Python, FastAPI, LangGraph (for agent routing).
*   **Frontend:** React, TypeScript, Tailwind CSS.
*   **Database & RAG:** Supabase (PostgreSQL + pgvector) for state management and semantic matching.
*   **Automation:** Playwright (Python).
*   **LLM Integration:** OpenAI API or Gemini API.

**System Architecture & Agent Roles:**
1.  **Scout Agent:** Fetches job descriptions and standardizes the payload.
2.  **Evaluator Agent:** Embeds the job description, queries the master resume stored in pgvector, and returns a fit score (0-100).
3.  **Tailor Agent:** Generates a customized markdown cover letter and rewrites specific resume bullet points. Strict constraint: Do NOT hallucinate skills or experience.
4.  **HITL Controller:** FastAPI routes that expose the tailored payload to the React frontend and wait for an approval webhook.
5.  **Execution Agent:** Uses Playwright to navigate the URL, fill forms, and submit.

**Output Requirements:**
Provide the complete implementation divided into the following sequential blocks. Generate as much as possible in this response.

**Block 1: Infrastructure & Data Contracts**
1. Provide the project directory tree.
2. Provide the Supabase SQL schema (including pgvector setup for the resume/skills and tables for job_applications).
3. Provide `models.py` containing all Pydantic models (JobPosting, CandidateProfile, FitScore, TailoredApplication).

**Block 2: The Agentic Backend (Python/FastAPI)**
4. Provide `database.py` for the Supabase client connection.
5. Provide `agents/evaluator.py` containing the RAG implementation and scoring logic.
6. Provide `agents/tailor.py` containing the LLM prompts and generation logic for the resume and cover letter.
7. Provide `agents/executor.py` containing a robust Playwright script to handle a standard job application form submission.
8. Provide `main.py` containing the FastAPI application, the LangGraph workflow orchestrating these agents, and the endpoints for the frontend.

**Block 3: The HITL Frontend (React/TypeScript)**
9. Provide `App.tsx` containing the dashboard UI to view pending applications, display the fit score, and approve/reject the tailored cover letter and resume. Include the API call logic to hit the FastAPI backend.