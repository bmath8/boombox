-- Fix for 409 Conflict in Playlist Creation
-- This addresses the curator_stats conflict issue

-- Step 1: Ensure all users have curator_stats entries
INSERT INTO public.curator_stats (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.curator_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Update the create_collaborative_playlist function to handle conflicts better
CREATE OR REPLACE FUNCTION public.create_collaborative_playlist(
    p_creator_id UUID,
    p_playlist_name VARCHAR(200),
    p_description TEXT,
    p_theme VARCHAR(50),
    p_voting_enabled BOOLEAN,
    p_auto_sort BOOLEAN,
    p_max_tracks INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_playlist_id UUID;
BEGIN
    -- Ensure curator_stats exists for user (idempotent)
    INSERT INTO public.curator_stats (user_id, total_playlists_created)
    VALUES (p_creator_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create playlist
    INSERT INTO public.collaborative_playlists (
        creator_id, playlist_name, description, theme, 
        voting_enabled, auto_sort_by_votes, max_tracks_per_user
    ) VALUES (
        p_creator_id, p_playlist_name, p_description, p_theme,
        p_voting_enabled, p_auto_sort, p_max_tracks
    )
    RETURNING playlist_id INTO v_playlist_id;
    
    -- Add creator as collaborator
    INSERT INTO public.playlist_collaborators (playlist_id, user_id, role)
    VALUES (v_playlist_id, p_creator_id, 'creator')
    ON CONFLICT (playlist_id, user_id) DO NOTHING;
    
    -- Update curator stats
    UPDATE public.curator_stats
    SET total_playlists_created = total_playlists_created + 1,
        updated_at = NOW()
    WHERE user_id = p_creator_id;
    
    -- Initialize challenges for user if not already done
    PERFORM public.initialize_user_challenges(p_creator_id);
    
    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Verify the function works
SELECT public.create_collaborative_playlist(
    (SELECT id FROM auth.users LIMIT 1)::uuid,
    'Test Fix Playlist',
    'Testing the fixed function',
    'custom',
    true,
    false,
    10
);
