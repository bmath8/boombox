-- Check if the Spotify user has a provider_token
-- Run this to see the Spotify user's session details

SELECT 
    id,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'spotify';

-- This will show the Spotify user's metadata
-- The provider_token is stored in the session, not in the users table
-- So we need to actually log in as this user to test if the token works
