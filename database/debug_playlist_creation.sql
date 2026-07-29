-- Debug Playlist Creation Issues
-- Run these queries to investigate the 409 Conflict error

-- 1. Check if user has curator_stats entry
SELECT * FROM public.curator_stats 
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

-- 2. If not, initialize curator_stats for the user
INSERT INTO public.curator_stats (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.curator_stats)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Check RLS policies on curator_stats
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'curator_stats';

-- 4. Check RLS policies on playlist_collaborators
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'playlist_collaborators';

-- 5. Test the create_collaborative_playlist function directly
SELECT public.create_collaborative_playlist(
    (SELECT id FROM auth.users LIMIT 1)::uuid,
    'Test Direct Call',
    'Testing function directly',
    'custom',
    true,
    false,
    10
);

-- 6. Check for any existing playlists
SELECT * FROM public.collaborative_playlists 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check playlist_collaborators table
SELECT * FROM public.playlist_collaborators 
ORDER BY joined_at DESC 
LIMIT 5;
