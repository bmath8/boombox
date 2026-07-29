-- FAM Music V.2 - Production Database Schema
-- PostgreSQL 15+
-- Includes: Partitioning, Composite Indexes, Full-Text Search, RLS

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite GIN indexes

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    country VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active, last_active DESC);

-- ============================================================================
-- LISTENING ACTIVITY (PARTITIONED)
-- ============================================================================

-- Main listening activity table with time-based partitioning
CREATE TABLE listening_activity (
    activity_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', 'youtube'
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_art_url TEXT,
    duration_ms INTEGER,
    played_at TIMESTAMP NOT NULL DEFAULT NOW(),
    listen_duration_ms INTEGER, -- How long they actually listened
    is_skipped BOOLEAN DEFAULT false,
    context_type VARCHAR(50), -- 'playlist', 'album', 'artist', 'radio'
    context_uri VARCHAR(255),
    idempotency_key VARCHAR(64) UNIQUE, -- Prevent duplicates on retry
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (activity_id, played_at)
) PARTITION BY RANGE (played_at);

-- Create partitions for current and next 6 months
CREATE TABLE listening_activity_2024_11 PARTITION OF listening_activity
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE listening_activity_2024_12 PARTITION OF listening_activity
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE listening_activity_2025_01 PARTITION OF listening_activity
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE listening_activity_2025_02 PARTITION OF listening_activity
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE listening_activity_2025_03 PARTITION OF listening_activity
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE listening_activity_2025_04 PARTITION OF listening_activity
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

-- CRITICAL: Composite indexes for common query patterns
CREATE INDEX idx_listening_user_time ON listening_activity(user_id, played_at DESC);
CREATE INDEX idx_listening_track_user ON listening_activity(track_id, user_id, played_at DESC);
CREATE INDEX idx_listening_platform ON listening_activity(platform, played_at DESC);

-- BRIN index for time-series efficiency (90% smaller than B-tree)
CREATE INDEX idx_listening_timestamp_brin ON listening_activity USING BRIN(played_at);

-- Index for idempotency checks
CREATE INDEX idx_listening_idempotency ON listening_activity(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- TRACKS CACHE (with Full-Text Search)
-- ============================================================================

CREATE TABLE tracks (
    track_id VARCHAR(100) PRIMARY KEY,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_id VARCHAR(100),
    album_art_url TEXT,
    duration_ms INTEGER,
    isrc VARCHAR(20),
    genres VARCHAR(500)[],
    release_date DATE,
    popularity INTEGER,
    audio_features JSONB, -- Spotify audio features (valence, energy, etc.)
    search_vector tsvector, -- For full-text search
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CRITICAL: Full-text search index
CREATE INDEX idx_tracks_search ON tracks USING GIN(search_vector);

-- Composite index for popular tracks
CREATE INDEX idx_tracks_popularity ON tracks(popularity DESC, track_name);

-- Auto-update search vector trigger
CREATE OR REPLACE FUNCTION tracks_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.track_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.artists, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.album_name, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracks_search_trigger
BEFORE INSERT OR UPDATE ON tracks
FOR EACH ROW EXECUTE FUNCTION tracks_search_update();

-- ============================================================================
-- FRIEND RELATIONSHIPS
-- ============================================================================

CREATE TABLE friendships (
    friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

-- ============================================================================
-- FRIEND GROUPS
-- ============================================================================

CREATE TABLE friend_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friend_group_members (
    group_id UUID REFERENCES friend_groups(group_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON friend_group_members(user_id);

-- ============================================================================
-- SHARED SONG DISCOVERY
-- ============================================================================

CREATE TABLE shared_songs (
    discovery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    discovery_type VARCHAR(50) NOT NULL, -- 'exact_match', 'same_artist', 'same_genre', 'ai_similarity'
    compatibility_score DECIMAL(5,2), -- 0.00 to 100.00
    user1_play_count INTEGER DEFAULT 1,
    user2_play_count INTEGER DEFAULT 1,
    first_discovered_at TIMESTAMP DEFAULT NOW(),
    last_updated_at TIMESTAMP DEFAULT NOW(),
    is_notified BOOLEAN DEFAULT false,
    UNIQUE(user1_id, user2_id, track_id, discovery_type)
);

CREATE INDEX idx_shared_songs_users ON shared_songs(user1_id, user2_id, last_updated_at DESC);
CREATE INDEX idx_shared_songs_track ON shared_songs(track_id);
CREATE INDEX idx_shared_songs_unnotified ON shared_songs(is_notified, first_discovered_at DESC) WHERE is_notified = false;

-- ============================================================================
-- RADIO STATIONS (Live Broadcasting)
-- ============================================================================

CREATE TABLE radio_stations (
    station_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcaster_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    privacy VARCHAR(20) DEFAULT 'friends', -- 'public', 'friends', 'private'
    status VARCHAR(20) DEFAULT 'offline', -- 'live', 'offline', 'scheduled'
    current_track_id VARCHAR(100),
    current_track_name VARCHAR(500),
    current_track_artists VARCHAR(500),
    current_position_ms INTEGER DEFAULT 0,
    track_started_at TIMESTAMP,
    listener_count INTEGER DEFAULT 0,
    total_listeners_today INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    went_live_at TIMESTAMP
);

CREATE INDEX idx_radio_broadcaster ON radio_stations(broadcaster_id);
CREATE INDEX idx_radio_live_stations ON radio_stations(status, listener_count DESC) WHERE status = 'live';
CREATE INDEX idx_radio_active ON radio_stations(last_active DESC);

-- ============================================================================
-- RADIO LISTENERS (Active Connections)
-- ============================================================================

CREATE TABLE radio_listeners (
    listener_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, user_id)
);

CREATE INDEX idx_radio_listeners_station ON radio_listeners(station_id, joined_at);
CREATE INDEX idx_radio_listeners_user ON radio_listeners(user_id);
CREATE INDEX idx_radio_listeners_heartbeat ON radio_listeners(last_heartbeat);

-- ============================================================================
-- RADIO SCHEDULED SHOWS
-- ============================================================================

CREATE TABLE radio_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    show_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    recurrence VARCHAR(50) DEFAULT 'once', -- 'once', 'daily', 'weekly', 'monthly'
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_radio_schedules_station ON radio_schedules(station_id, start_time);
CREATE INDEX idx_radio_schedules_upcoming ON radio_schedules(start_time) WHERE start_time > NOW();

-- ============================================================================
-- SONG REQUESTS (for Radio Stations)
-- ============================================================================

CREATE TABLE song_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'played', 'skipped', 'rejected'
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_song_requests_station ON song_requests(station_id, status, requested_at);
CREATE INDEX idx_song_requests_pending ON song_requests(station_id, requested_at) WHERE status = 'pending';

-- ============================================================================
-- RADIO CHAT MESSAGES
-- ============================================================================

CREATE TABLE radio_chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    CHECK (char_length(message) <= 500)
);

CREATE INDEX idx_radio_chat_station ON radio_chat_messages(station_id, sent_at DESC);
CREATE INDEX idx_radio_chat_user ON radio_chat_messages(user_id, sent_at DESC);

-- ============================================================================
-- RADIO BROADCAST HISTORY
-- ============================================================================

CREATE TABLE radio_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    broadcast_start TIMESTAMP NOT NULL,
    broadcast_end TIMESTAMP,
    peak_listeners INTEGER DEFAULT 0,
    total_unique_listeners INTEGER DEFAULT 0,
    total_tracks_played INTEGER DEFAULT 0,
    total_chat_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_radio_history_station ON radio_history(station_id, broadcast_start DESC);
CREATE INDEX idx_radio_history_time_brin ON radio_history USING BRIN(broadcast_start);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'shared_song', 'friend_request', 'radio_live', 'song_request'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional context
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- ============================================================================
-- SUMMARIES (Daily/Weekly/Monthly)
-- ============================================================================

CREATE TABLE summaries (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_tracks INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    top_tracks JSONB, -- Array of top tracks
    top_artists JSONB, -- Array of top artists
    top_genres JSONB, -- Array of top genres
    insights TEXT, -- AI-generated insights
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_summaries_user ON summaries(user_id, period_type, period_start DESC);

-- ============================================================================
-- SOCIAL MEDIA ACTIVITY
-- ============================================================================

CREATE TABLE social_media_activity (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram', 'youtube'
    post_id VARCHAR(255) NOT NULL,
    post_url TEXT,
    track_id VARCHAR(100),
    track_name VARCHAR(500),
    artists VARCHAR(500),
    detected_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, platform, post_id)
);

CREATE INDEX idx_social_activity_user ON social_media_activity(user_id, detected_at DESC);
CREATE INDEX idx_social_activity_platform ON social_media_activity(platform, detected_at DESC);

-- ============================================================================
-- SPOTIFY CACHE (API Response Caching)
-- ============================================================================

CREATE TABLE spotify_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_spotify_cache_expiry ON spotify_cache(expires_at);

-- Auto-cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM spotify_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- API CREDENTIALS (with Rotation Support)
-- ============================================================================

CREATE TABLE api_credentials (
    credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', 'tikapi', etc.
    key_type VARCHAR(50) NOT NULL, -- 'client_id', 'client_secret', 'access_token'
    encrypted_value TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    rotated_at TIMESTAMP
);

-- Only one active credential per service/type
CREATE UNIQUE INDEX idx_active_credential 
ON api_credentials(service, key_type, is_active) 
WHERE is_active = true;

CREATE INDEX idx_credentials_service ON api_credentials(service, is_active);

-- ============================================================================
-- MATERIALIZED VIEWS (for Analytics)
-- ============================================================================

-- Daily top tracks (refreshed daily)
CREATE MATERIALIZED VIEW daily_top_tracks AS
SELECT 
    DATE(played_at) as date,
    track_id,
    track_name,
    artists,
    COUNT(*) as play_count,
    COUNT(DISTINCT user_id) as unique_listeners
FROM listening_activity
WHERE played_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(played_at), track_id, track_name, artists
ORDER BY date DESC, play_count DESC;

CREATE INDEX ON daily_top_tracks(date, play_count DESC);

-- User listening stats (refreshed hourly)
CREATE MATERIALIZED VIEW user_listening_stats AS
SELECT 
    user_id,
    COUNT(*) as total_tracks,
    COUNT(DISTINCT track_id) as unique_tracks,
    COUNT(DISTINCT artists) as unique_artists,
    SUM(duration_ms) / 60000 as total_minutes,
    MAX(played_at) as last_played_at
FROM listening_activity
WHERE played_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id;

CREATE UNIQUE INDEX ON user_listening_stats(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- DJ Queue (for collaborative listening)
CREATE TABLE dj_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- Who added it
    track_uri VARCHAR(255) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artist_name VARCHAR(500) NOT NULL,
    album_art_url TEXT,
    duration_ms INTEGER,
    position INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'playing', 'played', 'skipped'
    added_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP
);

CREATE INDEX idx_dj_queue_station ON dj_queue(station_id, position);
CREATE INDEX idx_dj_queue_status ON dj_queue(station_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- USERS
-- Public profiles are visible to everyone
CREATE POLICY "Public profiles are viewable by everyone"
    ON users FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = user_id);

-- LISTENING ACTIVITY
-- Users can only see their own listening activity
CREATE POLICY "Users can view own listening activity"
    ON listening_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listening activity"
    ON listening_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listening activity"
    ON listening_activity FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listening activity"
    ON listening_activity FOR DELETE
    USING (auth.uid() = user_id);

-- Users can see their friends' activity
CREATE POLICY "Users can view friends listening activity"
    ON listening_activity FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships 
            WHERE user_id = auth.uid() 
            AND status = 'accepted'
        )
    );

-- FRIENDSHIPS
-- Users can manage their own friendships
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- NOTIFICATIONS
-- Users can see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- System/app can create notifications
CREATE POLICY "Allow notification creation"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- FRIEND GROUPS
CREATE POLICY "Users can view own friend groups"
    ON friend_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own friend groups"
    ON friend_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend groups"
    ON friend_groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own friend groups"
    ON friend_groups FOR DELETE
    USING (auth.uid() = user_id);

-- SHARED SONGS
CREATE POLICY "Users can view shared songs"
    ON shared_songs FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can share songs"
    ON shared_songs FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own shared songs"
    ON shared_songs FOR DELETE
    USING (auth.uid() = sender_id);

-- RADIO STATIONS
CREATE POLICY "Users can view accessible radio stations"
    ON radio_stations FOR SELECT
    USING (
        privacy = 'public' OR
        broadcaster_id = auth.uid() OR
        (privacy = 'friends' AND EXISTS (
            SELECT 1 FROM friendships
            WHERE (user_id = auth.uid() AND friend_id = broadcaster_id AND status = 'accepted')
               OR (friend_id = auth.uid() AND user_id = broadcaster_id AND status = 'accepted')
        ))
    );

CREATE POLICY "Users can create own radio stations"
    ON radio_stations FOR INSERT
    WITH CHECK (auth.uid() = broadcaster_id);

CREATE POLICY "Broadcasters can update own stations"
    ON radio_stations FOR UPDATE
    USING (auth.uid() = broadcaster_id);

CREATE POLICY "Broadcasters can delete own stations"
    ON radio_stations FOR DELETE
    USING (auth.uid() = broadcaster_id);

-- DJ QUEUE
CREATE POLICY "Public can view dj queue"
    ON dj_queue FOR SELECT
    USING (true);

CREATE POLICY "Broadcasters can manage dj queue"
    ON dj_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM radio_stations
            WHERE station_id = dj_queue.station_id
            AND broadcaster_id = auth.uid()
        )
    );

-- RADIO LISTENERS
CREATE POLICY "Public can view listeners"
    ON radio_listeners FOR SELECT
    USING (true);

CREATE POLICY "Users can join as listener"
    ON radio_listeners FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave as listener"
    ON radio_listeners FOR DELETE
    USING (auth.uid() = user_id);

-- RADIO CHAT
CREATE POLICY "Public can view chat"
    ON radio_chat_messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can chat"
    ON radio_chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- SONG REQUESTS
CREATE POLICY "Broadcasters can view requests"
    ON song_requests FOR SELECT
    USING (
        auth.uid() = requester_id OR
        EXISTS (
            SELECT 1 FROM radio_stations
            WHERE station_id = song_requests.station_id
            AND broadcaster_id = auth.uid()
        )
    );

CREATE POLICY "Users can make requests"
    ON song_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Broadcasters can update requests"
    ON song_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM radio_stations
            WHERE station_id = song_requests.station_id
            AND broadcaster_id = auth.uid()
        )
    );

-- SUMMARIES
CREATE POLICY "Users can view own summaries"
    ON summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow summary creation"
    ON summaries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own summaries"
    ON summaries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
    ON summaries FOR DELETE
    USING (auth.uid() = user_id);

-- API CREDENTIALS
-- Only service role can access credentials
CREATE POLICY "Service role only credentials"
    ON api_credentials FOR ALL
    USING (false); -- Deny all access to authenticated users

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update listener count on radio stations
CREATE OR REPLACE FUNCTION update_radio_listener_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE radio_stations 
        SET listener_count = listener_count + 1,
            total_listeners_today = total_listeners_today + 1
        WHERE station_id = NEW.station_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE radio_stations 
        SET listener_count = GREATEST(listener_count - 1, 0)
        WHERE station_id = OLD.station_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER radio_listener_count_trigger
AFTER INSERT OR DELETE ON radio_listeners
FOR EACH ROW EXECUTE FUNCTION update_radio_listener_count();

-- Function to clean up stale radio listeners (no heartbeat in 60 seconds)
CREATE OR REPLACE FUNCTION cleanup_stale_listeners()
RETURNS void AS $$
BEGIN
    DELETE FROM radio_listeners 
    WHERE last_heartbeat < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Currently playing feed (for friends)
CREATE OR REPLACE VIEW v_currently_playing_feed AS
SELECT 
    la.activity_id,
    la.user_id,
    u.display_name,
    u.avatar_url,
    la.track_id,
    la.track_name,
    la.artists,
    la.album_name,
    la.album_art_url,
    la.platform,
    la.played_at,
    EXTRACT(EPOCH FROM (NOW() - la.played_at)) as seconds_ago
FROM listening_activity la
JOIN users u ON la.user_id = u.user_id
WHERE la.played_at >= NOW() - INTERVAL '5 minutes'
ORDER BY la.played_at DESC;

-- Live radio stations
CREATE OR REPLACE VIEW v_live_radio_stations AS
SELECT 
    rs.station_id,
    rs.broadcaster_id,
    u.display_name as broadcaster_name,
    u.avatar_url as broadcaster_avatar,
    rs.station_name,
    rs.description,
    rs.genre,
    rs.current_track_name,
    rs.current_track_artists,
    rs.listener_count,
    rs.went_live_at,
    EXTRACT(EPOCH FROM (NOW() - rs.went_live_at)) as live_duration_seconds
FROM radio_stations rs
JOIN users u ON rs.broadcaster_id = u.user_id
WHERE rs.status = 'live'
ORDER BY rs.listener_count DESC, rs.went_live_at DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional performance indexes
CREATE INDEX idx_users_last_active ON users(last_active DESC) WHERE is_active = true;
CREATE INDEX idx_tracks_updated ON tracks(updated_at DESC);
CREATE INDEX idx_friendships_accepted ON friendships(user_id) WHERE status = 'accepted';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE listening_activity IS 'Partitioned table storing all user listening history';
COMMENT ON TABLE tracks IS 'Cached track metadata with full-text search support';
COMMENT ON TABLE radio_stations IS 'Live radio broadcasting stations';
COMMENT ON TABLE radio_listeners IS 'Active listeners on radio stations';
COMMENT ON TABLE spotify_cache IS 'Caches Spotify API responses to reduce API calls';
COMMENT ON TABLE api_credentials IS 'Encrypted API credentials with rotation support';

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert system user for automated processes
INSERT INTO users (user_id, email, display_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@fammusic.app', 'System', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS (for application user)
-- ============================================================================

-- Create application user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'fammusic_app') THEN
        CREATE USER fammusic_app WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO fammusic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fammusic_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fammusic_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fammusic_app;

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Schedule automatic partition creation (run monthly)
-- This should be set up as a cron job or scheduled task

-- Schedule cache cleanup (run daily)
-- This should be set up as a cron job: SELECT cleanup_expired_cache();

-- Schedule stale listener cleanup (run every minute)
-- This should be set up as a cron job: SELECT cleanup_stale_listeners();

-- Schedule materialized view refresh
-- Daily: REFRESH MATERIALIZED VIEW CONCURRENTLY daily_top_tracks;
-- Hourly: REFRESH MATERIALIZED VIEW CONCURRENTLY user_listening_stats;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
