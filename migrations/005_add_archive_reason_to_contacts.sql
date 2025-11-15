-- Add archived and archive_reason fields to contacts table
-- Migration: 005_add_archive_reason_to_contacts

-- Add archived boolean column with default false
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Add archive_reason text column
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_archived ON contacts(archived);
CREATE INDEX IF NOT EXISTS idx_contacts_archive_reason ON contacts(archive_reason);
