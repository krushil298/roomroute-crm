-- Add archive_reason field to contacts table
-- Migration: 005_add_archive_reason_to_contacts

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Add index for faster lookups by archive reason
CREATE INDEX IF NOT EXISTS idx_contacts_archive_reason ON contacts(archive_reason);
