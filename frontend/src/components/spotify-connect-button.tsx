/**
 * Spotify Connect Button Component
 * Initiates Spotify OAuth flow with CSRF protection
 */

'use client';

import React from 'react';
import { Music } from 'lucide-react';
import { generateClientOAuthState } from '@/lib/oauth-state-client';

export function SpotifyConnectButton() {
    const handleConnect = async () => {
        const clientId = process.env['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'];
        const redirectUri = process.env['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'];

        // Generate CSRF protection state
        const state = generateClientOAuthState();

        // Store state in httpOnly cookie via API
        await fetch('/api/auth/spotify/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state }),
        });

        const scopes = [
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'streaming',
            'user-read-email',
            'user-read-private',
            'playlist-read-private',
            'playlist-read-collaborative',
        ];

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', clientId || '');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', redirectUri || '');
        authUrl.searchParams.append('scope', scopes.join(' '));
        authUrl.searchParams.append('state', state); // CSRF protection
        authUrl.searchParams.append('show_dialog', 'true');

        window.location.href = authUrl.toString();
    };

    return (
        <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] text-white font-semibold rounded-full hover:bg-[#1ed760] transition-colors"
        >
            <Music className="h-5 w-5" />
            Connect Spotify
        </button>
    );
}
