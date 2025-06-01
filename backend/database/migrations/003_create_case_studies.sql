-- Migration: Create case_studies table
-- Description: Store case studies in database instead of JSON file

-- Create the table only if it doesn't exist
CREATE TABLE IF NOT EXISTS case_studies (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add type column if it doesn't exist
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS type VARCHAR(100);

-- Add name column if it doesn't exist  
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add objective column if it doesn't exist
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS objective TEXT;

-- Add process_answer column if it doesn't exist
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS process_answer JSONB;

-- Add key_considerations_answer column if it doesn't exist
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS key_considerations_answer JSONB;

-- Create index for key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_case_studies_key ON case_studies(key);

-- Create index for type if it doesn't exist (will work after type column is added)
CREATE INDEX IF NOT EXISTS idx_case_studies_type ON case_studies(type);

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_case_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_case_studies_updated_at ON case_studies;
CREATE TRIGGER update_case_studies_updated_at
    BEFORE UPDATE ON case_studies
    FOR EACH ROW
    EXECUTE FUNCTION update_case_studies_updated_at(); 