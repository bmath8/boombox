/**
 * JWT Token Refresh Logic
 * Automatically refreshes tokens before they expire
 * Prevents unexpected logouts and improves UX
 */

import { supabase } from './supabase';
import { logger } from './logger';

// Refresh token 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Check token status every minute
const CHECK_INTERVAL_MS = 60 * 1000;

interface TokenRefreshState {
    isRefreshing: boolean;
    refreshTimer: ReturnType<typeof setTimeout> | null;
    checkTimer: ReturnType<typeof setInterval> | null;
}

const state: TokenRefreshState = {
    isRefreshing: false,
    refreshTimer: null,
    checkTimer: null,
};

/**
 * Calculate milliseconds until token expires
 */
function getMillisecondsUntilExpiry(expiresAt: number): number {
    const now = Math.floor(Date.now() / 1000);
    return (expiresAt - now) * 1000;
}

/**
 * Check if token needs refresh
 */
function needsRefresh(expiresAt: number): boolean {
    const msUntilExpiry = getMillisecondsUntilExpiry(expiresAt);
    return msUntilExpiry <= REFRESH_BUFFER_MS;
}

/**
 * Schedule token refresh before expiry
 */
function scheduleTokenRefresh(expiresAt: number) {
    // Clear existing timer
    if (state.refreshTimer) {
        clearTimeout(state.refreshTimer);
        state.refreshTimer = null;
    }

    const msUntilExpiry = getMillisecondsUntilExpiry(expiresAt);
    const msUntilRefresh = Math.max(0, msUntilExpiry - REFRESH_BUFFER_MS);

    logger.debug('Scheduling token refresh', {
        msUntilRefresh,
        refreshAt: new Date(Date.now() + msUntilRefresh).toISOString(),
    });

    state.refreshTimer = setTimeout(() => {
        refreshToken();
    }, msUntilRefresh);
}

/**
 * Refresh the access token
 */
async function refreshToken(): Promise<boolean> {
    if (state.isRefreshing) {
        logger.debug('Token refresh already in progress');
        return false;
    }

    state.isRefreshing = true;

    try {
        logger.info('Refreshing access token');

        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
            throw error;
        }

        if (data.session) {
            logger.info('Token refreshed successfully', {
                expiresAt: data.session.expires_at,
            });

            // Schedule next refresh
            scheduleTokenRefresh(data.session.expires_at!);

            return true;
        }

        // Handle case where we got no session but no explicit error
        logger.warn('Token refresh returned no session. Force signing out to recover.');
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            window.location.href = '/login?error=session_expired';
        }
        return false;
    } catch (error: any) {
        logger.error('Failed to refresh token', error);

        // Critical Auth Errors: Force Logout
        const msg = error?.message || JSON.stringify(error);
        if (msg.includes('invalid_grant') || msg.includes('not_found') || msg.includes('JWT')) {
            logger.error('Critical Auth Error. Force logging out.');
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
                window.location.href = '/login?error=session_expired';
            }
            return false;
        }

        // For temporary network errors, retry
        if (!state.refreshTimer) {
            state.refreshTimer = setTimeout(() => refreshToken(), 60 * 1000);
        }

        return false;
    } finally {
        state.isRefreshing = false;
    }
}

/**
 * Stop all token refresh timers
 */
export function stopTokenRefresh() {
    if (state.refreshTimer) {
        clearTimeout(state.refreshTimer);
        state.refreshTimer = null;
    }

    if (state.checkTimer) {
        clearInterval(state.checkTimer);
        state.checkTimer = null;
    }

    logger.debug('Stopped token refresh');
}

/**
 * Periodically check token status
 * Fallback in case scheduled refresh fails
 */
function startPeriodicCheck() {
    if (state.checkTimer) {
        return; // Already running
    }

    state.checkTimer = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            logger.debug('No active session, stopping token refresh');
            stopTokenRefresh();
            return;
        }

        if (session.expires_at && needsRefresh(session.expires_at)) {
            logger.info('Token needs refresh (detected by periodic check)');
            await refreshToken();
        }
    }, CHECK_INTERVAL_MS);

    logger.debug('Started periodic token check');
}

/**
 * Initialize token refresh system
 * Call this once when the app starts
 */
export async function initializeTokenRefresh() {
    logger.info('Initializing token refresh system');

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        logger.debug('No active session, token refresh not needed');
        return;
    }

    if (!session.expires_at) {
        logger.warn('Session has no expiry time');
        return;
    }

    // Check if token needs immediate refresh
    if (needsRefresh(session.expires_at)) {
        logger.info('Token needs immediate refresh');
        await refreshToken();
    } else {
        // Schedule refresh
        scheduleTokenRefresh(session.expires_at);
    }

    // Start periodic check
    startPeriodicCheck();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        logger.debug('Auth state changed', { event });

        switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
                if (session?.expires_at) {
                    scheduleTokenRefresh(session.expires_at);
                    if (!state.checkTimer) {
                        startPeriodicCheck();
                    }
                }
                break;

            case 'SIGNED_OUT':
                stopTokenRefresh();
                break;

            case 'USER_UPDATED':
                // Session might have been refreshed
                if (session?.expires_at) {
                    scheduleTokenRefresh(session.expires_at);
                }
                break;
        }
    });

    logger.info('Token refresh system initialized');
}

/**
 * Manually trigger token refresh
 * Useful for testing or before critical operations
 */
export async function forceTokenRefresh(): Promise<boolean> {
    logger.info('Forcing token refresh');
    return await refreshToken();
}

/**
 * Get time until token expiry (in milliseconds)
 */
export async function getTimeUntilExpiry(): Promise<number | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.expires_at) {
        return null;
    }

    return getMillisecondsUntilExpiry(session.expires_at);
}

/**
 * Check if current token is valid and not expiring soon
 */
export async function isTokenValid(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.expires_at) {
        return false;
    }

    return !needsRefresh(session.expires_at);
}
