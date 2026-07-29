/**
 * Spotify Token Refresh Manager
 * Automatically refreshes Spotify access tokens before expiration
 */

import { supabase } from './supabase';
import { logger } from './logger';
import { env } from './env';

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

interface SpotifyTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

/**
 * Check if Spotify token needs refresh
 */
export function needsTokenRefresh(expiresAt: number | undefined): boolean {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
}

/**
 * Refresh Spotify access token using refresh token
 */
export async function refreshSpotifyToken(): Promise<SpotifyTokens | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            logger.warn('No session found for token refresh');
            return null;
        }

        const refreshToken = session.user.user_metadata?.['spotify_refresh_token'];
        const expiresAt = session.user.user_metadata?.['spotify_expires_at'];

        // Check if refresh is needed
        if (!needsTokenRefresh(expiresAt)) {
            return {
                access_token: session.user.user_metadata?.['spotify_access_token'],
                refresh_token: refreshToken,
                expires_at: expiresAt,
            };
        }

        if (!refreshToken) {
            // This is normal - user hasn't connected Spotify yet. Not an error.
            logger.debug('No Spotify refresh token available - user may not be connected to Spotify');
            return null;
        }

        logger.info('Refreshing Spotify token');

        // Call refresh endpoint
        const response = await fetch('/api/auth/spotify/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const tokens = await response.json();

        // Update user metadata with new tokens
        await supabase.auth.updateUser({
            data: {
                spotify_access_token: tokens.access_token,
                spotify_refresh_token: tokens.refresh_token || refreshToken,
                spotify_expires_at: Date.now() + tokens.expires_in * 1000,
            },
        });

        logger.info('Spotify token refreshed successfully');

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || refreshToken,
            expires_at: Date.now() + tokens.expires_in * 1000,
        };
    } catch (error) {
        logger.error('Token refresh error:', error);
        return null;
    }
}

/**
 * Get valid Spotify access token (refreshes if needed)
 */
export async function getValidSpotifyToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        return null;
    }

    const expiresAt = session.user.user_metadata?.['spotify_expires_at'];

    // Refresh if needed
    if (needsTokenRefresh(expiresAt)) {
        const tokens = await refreshSpotifyToken();
        return tokens?.access_token || null;
    }

    return session.user.user_metadata?.['spotify_access_token'] || null;
}

/**
 * Auto-refresh token setup
 * Call this in your app initialization
 */
export function setupTokenAutoRefresh(): () => void {
    let refreshInterval: NodeJS.Timeout | null = null;

    const checkAndRefresh = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            const expiresAt = session.user.user_metadata?.['spotify_expires_at'];

            if (needsTokenRefresh(expiresAt)) {
                await refreshSpotifyToken();
            }
        }
    };

    // Check every minute
    refreshInterval = setInterval(checkAndRefresh, 60 * 1000);

    // Cleanup function
    return () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    };
}
