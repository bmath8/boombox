-- ============================================================================
-- FAM MUSIC V.2 - MISSING DATABASE INDEXES
-- Performance optimization indexes for common query patterns
-- ============================================================================

-- These indexes should be added to improve query performance
-- Run this file after applying the main schema

-- ============================================================================
-- LISTENING ACTIVITY INDEXES
-- ============================================================================

-- Index for discovery queries (user + track combinations)
CREATE INDEX IF NOT EXISTS idx_listening_user_track 
ON listening_activity(user_id, track_id, played_at DESC);

-- Index for artist-based queries
CREATE INDEX IF NOT EXISTS idx_listening_artists 
ON listening_activity USING GIN(to_tsvector('english', artists));

-- ============================================================================
-- RADIO CHAT MESSAGES INDEXES
-- ============================================================================

-- Composite index for pagination (station + time)
CREATE INDEX IF NOT EXISTS idx_radio_chat_pagination 
ON radio_chat_messages(station_id, sent_at DESC, message_id);

-- ============================================================================
-- NOTIFICATIONS INDEXES
-- ============================================================================

-- Index for filtering by notification type
CREATE INDEX IF NOT EXISTS idx_notifications_type_time 
ON notifications(user_id, type, created_at DESC) 
WHERE is_read = false;

-- ============================================================================
-- FRIENDSHIPS INDEXES
-- ============================================================================

-- Bidirectional friendship lookup
CREATE INDEX IF NOT EXISTS idx_friendships_bidirectional 
ON friendships(friend_id, user_id, status);

-- ============================================================================
-- RADIO STATIONS INDEXES
-- ============================================================================

-- Index for genre-based discovery
CREATE INDEX IF NOT EXISTS idx_radio_stations_genre 
ON radio_stations(genre, status, listener_count DESC) 
WHERE status = 'live';

-- Index for broadcaster's stations
CREATE INDEX IF NOT EXISTS idx_radio_stations_broadcaster_status 
ON radio_stations(broadcaster_id, status, last_active DESC);

-- ============================================================================
-- SHARED SONGS INDEXES
-- ============================================================================

-- Index for compatibility score queries
CREATE INDEX IF NOT EXISTS idx_shared_songs_score 
ON shared_songs(user1_id, user2_id, compatibility_score DESC);

-- ============================================================================
-- TRACKS CACHE INDEXES
-- ============================================================================

-- Index for ISRC lookup (music industry standard)
CREATE INDEX IF NOT EXISTS idx_tracks_isrc 
ON tracks(isrc) 
WHERE isrc IS NOT NULL;

-- Index for album-based queries
CREATE INDEX IF NOT EXISTS idx_tracks_album 
ON tracks(album_id, track_name);

-- ============================================================================
-- RADIO LISTENERS INDEXES
-- ============================================================================

-- Index for active listener cleanup
CREATE INDEX IF NOT EXISTS idx_radio_listeners_stale 
ON radio_listeners(last_heartbeat) 
WHERE last_heartbeat < NOW() - INTERVAL '60 seconds';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
