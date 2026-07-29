-- FAM Music V.2 - Remaining Database Tables
-- Run this in Supabase SQL Editor to add all missing tables

-- ============================================================================
-- RADIO LISTENERS (Track who's listening to each station)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.radio_listeners (
    listener_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_radio_listeners_station 
ON public.radio_listeners(station_id, joined_at);

CREATE INDEX IF NOT EXISTS idx_radio_listeners_user 
ON public.radio_listeners(user_id);

-- ============================================================================
-- RADIO CHAT MESSAGES (Live chat per station)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.radio_chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    CHECK (char_length(message) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_radio_chat_station 
ON public.radio_chat_messages(station_id, sent_at DESC);

-- ============================================================================
-- LISTENING ACTIVITY (Track what users are listening to)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listening_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artists VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    album_art_url TEXT,
    duration_ms INTEGER,
    played_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listening_user_time 
ON public.listening_activity(user_id, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_listening_track 
ON public.listening_activity(track_id);

-- ============================================================================
-- FRIENDSHIPS (Social connections between users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
    friendship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user 
ON public.friendships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_friend 
ON public.friendships(friend_id, status);

-- ============================================================================
-- NOTIFICATIONS (User notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON public.notifications(user_id, read, created_at DESC);

-- ============================================================================
-- SCHEDULED SHOWS (Upcoming broadcasts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_shows (
    show_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcaster_id UUID NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    recurring VARCHAR(20),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_shows_broadcaster 
ON public.scheduled_shows(broadcaster_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_shows_time 
ON public.scheduled_shows(scheduled_time);

-- ============================================================================
-- REACTIONS (Emoji reactions to stations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reactions (
    reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_station 
ON public.reactions(station_id, created_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.radio_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES (Development - Open Access)
-- ============================================================================

-- Radio Listeners
DROP POLICY IF EXISTS "Allow all for radio_listeners" ON public.radio_listeners;
CREATE POLICY "Allow all for radio_listeners" 
ON public.radio_listeners FOR ALL USING (true) WITH CHECK (true);

-- Radio Chat
DROP POLICY IF EXISTS "Allow all for radio_chat_messages" ON public.radio_chat_messages;
CREATE POLICY "Allow all for radio_chat_messages" 
ON public.radio_chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Listening Activity
DROP POLICY IF EXISTS "Allow all for listening_activity" ON public.listening_activity;
CREATE POLICY "Allow all for listening_activity" 
ON public.listening_activity FOR ALL USING (true) WITH CHECK (true);

-- Friendships
DROP POLICY IF EXISTS "Allow all for friendships" ON public.friendships;
CREATE POLICY "Allow all for friendships" 
ON public.friendships FOR ALL USING (true) WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Allow all for notifications" ON public.notifications;
CREATE POLICY "Allow all for notifications" 
ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Scheduled Shows
DROP POLICY IF EXISTS "Allow all for scheduled_shows" ON public.scheduled_shows;
CREATE POLICY "Allow all for scheduled_shows" 
ON public.scheduled_shows FOR ALL USING (true) WITH CHECK (true);

-- Reactions
DROP POLICY IF EXISTS "Allow all for reactions" ON public.reactions;
CREATE POLICY "Allow all for reactions" 
ON public.reactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ All tables created successfully!';
    RAISE NOTICE '📊 Tables added:';
    RAISE NOTICE '   - radio_listeners';
    RAISE NOTICE '   - radio_chat_messages';
    RAISE NOTICE '   - listening_activity';
    RAISE NOTICE '   - friendships';
    RAISE NOTICE '   - notifications';
    RAISE NOTICE '   - scheduled_shows';
    RAISE NOTICE '   - reactions';
END $$;
