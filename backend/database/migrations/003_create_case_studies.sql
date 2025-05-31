-- Migration: Create case_studies table
-- Description: Store case studies in database instead of JSON file

CREATE TABLE IF NOT EXISTS case_studies (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    process_answer JSONB NOT NULL,
    key_considerations_answer JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_case_studies_key ON case_studies(key);
CREATE INDEX IF NOT EXISTS idx_case_studies_type ON case_studies(type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_case_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_case_studies_updated_at
    BEFORE UPDATE ON case_studies
    FOR EACH ROW
    EXECUTE FUNCTION update_case_studies_updated_at(); 