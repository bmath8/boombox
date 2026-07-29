-- FAM Music V.2 - Supabase Setup Script
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users if needed, but we use a separate table here)
-- Note: In a real Supabase app, you might want to trigger this from auth.users
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_active DESC);

-- ============================================================================
-- RADIO STATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS radio_stations (
    station_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcaster_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    privacy VARCHAR(20) DEFAULT 'friends',
    status VARCHAR(20) DEFAULT 'offline',
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

CREATE INDEX IF NOT EXISTS idx_radio_broadcaster ON radio_stations(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_radio_live_stations ON radio_stations(status, listener_count DESC) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_radio_active ON radio_stations(last_active DESC);

-- ============================================================================
-- RADIO LISTENERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS radio_listeners (
    listener_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_radio_listeners_station ON radio_listeners(station_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_user ON radio_listeners(user_id);

-- ============================================================================
-- SONG REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS song_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_song_requests_station ON song_requests(station_id, status, requested_at);

-- ============================================================================
-- RADIO CHAT
-- ============================================================================

CREATE TABLE IF NOT EXISTS radio_chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES radio_stations(station_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    CHECK (char_length(message) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_radio_chat_station ON radio_chat_messages(station_id, sent_at DESC);

-- ============================================================================
-- LISTENING ACTIVITY (Simplified for Dev)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listening_activity (
    activity_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_art_url TEXT,
    duration_ms INTEGER,
    played_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (activity_id)
);

CREATE INDEX IF NOT EXISTS idx_listening_user_time ON listening_activity(user_id, played_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_activity ENABLE ROW LEVEL SECURITY;

-- Open access policies for development (WARNING: Secure this for production!)
CREATE POLICY "Public access for users" ON users FOR ALL USING (true);
CREATE POLICY "Public access for radio_stations" ON radio_stations FOR ALL USING (true);
CREATE POLICY "Public access for radio_listeners" ON radio_listeners FOR ALL USING (true);
CREATE POLICY "Public access for song_requests" ON song_requests FOR ALL USING (true);
CREATE POLICY "Public access for radio_chat_messages" ON radio_chat_messages FOR ALL USING (true);
CREATE POLICY "Public access for listening_activity" ON listening_activity FOR ALL USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to handle new user signup (links Supabase Auth to our users table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
