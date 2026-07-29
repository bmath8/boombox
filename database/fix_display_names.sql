-- Update users table to add display_name from email if missing
-- Run this in Supabase SQL Editor

UPDATE users
SET display_name = COALESCE(display_name, SPLIT_PART(email, '@', 1))
WHERE display_name IS NULL OR display_name = '';
