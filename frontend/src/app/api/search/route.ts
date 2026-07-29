import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/env';
import { validateQueryParams, searchSchema } from '@/lib/input-validation';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validationResult = validateQueryParams(searchParams, searchSchema);

    if (!validationResult.success) {
        return NextResponse.json(
            { error: validationResult.error },
            { status: 400 }
        );
    }

    const { query, type, limit } = validationResult.data;

    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured() || !supabase) {
            return NextResponse.json(
                { error: 'Service not configured' },
                { status: 503 }
            );
        }

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const results: {
            tracks: unknown[];
            users: unknown[];
            stations: unknown[];
            playlists: unknown[];
        } = {
            tracks: [],
            users: [],
            stations: [],
            playlists: [],
        };

        // Search users
        if (type === 'all' || type === 'users') {
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('user_id, display_name, avatar_url')
                .ilike('display_name', `%${query}%`)
                .limit(10);

            if (!userError && users) {
                results.users = users;
            }
        }

        // Search stations
        if (type === 'all' || type === 'stations') {
            const { data: stations, error: stationError } = await supabase
                .from('radio_stations')
                .select('station_id, station_name, broadcaster_id, listener_count, status')
                .ilike('station_name', `%${query}%`)
                .eq('status', 'live')
                .limit(10);

            if (!stationError && stations) {
                results.stations = stations;
            }
        }

        // Search playlists
        if (type === 'all' || type === 'playlists') {
            const { data: playlists, error: playlistError } = await supabase
                .from('collaborative_playlists')
                .select('playlist_id, playlist_name, description, theme, total_tracks')
                .ilike('playlist_name', `%${query}%`)
                .limit(10);

            if (!playlistError && playlists) {
                results.playlists = playlists;
            }
        }

        // Search tracks via Spotify (if user has Spotify connected)
        if (type === 'all' || type === 'tracks') {
            const spotifyToken = user.user_metadata?.['spotify_access_token'];

            if (spotifyToken) {
                try {
                    const spotifyResponse = await fetch(
                        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
                        {
                            headers: {
                                'Authorization': `Bearer ${spotifyToken}`,
                            },
                        }
                    );

                    if (spotifyResponse.ok) {
                        const spotifyData = await spotifyResponse.json();
                        results.tracks = spotifyData.tracks?.items || [];
                    }
                } catch (spotifyError) {
                    console.error('Spotify search error:', spotifyError);
                }
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
