-- 01_core_schema.sql
-- Extensions and Core Tables (Users, Listening Activity)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite GIN indexes

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, last_active DESC);

-- ============================================================================
-- LISTENING ACTIVITY (PARTITIONED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.listening_activity (
    activity_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', 'youtube'
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_art_url TEXT,
    duration_ms INTEGER,
    played_at TIMESTAMP NOT NULL DEFAULT NOW(),
    listen_duration_ms INTEGER,
    is_skipped BOOLEAN DEFAULT false,
    context_type VARCHAR(50),
    context_uri VARCHAR(255),
    idempotency_key VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (activity_id, played_at),
    UNIQUE (idempotency_key, played_at)
) PARTITION BY RANGE (played_at);

-- Partitions (Current + Next 6 Months)
CREATE TABLE IF NOT EXISTS public.listening_activity_2024_11 PARTITION OF public.listening_activity FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS public.listening_activity_2024_12 PARTITION OF public.listening_activity FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS public.listening_activity_2025_01 PARTITION OF public.listening_activity FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS public.listening_activity_2025_02 PARTITION OF public.listening_activity FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS public.listening_activity_2025_03 PARTITION OF public.listening_activity FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS public.listening_activity_2025_04 PARTITION OF public.listening_activity FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listening_user_time ON public.listening_activity(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_track_user ON public.listening_activity(track_id, user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_platform ON public.listening_activity(platform, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_timestamp_brin ON public.listening_activity USING BRIN(played_at);

-- ============================================================================
-- TRACKS CACHE
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
