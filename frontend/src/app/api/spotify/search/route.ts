/**
 * Spotify Search API Route
 * Proxies Spotify search requests to avoid exposing access tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/spotify-api';
import { limiter } from '@/lib/rate-limit';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { validateQueryParams, searchSchema } from '@/lib/input-validation';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Use searchSchema for consistent validation
    const validationResult = validateQueryParams(searchParams, searchSchema);

    if (!validationResult.success) {
        return NextResponse.json(
            { error: validationResult.error },
            { status: 400 }
        );
    }

    const { query, limit } = validationResult.data;

    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
        }

        // Get user session and Spotify token
        const supabase = await createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 });
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limiting: 20 requests per minute for search
        try {
            await limiter.check(20, user.id);
        } catch {
            console.warn('Rate limit exceeded', {
                userId: user.id,
                endpoint: '/api/spotify/search',
                query: query,
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
                        'X-RateLimit-Limit': '20',
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

        // Search tracks
        const tracks = await searchTracks(query, spotifyToken, limit);

        return NextResponse.json({ tracks });
    } catch (error) {
        console.error('Spotify search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
