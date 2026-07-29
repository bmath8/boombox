-- Quick test to verify Spotify OAuth is configured in Supabase
-- Run this in Supabase SQL Editor to check if Spotify provider is enabled

-- Check if there are any users with Spotify provider
SELECT 
    id,
    email,
    raw_app_meta_data->>'provider' as auth_provider,
    raw_user_meta_data,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- This will show which provider each user used to sign up
-- Look for 'provider': 'spotify' in the results
