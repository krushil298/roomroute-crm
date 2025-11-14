-- Add created_by field to activities table
-- Migration: 004_add_created_by_to_activities

ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES users(id);

-- Add index for faster lookups by creator
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);

-- Update existing activities to set created_by to NULL (will remain NULL for historical data)
-- New activities will have created_by populated automatically
