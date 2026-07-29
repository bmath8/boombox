/**
 * Get User Playlists API Route
 */

import { NextResponse } from 'next/server';
import { getUserPlaylists } from '@/lib/spotify-api';
import { limiter } from '@/lib/rate-limit';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
        }

        const supabase = await createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 });
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting: 10 requests per minute (playlists are heavier)
        try {
            await limiter.check(10, user.id);
        } catch {
            console.warn('Rate limit exceeded', {
                userId: user.id,
                endpoint: '/api/spotify/playlists',
                timestamp: new Date().toISOString(),
            });
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    retryAfter: 60,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': '10',
                        'X-RateLimit-Reset': String(Date.now() + 60000),
                    }
                }
            );
        }

        const spotifyToken = user.user_metadata?.['spotify_access_token'];

        if (!spotifyToken) {
            return NextResponse.json(
                { error: 'Spotify not connected' },
                { status: 403 }
            );
        }

        const playlists = await getUserPlaylists(spotifyToken);

        return NextResponse.json({ playlists });
    } catch (error) {
        console.error('Get playlists error:', error);
        return NextResponse.json(
            { error: 'Failed to load playlists' },
            { status: 500 }
        );
    }
}
