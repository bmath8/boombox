-- =====================================================
-- FAM MUSIC V.3 - Social Features Tables Migration
-- Created: 2025-12-06
-- Description: Adds tables for DJ follows, listener sessions, and listening history
-- =====================================================

-- =====================================================
-- DJ FOLLOWS TABLE
-- Tracks follower relationships between users and DJs
-- =====================================================
CREATE TABLE IF NOT EXISTS dj_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, dj_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_dj_follows_follower_id ON dj_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_dj_follows_dj_id ON dj_follows(dj_id);
CREATE INDEX IF NOT EXISTS idx_dj_follows_created_at ON dj_follows(created_at DESC);

-- RLS Policies for dj_follows
ALTER TABLE dj_follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows and who follows them
CREATE POLICY "Users can view their follows" ON dj_follows
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = dj_id
    );

-- Users can follow/unfollow DJs
CREATE POLICY "Users can manage their follows" ON dj_follows
    FOR ALL USING (auth.uid() = follower_id);

-- =====================================================
-- LISTENER SESSIONS TABLE
-- Tracks listening session durations for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS listener_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_token TEXT, -- For anonymous session tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms INTEGER, -- Calculated when session ends
    peak_concurrent_listeners INTEGER DEFAULT 0,
    client_info JSONB DEFAULT '{}', -- Browser, device info
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_listener_sessions_station_id ON listener_sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_listener_sessions_user_id ON listener_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_listener_sessions_started_at ON listener_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_listener_sessions_ended_at ON listener_sessions(ended_at DESC);

-- RLS Policies for listener_sessions
ALTER TABLE listener_sessions ENABLE ROW LEVEL SECURITY;

-- Broadcasters can view sessions for their stations
CREATE POLICY "Broadcasters can view station sessions" ON listener_sessions
    FOR SELECT USING (
        station_id IN (
            SELECT station_id FROM radio_stations 
            WHERE broadcaster_id = auth.uid()
        )
    );

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON listener_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert a session (for tracking)
CREATE POLICY "Anyone can create sessions" ON listener_sessions
    FOR INSERT WITH CHECK (true);

-- Only session owner can update
CREATE POLICY "Users can update own sessions" ON listener_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- LISTENING HISTORY TABLE
-- Tracks individual tracks played by users
-- =====================================================
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT,
    album_art TEXT,
    track_uri TEXT, -- Spotify URI or other identifier
    played_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    station_id UUID REFERENCES radio_stations(station_id) ON DELETE SET NULL,
    station_name TEXT,
    source TEXT NOT NULL CHECK (source IN ('spotify', 'radio', 'playlist')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_source ON listening_history(source);
CREATE INDEX IF NOT EXISTS idx_listening_history_track_uri ON listening_history(track_uri);

-- RLS Policies for listening_history
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view own history" ON listening_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own history" ON listening_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own history" ON listening_history
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CHAT REACTIONS TABLE
-- Stores emoji reactions on chat messages
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES radio_chat_messages(message_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user_id ON chat_reactions(user_id);

-- RLS Policies for chat_reactions
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions" ON chat_reactions
    FOR SELECT USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Users can add reactions" ON chat_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions" ON chat_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PINNED MESSAGES TABLE
-- Tracks pinned messages per station
-- =====================================================
CREATE TABLE IF NOT EXISTS pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES radio_chat_messages(message_id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(station_id, message_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pinned_messages_station_id ON pinned_messages(station_id);

-- RLS Policies for pinned_messages
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view pinned messages
CREATE POLICY "Anyone can view pinned messages" ON pinned_messages
    FOR SELECT USING (true);

-- Only broadcasters can pin/unpin
CREATE POLICY "Broadcasters can manage pins" ON pinned_messages
    FOR ALL USING (
        pinned_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM radio_stations 
            WHERE station_id = pinned_messages.station_id 
            AND broadcaster_id = auth.uid()
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get follower count for a DJ
CREATE OR REPLACE FUNCTION get_follower_count(target_dj_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM dj_follows 
        WHERE dj_id = target_dj_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM dj_follows 
        WHERE follower_id = target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user follows a DJ
CREATE OR REPLACE FUNCTION is_following(follower UUID, dj UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM dj_follows 
        WHERE follower_id = follower 
        AND dj_id = dj
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get listening stats for a user
CREATE OR REPLACE FUNCTION get_listening_stats(target_user_id UUID, time_range INTERVAL DEFAULT '7 days')
RETURNS TABLE (
    total_tracks BIGINT,
    total_duration_ms BIGINT,
    top_artist TEXT,
    top_station TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT *
        FROM listening_history
        WHERE user_id = target_user_id
        AND played_at > NOW() - time_range
    ),
    top_artist_cte AS (
        SELECT artist_name, COUNT(*) as cnt
        FROM stats
        GROUP BY artist_name
        ORDER BY cnt DESC
        LIMIT 1
    ),
    top_station_cte AS (
        SELECT station_name, COUNT(*) as cnt
        FROM stats
        WHERE station_name IS NOT NULL
        GROUP BY station_name
        ORDER BY cnt DESC
        LIMIT 1
    )
    SELECT 
        (SELECT COUNT(*) FROM stats)::BIGINT as total_tracks,
        (SELECT COALESCE(SUM(duration_ms), 0) FROM stats)::BIGINT as total_duration_ms,
        (SELECT artist_name FROM top_artist_cte) as top_artist,
        (SELECT station_name FROM top_station_cte) as top_station;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON dj_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE ON listener_sessions TO authenticated;
GRANT SELECT ON listener_sessions TO anon;
GRANT SELECT, INSERT, DELETE ON listening_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON chat_reactions TO authenticated;
GRANT SELECT ON chat_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON pinned_messages TO authenticated;
GRANT SELECT ON pinned_messages TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Social features tables migration completed successfully!';
END $$;
