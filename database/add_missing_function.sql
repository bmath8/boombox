-- Missing Function: initialize_user_challenges
-- This function was referenced in the code but not included in simplified_migration.sql

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
