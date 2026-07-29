/**
 * Application Constants
 * Centralized constants used across the application
 */

// ============================================================================
// MOCK STATION IDS
// ============================================================================

/**
 * Station IDs used for demo/testing purposes.
 * These should NOT trigger database queries as they don't exist in Supabase.
 */
export const MOCK_STATION_IDS = ['lobby', 'test-station'] as const;

/**
 * Type-safe check if a station ID is a mock station
 */
export function isMockStation(stationId: string): boolean {
    return MOCK_STATION_IDS.includes(stationId as typeof MOCK_STATION_IDS[number]);
}

// ============================================================================
// CONNECTION LIMITS
// ============================================================================

/** Maximum WebSocket connections per user */
export const MAX_WS_CONNECTIONS_PER_USER = 10;

/** Maximum reconnection attempts for WebSocket */
export const MAX_WS_RECONNECT_ATTEMPTS = 10;

// ============================================================================
// RATE LIMITS
// ============================================================================

/** Rate limits for different operations */
export const RATE_LIMITS = {
    /** Chat messages: 10 per 10 seconds */
    chat: { max: 10, windowMs: 10000 },
    /** Position updates: 5 per second */
    position: { max: 5, windowMs: 1000 },
    /** Reactions: 20 per minute */
    reactions: { max: 20, windowMs: 60000 },
    /** General API: 100 per minute */
    api: { max: 100, windowMs: 60000 },
    /** Auth: 5 attempts per 15 minutes */
    auth: { max: 5, windowMs: 15 * 60 * 1000 },
} as const;

// ============================================================================
// MESSAGE LIMITS
// ============================================================================

/** Maximum message sizes */
export const MESSAGE_LIMITS = {
    /** Max WebSocket message size in bytes (10KB) */
    maxSize: 10 * 1024,
    /** Max chat message character length */
    maxChatLength: 500,
} as const;

// ============================================================================
// TIMING
// ============================================================================

/** Timing constants */
export const TIMING = {
    /** Token refresh buffer (5 minutes before expiry) */
    tokenRefreshBufferMs: 5 * 60 * 1000,
    /** WebSocket heartbeat interval */
    wsHeartbeatMs: 30000,
    /** Cache deduping interval */
    cacheDedupingMs: 2000,
} as const;
