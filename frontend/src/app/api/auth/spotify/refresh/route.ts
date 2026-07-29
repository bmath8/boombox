/**
 * Spotify Token Refresh Endpoint
 * Exchanges refresh token for new access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { env, isSupabaseConfigured, isSpotifyConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        // Check configuration
        if (!isSupabaseConfigured() || !isSpotifyConfigured()) {
            return NextResponse.json(
                { error: 'Service not configured' },
                { status: 503 }
            );
        }

        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { error: 'Missing refresh token' },
                { status: 400 }
            );
        }

        // Verify user is authenticated
        const supabase = await createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Auth service unavailable' },
                { status: 503 }
            );
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Exchange refresh token for new access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(
                    `${env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ''}:${env.SPOTIFY_CLIENT_SECRET || ''}`
                )}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token,
            }),
        });

        if (!tokenResponse.ok) {
            logger.error('Spotify token refresh failed', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
            });
            throw new Error('Failed to refresh token');
        }

        const tokens = await tokenResponse.json();

        logger.info('Spotify token refreshed', { userId: user.id });

        return NextResponse.json({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Failed to refresh token' },
            { status: 500 }
        );
    }
}
