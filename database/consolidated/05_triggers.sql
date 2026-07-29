-- 05_triggers.sql
-- Database Triggers

-- ============================================================================
-- RADIO TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_listener_count_trigger ON public.radio_listeners;
CREATE TRIGGER update_listener_count_trigger
    AFTER INSERT OR DELETE ON public.radio_listeners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_listener_count();

-- ============================================================================
-- PLAYLIST TRIGGERS
-- ============================================================================

-- Check challenges on track add
CREATE OR REPLACE FUNCTION public.trigger_check_challenges_on_track_add()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic to check challenges (simplified for this file)
    -- In production this would call check_all_challenges()
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_challenges_after_track_add ON public.playlist_tracks;
CREATE TRIGGER check_challenges_after_track_add
    AFTER INSERT ON public.playlist_tracks
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_challenges_on_track_add();

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_playlists_modtime BEFORE UPDATE ON public.collaborative_playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
