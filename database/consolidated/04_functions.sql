-- 04_functions.sql
-- Database Functions and RPCs

-- ============================================================================
-- RADIO FUNCTIONS
-- ============================================================================

-- Update listener count
CREATE OR REPLACE FUNCTION public.update_listener_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.radio_stations
        SET total_listeners = total_listeners + 1,
            peak_listeners = GREATEST(peak_listeners, total_listeners + 1)
        WHERE station_id = NEW.station_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.radio_stations
        SET total_listeners = GREATEST(0, total_listeners - 1)
        WHERE station_id = OLD.station_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PLAYLIST FUNCTIONS
-- ============================================================================

-- Create playlist with creator as collaborator
CREATE OR REPLACE FUNCTION public.create_collaborative_playlist(
    p_name VARCHAR,
    p_description TEXT,
    p_theme VARCHAR,
    p_voting_enabled BOOLEAN,
    p_auto_sort BOOLEAN,
    p_max_tracks INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_playlist_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.collaborative_playlists (
        created_by, playlist_name, description, theme, 
        voting_enabled, auto_sort_by_votes, max_tracks_per_user
    )
    VALUES (
        v_user_id, p_name, p_description, p_theme,
        p_voting_enabled, p_auto_sort, p_max_tracks
    )
    RETURNING playlist_id INTO v_playlist_id;

    -- Add creator as owner
    INSERT INTO public.playlist_collaborators (playlist_id, user_id, role)
    VALUES (v_playlist_id, v_user_id, 'owner');

    -- Update stats
    INSERT INTO public.curator_stats (user_id, total_playlists_created)
    VALUES (v_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_playlists_created = curator_stats.total_playlists_created + 1;

    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vote on track
CREATE OR REPLACE FUNCTION public.vote_on_playlist_track(
    p_track_id UUID,
    p_vote_type INTEGER -- 1 or -1
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_playlist_id UUID;
    v_auto_sort BOOLEAN;
    v_old_vote INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Get playlist info
    SELECT playlist_id INTO v_playlist_id
    FROM public.playlist_tracks
    WHERE track_id = p_track_id;

    -- Check if user already voted
    SELECT vote_type INTO v_old_vote
    FROM public.playlist_track_votes
    WHERE track_id = p_track_id AND user_id = v_user_id;

    IF v_old_vote IS NOT NULL THEN
        -- Update existing vote
        UPDATE public.playlist_track_votes
        SET vote_type = p_vote_type
        WHERE track_id = p_track_id AND user_id = v_user_id;

        -- Update track count
        UPDATE public.playlist_tracks
        SET vote_count = vote_count - v_old_vote + p_vote_type
        WHERE track_id = p_track_id;
    ELSE
        -- Insert new vote
        INSERT INTO public.playlist_track_votes (track_id, user_id, vote_type)
        VALUES (p_track_id, v_user_id, p_vote_type);

        -- Update track count
        UPDATE public.playlist_tracks
        SET vote_count = vote_count + p_vote_type
        WHERE track_id = p_track_id;
    END IF;

    -- Check auto-sort
    SELECT auto_sort_by_votes INTO v_auto_sort
    FROM public.collaborative_playlists
    WHERE playlist_id = v_playlist_id;

    IF v_auto_sort THEN
        PERFORM public.auto_sort_playlist(v_playlist_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto sort playlist
CREATE OR REPLACE FUNCTION public.auto_sort_playlist(p_playlist_id UUID)
RETURNS VOID AS $$
BEGIN
    WITH sorted AS (
        SELECT track_id, ROW_NUMBER() OVER (ORDER BY vote_count DESC, added_at ASC) as new_pos
        FROM public.playlist_tracks
        WHERE playlist_id = p_playlist_id
    )
    UPDATE public.playlist_tracks pt
    SET position = s.new_pos
    FROM sorted s
    WHERE pt.track_id = s.track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CHALLENGE FUNCTIONS
-- ============================================================================

-- Initialize challenges for user
CREATE OR REPLACE FUNCTION public.initialize_user_challenges(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, progress, target)
    SELECT p_user_id, challenge_id, 0, 
        CASE challenge_type
            WHEN 'theme_master' THEN 5
            WHEN 'hidden_gem' THEN 1
            WHEN 'crowd_pleaser' THEN 1
            WHEN 'consistency_king' THEN 7
            WHEN 'discovery_champion' THEN 3
            ELSE 1
        END
    FROM public.playlist_challenges
    WHERE is_active = true
    ON CONFLICT (user_id, challenge_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim reward
CREATE OR REPLACE FUNCTION public.claim_challenge_reward(
    p_user_id UUID,
    p_challenge_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_challenge RECORD;
    v_progress RECORD;
BEGIN
    SELECT * INTO v_challenge FROM public.playlist_challenges WHERE challenge_id = p_challenge_id;
    SELECT * INTO v_progress FROM public.user_challenge_progress WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    IF v_progress IS NULL OR NOT v_progress.completed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge not completed');
    END IF;

    -- Award points and badges
    UPDATE public.curator_stats
    SET total_points = total_points + v_challenge.points_reward,
        curator_level = CASE
            WHEN total_points + v_challenge.points_reward >= 5000 THEN 21
            WHEN total_points + v_challenge.points_reward >= 2500 THEN 11
            WHEN total_points + v_challenge.points_reward >= 1000 THEN 6
            ELSE curator_level
        END,
        unlocked_badges = CASE
            WHEN v_challenge.badge_reward IS NOT NULL 
            THEN array_append(unlocked_badges, v_challenge.badge_reward)
            ELSE unlocked_badges
        END
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object('success', true, 'points', v_challenge.points_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
