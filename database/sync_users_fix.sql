-- Fix: Sync auth.users with public.users and fix curator_stats
-- This resolves the foreign key constraint violation

-- Step 1: Insert missing users from auth.users into public.users
INSERT INTO public.users (user_id, email, display_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', au.email)
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.users)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Now initialize curator_stats for all users
INSERT INTO public.curator_stats (user_id)
SELECT user_id FROM public.users
WHERE user_id NOT IN (SELECT user_id FROM public.curator_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify the sync worked
SELECT 
    COUNT(*) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users,
    (SELECT COUNT(*) FROM public.curator_stats) as curator_stats
FROM auth.users;

-- Step 4: Create a trigger to auto-sync new users (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users
    INSERT INTO public.users (user_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize curator_stats
    INSERT INTO public.curator_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize DJ stats
    INSERT INTO public.dj_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Now update the create_collaborative_playlist function (simplified)
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
    
    -- Update curator stats (now safe because user exists)
    UPDATE public.curator_stats
    SET total_playlists_created = total_playlists_created + 1,
        updated_at = NOW()
    WHERE user_id = p_creator_id;
    
    -- Initialize challenges for user
    PERFORM public.initialize_user_challenges(p_creator_id);
    
    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
