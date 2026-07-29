/**
 * Spotify Recommendations API
 * Returns AI-like track recommendations based on seed tracks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { seedTracks, mode, limit = 5 } = body;

        if (!seedTracks || seedTracks.length === 0) {
            return NextResponse.json(
                { error: 'No seed tracks provided' },
                { status: 400 }
            );
        }

        // Get user's Spotify access token from Supabase
        const supabase = createClient(
            process.env['NEXT_PUBLIC_SUPABASE_URL']!,
            process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
            {
                global: {
                    headers: {
                        Authorization: request.headers.get('Authorization') || ''
                    }
                }
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get Spotify token from user metadata
        const spotifyToken = user.user_metadata?.['spotify_access_token'];
        if (!spotifyToken) {
            return NextResponse.json(
                { error: 'Spotify not connected' },
                { status: 400 }
            );
        }

        // Build recommendation parameters based on mode
        const params = new URLSearchParams({
            seed_tracks: seedTracks.join(','),
            limit: limit.toString(),
        });

        // Adjust target audio features based on mode
        switch (mode) {
            case 'similar':
                // Default - let Spotify find similar
                break;
            case 'mood':
                // Maintain valence (mood)
                params.set('target_valence', '0.5');
                break;
            case 'energy':
                // High energy tracks
                params.set('min_energy', '0.7');
                params.set('min_danceability', '0.6');
                break;
            case 'crowd-pleaser':
                // Popular tracks
                params.set('min_popularity', '70');
                break;
            case 'deep-cut':
                // Less known tracks
                params.set('max_popularity', '40');
                break;
        }

        // Call Spotify Recommendations API
        const response = await fetch(
            `https://api.spotify.com/v1/recommendations?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${spotifyToken}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                return NextResponse.json(
                    { error: 'Spotify token expired' },
                    { status: 401 }
                );
            }
            throw new Error('Spotify API error');
        }

        const data = await response.json();

        return NextResponse.json({
            tracks: data.tracks,
            seeds: data.seeds
        });

    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { error: 'Failed to get recommendations' },
            { status: 500 }
        );
    }
}
