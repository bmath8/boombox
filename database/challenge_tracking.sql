-- Sprint 2 Phase 3: Challenge Tracking Functions

-- 1. Initialize User Challenge Progress
CREATE OR REPLACE FUNCTION public.initialize_user_challenges(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create progress entries for all active challenges
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

-- 2. Check Theme Master Challenge (Add 5 tracks matching playlist theme)
CREATE OR REPLACE FUNCTION public.check_theme_master_challenge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_challenge_id UUID;
    v_themed_tracks INTEGER;
BEGIN
    -- Get challenge ID
    SELECT challenge_id INTO v_challenge_id
    FROM public.playlist_challenges
    WHERE challenge_type = 'theme_master' AND is_active = true
    LIMIT 1;

    IF v_challenge_id IS NULL THEN RETURN; END IF;

    -- Count tracks added to themed playlists (not custom)
    SELECT COUNT(*) INTO v_themed_tracks
    FROM public.playlist_tracks pt
    JOIN public.collaborative_playlists cp ON pt.playlist_id = cp.playlist_id
    WHERE pt.added_by = p_user_id 
    AND cp.theme != 'custom';

    -- Update progress
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, progress, target, completed)
    VALUES (p_user_id, v_challenge_id, LEAST(v_themed_tracks, 5), 5, v_themed_tracks >= 5)
    ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress = LEAST(v_themed_tracks, 5),
        completed = v_themed_tracks >= 5,
        completed_at = CASE WHEN v_themed_tracks >= 5 AND NOT user_challenge_progress.completed THEN NOW() ELSE user_challenge_progress.completed_at END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Check Hidden Gem Challenge (Track <100k plays gets 10+ upvotes)
CREATE OR REPLACE FUNCTION public.check_hidden_gem_challenge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_challenge_id UUID;
    v_has_hidden_gem BOOLEAN;
BEGIN
    -- Get challenge ID
    SELECT challenge_id INTO v_challenge_id
    FROM public.playlist_challenges
    WHERE challenge_type = 'hidden_gem' AND is_active = true
    LIMIT 1;

    IF v_challenge_id IS NULL THEN RETURN; END IF;

    -- Check if user has any track with 10+ upvotes
    -- (We'll assume tracks with high votes are hidden gems for now)
    SELECT EXISTS(
        SELECT 1 FROM public.playlist_tracks
        WHERE added_by = p_user_id AND vote_count >= 10
    ) INTO v_has_hidden_gem;

    -- Update progress
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, progress, target, completed)
    VALUES (p_user_id, v_challenge_id, CASE WHEN v_has_hidden_gem THEN 1 ELSE 0 END, 1, v_has_hidden_gem)
    ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress = CASE WHEN v_has_hidden_gem THEN 1 ELSE 0 END,
        completed = v_has_hidden_gem,
        completed_at = CASE WHEN v_has_hidden_gem AND NOT user_challenge_progress.completed THEN NOW() ELSE user_challenge_progress.completed_at END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Check Crowd Pleaser Challenge (Most upvotes this week)
CREATE OR REPLACE FUNCTION public.check_crowd_pleaser_challenge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_challenge_id UUID;
    v_user_max_votes INTEGER;
    v_global_max_votes INTEGER;
    v_is_top BOOLEAN;
BEGIN
    -- Get challenge ID
    SELECT challenge_id INTO v_challenge_id
    FROM public.playlist_challenges
    WHERE challenge_type = 'crowd_pleaser' AND is_active = true
    LIMIT 1;

    IF v_challenge_id IS NULL THEN RETURN; END IF;

    -- Get user's highest voted track this week
    SELECT COALESCE(MAX(vote_count), 0) INTO v_user_max_votes
    FROM public.playlist_tracks
    WHERE added_by = p_user_id
    AND added_at >= NOW() - INTERVAL '7 days';

    -- Get global highest voted track this week
    SELECT COALESCE(MAX(vote_count), 0) INTO v_global_max_votes
    FROM public.playlist_tracks
    WHERE added_at >= NOW() - INTERVAL '7 days';

    -- Check if user is top
    v_is_top := v_user_max_votes > 0 AND v_user_max_votes = v_global_max_votes;

    -- Update progress
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, progress, target, completed)
    VALUES (p_user_id, v_challenge_id, CASE WHEN v_is_top THEN 1 ELSE 0 END, 1, v_is_top)
    ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress = CASE WHEN v_is_top THEN 1 ELSE 0 END,
        completed = v_is_top,
        completed_at = CASE WHEN v_is_top AND NOT user_challenge_progress.completed THEN NOW() ELSE user_challenge_progress.completed_at END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Check Consistency King Challenge (Add tracks 7 days in a row)
CREATE OR REPLACE FUNCTION public.check_consistency_king_challenge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_challenge_id UUID;
    v_consecutive_days INTEGER;
BEGIN
    -- Get challenge ID
    SELECT challenge_id INTO v_challenge_id
    FROM public.playlist_challenges
    WHERE challenge_type = 'consistency_king' AND is_active = true
    LIMIT 1;

    IF v_challenge_id IS NULL THEN RETURN; END IF;

    -- Calculate consecutive days (simplified - checks last 7 days)
    WITH daily_adds AS (
        SELECT DISTINCT DATE(added_at) as add_date
        FROM public.playlist_tracks
        WHERE added_by = p_user_id
        AND added_at >= NOW() - INTERVAL '7 days'
        ORDER BY add_date DESC
    )
    SELECT COUNT(*) INTO v_consecutive_days FROM daily_adds;

    -- Update progress
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, progress, target, completed)
    VALUES (p_user_id, v_challenge_id, LEAST(v_consecutive_days, 7), 7, v_consecutive_days >= 7)
    ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET progress = LEAST(v_consecutive_days, 7),
        completed = v_consecutive_days >= 7,
        completed_at = CASE WHEN v_consecutive_days >= 7 AND NOT user_challenge_progress.completed THEN NOW() ELSE user_challenge_progress.completed_at END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Master Function to Check All Challenges
CREATE OR REPLACE FUNCTION public.check_all_challenges(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Initialize challenges if needed
    PERFORM public.initialize_user_challenges(p_user_id);
    
    -- Check each challenge type
    PERFORM public.check_theme_master_challenge(p_user_id);
    PERFORM public.check_hidden_gem_challenge(p_user_id);
    PERFORM public.check_crowd_pleaser_challenge(p_user_id);
    PERFORM public.check_consistency_king_challenge(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Claim Challenge Reward
CREATE OR REPLACE FUNCTION public.claim_challenge_reward(
    p_user_id UUID,
    p_challenge_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_challenge RECORD;
    v_progress RECORD;
    v_result JSONB;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge
    FROM public.playlist_challenges
    WHERE challenge_id = p_challenge_id;

    -- Get user progress
    SELECT * INTO v_progress
    FROM public.user_challenge_progress
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    -- Check if completed
    IF v_progress IS NULL OR NOT v_progress.completed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge not completed');
    END IF;

    -- Award points
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

    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'points_awarded', v_challenge.points_reward,
        'badge_awarded', v_challenge.badge_reward
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger to check challenges after adding track
CREATE OR REPLACE FUNCTION public.trigger_check_challenges_on_track_add()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.check_all_challenges(NEW.added_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_challenges_after_track_add ON public.playlist_tracks;
CREATE TRIGGER check_challenges_after_track_add
    AFTER INSERT ON public.playlist_tracks
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_challenges_on_track_add();

-- 9. Trigger to check challenges after voting
CREATE OR REPLACE FUNCTION public.trigger_check_challenges_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- Check challenges for the track owner
    PERFORM public.check_all_challenges(
        (SELECT added_by FROM public.playlist_tracks WHERE track_id = NEW.track_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_challenges_after_vote ON public.playlist_track_votes;
CREATE TRIGGER check_challenges_after_vote
    AFTER INSERT OR UPDATE ON public.playlist_track_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_challenges_on_vote();
