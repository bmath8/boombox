-- Reload PostgREST Schema Cache
-- Run this to force Supabase to recognize the new Foreign Keys
NOTIFY pgrst, 'reload schema';
