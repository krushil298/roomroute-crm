-- Add company_website field to contacts table
-- Migration: 003_add_company_website

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_company_website ON contacts(company_website);
