-- 02_radio_schema.sql
-- Radio Stations, Listeners, Queue, Chat

-- ============================================================================
-- RADIO STATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.radio_stations (
    station_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_name VARCHAR(100) NOT NULL,
    broadcaster_id UUID NOT NULL REFERENCES public.users(user_id),
    status VARCHAR(20) DEFAULT 'offline', -- 'live', 'offline'
    current_track_id VARCHAR(100),
    current_track_uri VARCHAR(255),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    went_live_at TIMESTAMP,
    total_listeners INTEGER DEFAULT 0,
    peak_listeners INTEGER DEFAULT 0,
    description TEXT,
    tags TEXT[],
    theme VARCHAR(50) DEFAULT 'standard',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_status ON public.radio_stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_broadcaster ON public.radio_stations(broadcaster_id);

-- ============================================================================
-- RADIO LISTENERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.radio_listeners (
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_ping TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (station_id, user_id)
);

-- ============================================================================
-- DJ QUEUE
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
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'playing', 'played', 'skipped'
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_queue_station_status ON public.dj_queue(station_id, status);

-- ============================================================================
-- TRACK VOTES (Fire/Skip)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.track_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    track_uri VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES public.users(user_id),
    vote_type VARCHAR(10) NOT NULL, -- 'fire', 'skip'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, track_uri, user_id)
);

-- ============================================================================
-- STATION CHAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.station_chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_station_time ON public.station_chat_messages(station_id, created_at DESC);

-- ============================================================================
-- DJ STATS & FOLLOWERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dj_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id),
    total_broadcast_time_ms BIGINT DEFAULT 0,
    total_listeners_all_time INTEGER DEFAULT 0,
    average_listeners FLOAT DEFAULT 0,
    peak_listeners_all_time INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    dj_level INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dj_followers (
    dj_id UUID REFERENCES public.users(user_id),
    follower_id UUID REFERENCES public.users(user_id),
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (dj_id, follower_id)
);

-- ============================================================================
-- BADGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badge_metadata (
    badge_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50), -- 'dj', 'listener', 'social'
    points_value INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES public.users(user_id),
    badge_id VARCHAR(50) REFERENCES public.badge_metadata(badge_id),
    awarded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);
