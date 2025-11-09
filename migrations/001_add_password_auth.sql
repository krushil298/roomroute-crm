-- Add password and birthday fields to users table for email/password authentication
-- Migration: 001_add_password_auth

-- Add password column (nullable for existing users and OAuth users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;

-- Add birthday column
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday TIMESTAMP;

-- Add authProvider column to track authentication method
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Make email NOT NULL (it should already be, but ensuring)
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add index on authProvider for filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
