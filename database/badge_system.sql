-- Badge Unlock System
-- Automatically awards badges based on DJ achievements

-- Function to check and unlock badges for a user
CREATE OR REPLACE FUNCTION public.check_and_unlock_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_stats RECORD;
    v_new_badges TEXT[] := '{}';
BEGIN
    -- Get current stats
    SELECT * INTO v_stats
    FROM public.dj_stats
    WHERE user_id = p_user_id;

    IF v_stats IS NULL THEN
        RETURN;
    END IF;

    -- Check for badges to unlock
    -- First Play Badge
    IF v_stats.total_plays >= 1 AND NOT 'first_play' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'first_play');
    END IF;

    -- 10 Plays Badge
    IF v_stats.total_plays >= 10 AND NOT 'ten_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'ten_plays');
    END IF;

    -- 50 Plays Badge
    IF v_stats.total_plays >= 50 AND NOT 'fifty_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'fifty_plays');
    END IF;

    -- 100 Plays Badge
    IF v_stats.total_plays >= 100 AND NOT 'hundred_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'hundred_plays');
    END IF;

    -- Fire Master (100+ fires)
    IF v_stats.total_fires >= 100 AND NOT 'fire_master' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'fire_master');
    END IF;

    -- Crowd Pleaser (80%+ fire rate with 20+ plays)
    IF v_stats.fire_rate >= 80 AND v_stats.total_plays >= 20 AND NOT 'crowd_pleaser' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'crowd_pleaser');
    END IF;

    -- Rising Star (Level 6+)
    IF v_stats.level >= 6 AND NOT 'rising_star' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'rising_star');
    END IF;

    -- Headliner (Level 11+)
    IF v_stats.level >= 11 AND NOT 'headliner' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'headliner');
    END IF;

    -- Legend (Level 21+)
    IF v_stats.level >= 21 AND NOT 'legend' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'legend');
    END IF;

    -- Point Milestones
    IF v_stats.total_points >= 1000 AND NOT 'thousand_points' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'thousand_points');
    END IF;

    IF v_stats.total_points >= 5000 AND NOT 'five_thousand_points' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'five_thousand_points');
    END IF;

    -- Update badges if any new ones unlocked
    IF array_length(v_new_badges, 1) > 0 THEN
        UPDATE public.dj_stats
        SET unlocked_badges = unlocked_badges || v_new_badges
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check badges after stats update
CREATE OR REPLACE FUNCTION public.trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.check_and_unlock_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges_after_stats_update ON public.dj_stats;
CREATE TRIGGER check_badges_after_stats_update
    AFTER INSERT OR UPDATE ON public.dj_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_badges();

-- Badge metadata table (for display info)
CREATE TABLE IF NOT EXISTS public.badge_metadata (
    badge_id VARCHAR(50) PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(10), -- Emoji
    badge_color VARCHAR(7), -- Hex color
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert badge metadata
INSERT INTO public.badge_metadata (badge_id, badge_name, badge_description, badge_icon, badge_color) VALUES
('first_play', 'First Spin', 'Played your first track as DJ', '🎵', '#8B5CF6'),
('ten_plays', 'Getting Started', 'Played 10 tracks as DJ', '🎧', '#8B5CF6'),
('fifty_plays', 'Regular DJ', 'Played 50 tracks as DJ', '🎤', '#A855F7'),
('hundred_plays', 'Veteran DJ', 'Played 100 tracks as DJ', '🎸', '#C084FC'),
('fire_master', 'Fire Master', 'Received 100+ fire votes', '🔥', '#F97316'),
('crowd_pleaser', 'Crowd Pleaser', '80%+ fire rate with 20+ plays', '⭐', '#FBBF24'),
('rising_star', 'Rising Star', 'Reached Level 6', '🌟', '#3B82F6'),
('headliner', 'Headliner', 'Reached Level 11', '💫', '#EC4899'),
('legend', 'Legend', 'Reached Level 21', '👑', '#EAB308'),
('thousand_points', '1K Points', 'Earned 1,000 points', '💯', '#10B981'),
('five_thousand_points', '5K Points', 'Earned 5,000 points', '💎', '#06B6D4')
ON CONFLICT (badge_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.badge_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for badge_metadata" ON public.badge_metadata FOR ALL USING (true);
