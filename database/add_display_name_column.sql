-- Add display_name column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Set display_name from email for existing users
UPDATE users
SET display_name = SPLIT_PART(email, '@', 1)
WHERE display_name IS NULL OR display_name = '';
