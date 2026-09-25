-- Enable vector extension for semantic resume search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum for tracking application lifecycle
CREATE TYPE application_status AS ENUM (
    'scouting',
    'evaluated',
    'tailored',
    'pending_approval',
    'approved',
    'rejected',
    'applying',
    'applied',
    'failed'
);

-- Master Resume Chunks table storing semantic embeddings of candidate experience
CREATE TABLE IF NOT EXISTS master_resume_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_index INT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'experience', 'skill', 'education', 'project'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536), -- Standard OpenAI text-embedding-3-small dimension (or adjust for Gemini 768)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search using Cosine Distance
CREATE INDEX IF NOT EXISTS master_resume_embedding_cosine_idx 
ON master_resume_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Job Applications Table storing workflow state and HITL review data
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_url TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    job_description TEXT NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    
    -- Evaluator Outputs
    fit_score INT CHECK (fit_score >= 0 AND fit_score <= 100),
    fit_breakdown JSONB DEFAULT '{}'::jsonb, -- skill matches, missing requirements, reasoning
    retrieved_context JSONB DEFAULT '[]'::jsonb,
    
    -- Tailor Outputs
    tailored_cover_letter TEXT,
    tailored_resume_bullets JSONB DEFAULT '[]'::jsonb, -- array of { original: string, tailored: string, reason: string }
    
    -- Application Lifecycle & HITL
    status application_status DEFAULT 'scouting',
    user_feedback TEXT,
    approved_at TIMESTAMPTZ,
    
    -- Execution Logs
    execution_logs JSONB DEFAULT '[]'::jsonb,
    screenshot_url TEXT,
    submitted_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper RPC Function for Vector Similarity Search on Resume Chunks
CREATE OR REPLACE FUNCTION match_resume_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    chunk_index INT,
    category TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.chunk_index,
        m.category,
        m.content,
        m.metadata,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM master_resume_chunks m
    WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_applications_modtime
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
