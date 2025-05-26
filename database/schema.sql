-- Tech Interview Analyzer Database Schema
-- PostgreSQL Database for Render deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for Google OAuth authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table for session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Case studies table (loaded from static data)
CREATE TABLE case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    process_answer JSONB NOT NULL, -- Array of process steps
    key_considerations_answer JSONB NOT NULL, -- Array of considerations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Transcripts table (encrypted storage)
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    encrypted_content TEXT NOT NULL, -- Encrypted transcript content
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    file_size INTEGER NOT NULL,
    qa_pairs JSONB NOT NULL, -- Extracted Q&A pairs
    qa_pairs_count INTEGER NOT NULL,
    processing_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluations table (complete evaluation records)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    case_study_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE RESTRICT,
    expected_level VARCHAR(10) NOT NULL CHECK (expected_level IN ('L1', 'L2', 'L3', 'L4')),
    
    -- Evaluation results
    evaluation_results JSONB NOT NULL, -- Complete OpenAI evaluation response
    overall_approach_score INTEGER NOT NULL CHECK (overall_approach_score >= 0 AND overall_approach_score <= 100),
    overall_considerations_score INTEGER NOT NULL CHECK (overall_considerations_score >= 0 AND overall_considerations_score <= 100),
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Processing metadata
    processing_duration_ms INTEGER,
    openai_model_used VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    evaluation_prompt_tokens INTEGER,
    evaluation_completion_tokens INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation questions table (detailed breakdown)
CREATE TABLE evaluation_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    candidate_answer TEXT NOT NULL,
    expert_answer TEXT,
    approach_evaluation VARCHAR(20) NOT NULL CHECK (approach_evaluation IN ('High', 'Medium', 'Low')),
    approach_score INTEGER NOT NULL CHECK (approach_score >= 0 AND approach_score <= 100),
    key_considerations_evaluation VARCHAR(20) NOT NULL CHECK (key_considerations_evaluation IN ('Correct', 'Partially Correct', 'Incorrect')),
    key_considerations_score INTEGER NOT NULL CHECK (key_considerations_score >= 0 AND key_considerations_score <= 100),
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_case_studies_key ON case_studies(key);
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_transcript_id ON evaluations(transcript_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX idx_evaluation_questions_evaluation_id ON evaluation_questions(evaluation_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_studies_updated_at BEFORE UPDATE ON case_studies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data will be inserted via migration script 