-- Migration: Create case_studies table
-- Description: Store case studies in database instead of JSON file

-- Create the table only if it doesn't exist
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

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_studies_key') THEN
        CREATE INDEX idx_case_studies_key ON case_studies(key);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_studies_type') THEN
        CREATE INDEX idx_case_studies_type ON case_studies(type);
    END IF;
END $$;

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_case_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_case_studies_updated_at') THEN
        CREATE TRIGGER update_case_studies_updated_at
            BEFORE UPDATE ON case_studies
            FOR EACH ROW
            EXECUTE FUNCTION update_case_studies_updated_at();
    END IF;
END $$; 