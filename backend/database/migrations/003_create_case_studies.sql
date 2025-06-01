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

-- Add missing columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'type') THEN
        ALTER TABLE case_studies ADD COLUMN type VARCHAR(100);
        RAISE NOTICE 'Added type column to case_studies table';
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'name') THEN
        ALTER TABLE case_studies ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Added name column to case_studies table';
    END IF;
    
    -- Add objective column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'objective') THEN
        ALTER TABLE case_studies ADD COLUMN objective TEXT;
        RAISE NOTICE 'Added objective column to case_studies table';
    END IF;
    
    -- Add process_answer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'process_answer') THEN
        ALTER TABLE case_studies ADD COLUMN process_answer JSONB;
        RAISE NOTICE 'Added process_answer column to case_studies table';
    END IF;
    
    -- Add key_considerations_answer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'key_considerations_answer') THEN
        ALTER TABLE case_studies ADD COLUMN key_considerations_answer JSONB;
        RAISE NOTICE 'Added key_considerations_answer column to case_studies table';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'created_at') THEN
        ALTER TABLE case_studies ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to case_studies table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'case_studies' AND column_name = 'updated_at') THEN
        ALTER TABLE case_studies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to case_studies table';
    END IF;
END $$;

-- Update NOT NULL constraints for new columns (only if they were just added)
DO $$ 
BEGIN
    -- Set default values for existing rows and add NOT NULL constraint
    UPDATE case_studies SET type = 'Unknown' WHERE type IS NULL;
    UPDATE case_studies SET name = 'Legacy Case Study' WHERE name IS NULL;
    UPDATE case_studies SET objective = 'Legacy objective' WHERE objective IS NULL;
    UPDATE case_studies SET process_answer = '[]'::jsonb WHERE process_answer IS NULL;
    UPDATE case_studies SET key_considerations_answer = '[]'::jsonb WHERE key_considerations_answer IS NULL;
    UPDATE case_studies SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
    UPDATE case_studies SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
    
    -- Add NOT NULL constraints if columns exist but don't have the constraint
    BEGIN
        ALTER TABLE case_studies ALTER COLUMN type SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'type column already has NOT NULL constraint or does not exist';
    END;
    
    BEGIN
        ALTER TABLE case_studies ALTER COLUMN name SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'name column already has NOT NULL constraint or does not exist';
    END;
    
    BEGIN
        ALTER TABLE case_studies ALTER COLUMN objective SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'objective column already has NOT NULL constraint or does not exist';
    END;
    
    BEGIN
        ALTER TABLE case_studies ALTER COLUMN process_answer SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'process_answer column already has NOT NULL constraint or does not exist';
    END;
    
    BEGIN
        ALTER TABLE case_studies ALTER COLUMN key_considerations_answer SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'key_considerations_answer column already has NOT NULL constraint or does not exist';
    END;
END $$;

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_studies_key') THEN
        CREATE INDEX idx_case_studies_key ON case_studies(key);
        RAISE NOTICE 'Created idx_case_studies_key index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_studies_type') THEN
        CREATE INDEX idx_case_studies_type ON case_studies(type);
        RAISE NOTICE 'Created idx_case_studies_type index';
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
        RAISE NOTICE 'Created update_case_studies_updated_at trigger';
    END IF;
END $$; 