-- Sprint 1: Radio Station Enhancements
-- DJ Queue System, Track Voting, DJ Points & Stats

-- 1. DJ Queue System
CREATE TABLE IF NOT EXISTS public.dj_queue (
    queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    track_id VARCHAR(200), -- Spotify track ID
    track_name VARCHAR(200),
    artist_name VARCHAR(200),
    album_art_url TEXT,
    queued_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- pending, playing, played, skipped
    UNIQUE(station_id, user_id, status) -- One pending track per user per station
);

CREATE INDEX IF NOT EXISTS idx_dj_queue_station ON public.dj_queue(station_id, status);
CREATE INDEX IF NOT EXISTS idx_dj_queue_position ON public.dj_queue(station_id, position);

-- 2. Track Voting System
CREATE TABLE IF NOT EXISTS public.track_votes (
    vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    track_id VARCHAR(200) NOT NULL,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('fire', 'skip')),
    voted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, track_id, user_id) -- One vote per user per track per station
);

CREATE INDEX IF NOT EXISTS idx_track_votes_station_track ON public.track_votes(station_id, track_id);

-- 3. DJ Stats & Points
CREATE TABLE IF NOT EXISTS public.dj_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_plays INTEGER DEFAULT 0,
    total_fires INTEGER DEFAULT 0,
    total_skips INTEGER DEFAULT 0,
    fire_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (0-100)
    level INTEGER DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT '{}', -- Array of badge IDs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. DJ Followers
CREATE TABLE IF NOT EXISTS public.dj_followers (
    follower_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    dj_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT NOW(),
    notifications_enabled BOOLEAN DEFAULT true,
    PRIMARY KEY (follower_id, dj_id)
);

CREATE INDEX IF NOT EXISTS idx_dj_followers_dj ON public.dj_followers(dj_id);

-- 5. Room Customization (extend radio_stations)
ALTER TABLE public.radio_stations ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE public.radio_stations ADD COLUMN IF NOT EXISTS genre_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.radio_stations ADD COLUMN IF NOT EXISTS room_color VARCHAR(7) DEFAULT '#8B5CF6'; -- Purple
ALTER TABLE public.radio_stations ADD COLUMN IF NOT EXISTS custom_background_url TEXT;

-- 6. Functions for DJ Queue Management

-- Function to add user to DJ queue
CREATE OR REPLACE FUNCTION public.join_dj_queue(
    p_station_id UUID,
    p_user_id UUID,
    p_track_id VARCHAR(200),
    p_track_name VARCHAR(200),
    p_artist_name VARCHAR(200),
    p_album_art_url TEXT
)
RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
    v_next_position INTEGER;
BEGIN
    -- Get next position in queue
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM public.dj_queue
    WHERE station_id = p_station_id AND status = 'pending';
    
    -- Insert into queue
    INSERT INTO public.dj_queue (
        station_id, user_id, position, track_id, track_name, artist_name, album_art_url
    ) VALUES (
        p_station_id, p_user_id, v_next_position, p_track_id, p_track_name, p_artist_name, p_album_art_url
    )
    ON CONFLICT (station_id, user_id, status) 
    DO UPDATE SET 
        track_id = p_track_id,
        track_name = p_track_name,
        artist_name = p_artist_name,
        album_art_url = p_album_art_url,
        queued_at = NOW()
    RETURNING queue_id INTO v_queue_id;
    
    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next DJ in queue
CREATE OR REPLACE FUNCTION public.get_next_dj(p_station_id UUID)
RETURNS TABLE (
    queue_id UUID,
    user_id UUID,
    display_name VARCHAR(100),
    track_id VARCHAR(200),
    track_name VARCHAR(200),
    artist_name VARCHAR(200),
    album_art_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dq.queue_id,
        dq.user_id,
        u.display_name,
        dq.track_id,
        dq.track_name,
        dq.artist_name,
        dq.album_art_url
    FROM public.dj_queue dq
    JOIN public.users u ON dq.user_id = u.user_id
    WHERE dq.station_id = p_station_id 
    AND dq.status = 'pending'
    ORDER BY dq.position ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark track as played and update DJ stats
CREATE OR REPLACE FUNCTION public.complete_dj_turn(
    p_queue_id UUID,
    p_was_skipped BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_fire_count INTEGER;
    v_skip_count INTEGER;
BEGIN
    -- Get user_id and vote counts
    SELECT dq.user_id INTO v_user_id
    FROM public.dj_queue dq
    WHERE dq.queue_id = p_queue_id;
    
    -- Count votes for this track
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'fire'),
        COUNT(*) FILTER (WHERE vote_type = 'skip')
    INTO v_fire_count, v_skip_count
    FROM public.track_votes tv
    JOIN public.dj_queue dq ON tv.station_id = dq.station_id AND tv.track_id = dq.track_id
    WHERE dq.queue_id = p_queue_id;
    
    -- Update queue status
    UPDATE public.dj_queue
    SET status = CASE WHEN p_was_skipped THEN 'skipped' ELSE 'played' END
    WHERE queue_id = p_queue_id;
    
    -- Update DJ stats
    INSERT INTO public.dj_stats (user_id, total_plays, total_fires, total_skips, total_points)
    VALUES (
        v_user_id,
        1,
        v_fire_count,
        v_skip_count,
        (v_fire_count * 10) - (v_skip_count * 5) -- +10 per fire, -5 per skip
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_plays = dj_stats.total_plays + 1,
        total_fires = dj_stats.total_fires + v_fire_count,
        total_skips = dj_stats.total_skips + v_skip_count,
        total_points = dj_stats.total_points + (v_fire_count * 10) - (v_skip_count * 5),
        fire_rate = CASE 
            WHEN (dj_stats.total_fires + v_fire_count + dj_stats.total_skips + v_skip_count) > 0
            THEN ((dj_stats.total_fires + v_fire_count)::DECIMAL / 
                  (dj_stats.total_fires + v_fire_count + dj_stats.total_skips + v_skip_count) * 100)
            ELSE 0
        END,
        level = CASE
            WHEN dj_stats.total_points + (v_fire_count * 10) - (v_skip_count * 5) >= 5000 THEN 21
            WHEN dj_stats.total_points + (v_fire_count * 10) - (v_skip_count * 5) >= 2500 THEN 11
            WHEN dj_stats.total_points + (v_fire_count * 10) - (v_skip_count * 5) >= 1000 THEN 6
            ELSE 1
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on track
CREATE OR REPLACE FUNCTION public.vote_on_track(
    p_station_id UUID,
    p_track_id VARCHAR(200),
    p_user_id UUID,
    p_vote_type VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.track_votes (station_id, track_id, user_id, vote_type)
    VALUES (p_station_id, p_track_id, p_user_id, p_vote_type)
    ON CONFLICT (station_id, track_id, user_id) 
    DO UPDATE SET 
        vote_type = p_vote_type,
        voted_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vote counts for current track
CREATE OR REPLACE FUNCTION public.get_track_votes(
    p_station_id UUID,
    p_track_id VARCHAR(200)
)
RETURNS TABLE (
    fire_count BIGINT,
    skip_count BIGINT,
    total_votes BIGINT,
    skip_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'fire') as fire_count,
        COUNT(*) FILTER (WHERE vote_type = 'skip') as skip_count,
        COUNT(*) as total_votes,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE vote_type = 'skip')::DECIMAL / COUNT(*) * 100)
            ELSE 0
        END as skip_percentage
    FROM public.track_votes
    WHERE station_id = p_station_id AND track_id = p_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.dj_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_followers ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
CREATE POLICY "Allow all for dj_queue" ON public.dj_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for track_votes" ON public.track_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dj_stats" ON public.dj_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dj_followers" ON public.dj_followers FOR ALL USING (true) WITH CHECK (true);
