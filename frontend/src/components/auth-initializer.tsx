/**
 * Auth Initializer Component
 * Initializes JWT token refresh system and Spotify token refresh on app mount
 */

'use client';

import { useEffect } from 'react';
import { initializeTokenRefresh, stopTokenRefresh } from '@/lib/auth-refresh';
import { setupTokenAutoRefresh } from '@/lib/spotify-token-refresh';
import { logger } from '@/lib/logger';

export function AuthInitializer() {
    useEffect(() => {
        // Initialize general token refresh
        initializeTokenRefresh().catch((error) => {
            logger.error('Failed to initialize token refresh', error);
        });

        // Initialize Spotify token auto-refresh
        const cleanupSpotifyRefresh = setupTokenAutoRefresh();

        // Cleanup on unmount
        return () => {
            stopTokenRefresh();
            cleanupSpotifyRefresh();
        };
    }, []);

    // This component renders nothing
    return null;
}
