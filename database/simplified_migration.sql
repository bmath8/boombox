-- ============================================================================
-- FAM MUSIC V.2 - SIMPLIFIED MIGRATION SCRIPT
-- ============================================================================
-- This version skips tables that already exist and focuses on new features
-- Safe to run on existing database
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- PART 2: FIX EXISTING USERS TABLE
-- ============================================================================

-- Add missing columns to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'last_active') THEN
        ALTER TABLE public.users ADD COLUMN last_active TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'settings') THEN
        ALTER TABLE public.users ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, last_active DESC);

-- ============================================================================
-- PART 3: TRACKS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tracks (
    track_id VARCHAR(100) PRIMARY KEY,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_id VARCHAR(100),
    album_art_url TEXT,
    duration_ms INTEGER,
    isrc VARCHAR(20),
    preview_url TEXT,
    popularity INTEGER,
    genres TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracks_search ON public.tracks USING GIN(to_tsvector('english', track_name || ' ' || artists));

-- ============================================================================
-- PART 4: DJ QUEUE (Sprint 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dj_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id),
    track_uri VARCHAR(255) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    album_art_url TEXT,
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_queue_station_status ON public.dj_queue(station_id, status);

-- ============================================================================
-- PART 5: TRACK VOTES (Sprint 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.track_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    track_uri VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES public.users(user_id),
    vote_type VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, track_uri, user_id)
);

-- ============================================================================
-- PART 6: DJ STATS (Sprint 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dj_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id),
    total_plays INTEGER DEFAULT 0,
    total_fires INTEGER DEFAULT 0,
    total_skips INTEGER DEFAULT 0,
    fire_rate FLOAT DEFAULT 0,
    total_broadcast_time_ms BIGINT DEFAULT 0,
    total_listeners_all_time INTEGER DEFAULT 0,
    average_listeners FLOAT DEFAULT 0,
    peak_listeners_all_time INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PART 7: DJ FOLLOWERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dj_followers (
    dj_id UUID REFERENCES public.users(user_id),
    follower_id UUID REFERENCES public.users(user_id),
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (dj_id, follower_id)
);

-- ============================================================================
-- PART 8: SCHEDULED SHOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_shows (
    show_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcaster_id UUID REFERENCES public.users(user_id),
    show_name VARCHAR(100) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    recurring_pattern VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PART 9: COLLABORATIVE PLAYLISTS (Sprint 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collaborative_playlists (
    playlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    playlist_name VARCHAR(200) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'custom',
    is_public BOOLEAN DEFAULT true,
    voting_enabled BOOLEAN DEFAULT true,
    auto_sort_by_votes BOOLEAN DEFAULT false,
    max_tracks_per_user INTEGER DEFAULT 10,
    cover_image_url TEXT,
    total_tracks INTEGER DEFAULT 0,
    total_collaborators INTEGER DEFAULT 1,
    total_plays INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    track_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(200) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist_name VARCHAR(200) NOT NULL,
    album_name VARCHAR(200),
    album_art_url TEXT,
    duration_ms INTEGER,
    added_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    vote_count INTEGER DEFAULT 0,
    position INTEGER,
    play_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by ON public.playlist_tracks(added_by);

CREATE TABLE IF NOT EXISTS public.playlist_track_votes (
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    voted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_track_votes_track ON public.playlist_track_votes(track_id);

CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'contributor',
    tracks_added INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (playlist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_user ON public.playlist_collaborators(user_id);

CREATE TABLE IF NOT EXISTS public.playlist_track_comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_comments_track ON public.playlist_track_comments(track_id);

CREATE TABLE IF NOT EXISTS public.track_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) CHECK (reaction_type IN ('fire', 'heart', 'cry', 'laugh', 'mind_blown')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(playlist_id, track_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.playlist_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_type VARCHAR(50) NOT NULL,
    challenge_name VARCHAR(100) NOT NULL,
    challenge_description TEXT,
    points_reward INTEGER DEFAULT 50,
    badge_reward VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.playlist_challenges(challenge_id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS public.curator_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    total_playlists_created INTEGER DEFAULT 0,
    total_tracks_added INTEGER DEFAULT 0,
    total_upvotes_received INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    curator_level INTEGER DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PART 10: BADGE SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.badge_metadata (
    badge_id VARCHAR(50) PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(10),
    badge_color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

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

INSERT INTO public.playlist_challenges (challenge_type, challenge_name, challenge_description, points_reward, badge_reward) VALUES
('theme_master', 'Theme Master', 'Add 5 tracks that match the playlist theme', 50, 'theme_master'),
('hidden_gem', 'Hidden Gem', 'Add a track with less than 100k Spotify plays that gets 10+ upvotes', 100, 'hidden_gem'),
('crowd_pleaser', 'Crowd Pleaser', 'Your track gets the most upvotes this week', 200, 'crowd_pleaser'),
('consistency_king', 'Consistency King', 'Add tracks to playlists 7 days in a row', 150, 'consistency_king'),
('discovery_champion', 'Discovery Champion', 'Introduce 3 friends to new artists via playlists', 75, 'discovery_champion')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 11: DATABASE FUNCTIONS
-- ============================================================================

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
    INSERT INTO public.collaborative_playlists (
        creator_id, playlist_name, description, theme, 
        voting_enabled, auto_sort_by_votes, max_tracks_per_user
    ) VALUES (
        p_creator_id, p_playlist_name, p_description, p_theme,
        p_voting_enabled, p_auto_sort, p_max_tracks
    )
    RETURNING playlist_id INTO v_playlist_id;
    
    INSERT INTO public.playlist_collaborators (playlist_id, user_id, role)
    VALUES (v_playlist_id, p_creator_id, 'creator');
    
    INSERT INTO public.curator_stats (user_id, total_playlists_created)
    VALUES (p_creator_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_playlists_created = curator_stats.total_playlists_created + 1;
    
    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_track_to_playlist(
    p_playlist_id UUID,
    p_user_id UUID,
    p_spotify_track_id VARCHAR(200),
    p_track_name VARCHAR(200),
    p_artist_name VARCHAR(200),
    p_album_name VARCHAR(200),
    p_album_art_url TEXT,
    p_duration_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_track_id UUID;
    v_user_track_count INTEGER;
    v_max_tracks INTEGER;
    v_next_position INTEGER;
BEGIN
    SELECT max_tracks_per_user INTO v_max_tracks
    FROM public.collaborative_playlists
    WHERE playlist_id = p_playlist_id;
    
    SELECT COUNT(*) INTO v_user_track_count
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id AND added_by = p_user_id;
    
    IF v_user_track_count >= v_max_tracks THEN
        RAISE EXCEPTION 'User has reached maximum tracks limit';
    END IF;
    
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id;
    
    INSERT INTO public.playlist_tracks (
        playlist_id, spotify_track_id, track_name, artist_name,
        album_name, album_art_url, duration_ms, added_by, position
    ) VALUES (
        p_playlist_id, p_spotify_track_id, p_track_name, p_artist_name,
        p_album_name, p_album_art_url, p_duration_ms, p_user_id, v_next_position
    )
    RETURNING track_id INTO v_track_id;
    
    UPDATE public.collaborative_playlists
    SET total_tracks = total_tracks + 1, updated_at = NOW()
    WHERE playlist_id = p_playlist_id;
    
    UPDATE public.playlist_collaborators
    SET tracks_added = tracks_added + 1
    WHERE playlist_id = p_playlist_id AND user_id = p_user_id;
    
    INSERT INTO public.curator_stats (user_id, total_tracks_added)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_tracks_added = curator_stats.total_tracks_added + 1;
    
    RETURN v_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.vote_on_playlist_track(
    p_playlist_id UUID,
    p_track_id UUID,
    p_user_id UUID,
    p_vote_type VARCHAR(10)
)
RETURNS VOID AS $$
DECLARE
    v_auto_sort BOOLEAN;
BEGIN
    INSERT INTO public.playlist_track_votes (playlist_id, track_id, user_id, vote_type)
    VALUES (p_playlist_id, p_track_id, p_user_id, p_vote_type)
    ON CONFLICT (playlist_id, track_id, user_id) 
    DO UPDATE SET vote_type = p_vote_type, voted_at = NOW();
    
    UPDATE public.playlist_tracks
    SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - 
               COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM public.playlist_track_votes
        WHERE track_id = p_track_id
    )
    WHERE track_id = p_track_id;
    
    SELECT auto_sort_by_votes INTO v_auto_sort
    FROM public.collaborative_playlists
    WHERE playlist_id = p_playlist_id;
    
    IF v_auto_sort THEN
        PERFORM public.auto_sort_playlist(p_playlist_id);
    END IF;
    
    IF p_vote_type = 'up' THEN
        UPDATE public.curator_stats cs
        SET total_upvotes_received = total_upvotes_received + 1
        FROM public.playlist_tracks pt
        WHERE pt.track_id = p_track_id AND cs.user_id = pt.added_by;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_sort_playlist(p_playlist_id UUID)
RETURNS VOID AS $$
DECLARE
    v_track RECORD;
    v_position INTEGER := 1;
BEGIN
    FOR v_track IN 
        SELECT track_id
        FROM public.playlist_tracks
        WHERE playlist_id = p_playlist_id
        ORDER BY vote_count DESC, added_at ASC
    LOOP
        UPDATE public.playlist_tracks
        SET position = v_position
        WHERE track_id = v_track.track_id;
        
        v_position := v_position + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_and_unlock_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_stats RECORD;
    v_new_badges TEXT[] := '{}';
BEGIN
    SELECT * INTO v_stats FROM public.dj_stats WHERE user_id = p_user_id;
    IF v_stats IS NULL THEN RETURN; END IF;

    IF v_stats.total_plays >= 1 AND NOT 'first_play' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'first_play');
    END IF;
    IF v_stats.total_plays >= 10 AND NOT 'ten_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'ten_plays');
    END IF;
    IF v_stats.total_plays >= 50 AND NOT 'fifty_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'fifty_plays');
    END IF;
    IF v_stats.total_plays >= 100 AND NOT 'hundred_plays' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'hundred_plays');
    END IF;
    IF v_stats.total_fires >= 100 AND NOT 'fire_master' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'fire_master');
    END IF;
    IF v_stats.fire_rate >= 80 AND v_stats.total_plays >= 20 AND NOT 'crowd_pleaser' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'crowd_pleaser');
    END IF;
    IF v_stats.level >= 6 AND NOT 'rising_star' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'rising_star');
    END IF;
    IF v_stats.level >= 11 AND NOT 'headliner' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'headliner');
    END IF;
    IF v_stats.level >= 21 AND NOT 'legend' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'legend');
    END IF;
    IF v_stats.total_points >= 1000 AND NOT 'thousand_points' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'thousand_points');
    END IF;
    IF v_stats.total_points >= 5000 AND NOT 'five_thousand_points' = ANY(v_stats.unlocked_badges) THEN
        v_new_badges := array_append(v_new_badges, 'five_thousand_points');
    END IF;

    IF array_length(v_new_badges, 1) > 0 THEN
        UPDATE public.dj_stats
        SET unlocked_badges = unlocked_badges || v_new_badges
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 12: TRIGGERS
-- ============================================================================

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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_playlists_modtime ON public.collaborative_playlists;
CREATE TRIGGER update_playlists_modtime 
    BEFORE UPDATE ON public.collaborative_playlists 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 13: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.dj_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_metadata ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for dj_queue') THEN
        CREATE POLICY "Allow all for dj_queue" ON public.dj_queue FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for track_votes') THEN
        CREATE POLICY "Allow all for track_votes" ON public.track_votes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for dj_stats') THEN
        CREATE POLICY "Allow all for dj_stats" ON public.dj_stats FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for dj_followers') THEN
        CREATE POLICY "Allow all for dj_followers" ON public.dj_followers FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for collaborative_playlists') THEN
        CREATE POLICY "Allow all for collaborative_playlists" ON public.collaborative_playlists FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for playlist_tracks') THEN
        CREATE POLICY "Allow all for playlist_tracks" ON public.playlist_tracks FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for playlist_track_votes') THEN
        CREATE POLICY "Allow all for playlist_track_votes" ON public.playlist_track_votes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for playlist_collaborators') THEN
        CREATE POLICY "Allow all for playlist_collaborators" ON public.playlist_collaborators FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for playlist_track_comments') THEN
        CREATE POLICY "Allow all for playlist_track_comments" ON public.playlist_track_comments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for track_reactions') THEN
        CREATE POLICY "Allow all for track_reactions" ON public.track_reactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for playlist_challenges') THEN
        CREATE POLICY "Allow all for playlist_challenges" ON public.playlist_challenges FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for user_challenge_progress') THEN
        CREATE POLICY "Allow all for user_challenge_progress" ON public.user_challenge_progress FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for curator_stats') THEN
        CREATE POLICY "Allow all for curator_stats" ON public.curator_stats FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for badge_metadata') THEN
        CREATE POLICY "Allow all for badge_metadata" ON public.badge_metadata FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
