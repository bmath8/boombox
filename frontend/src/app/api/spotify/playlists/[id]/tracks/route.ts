/**
 * Get Playlist Tracks API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistTracks } from '@/lib/spotify-api';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { spotifyPlaylistIdSchema } from '@/lib/input-validation';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Validate playlist ID
    const validationResult = spotifyPlaylistIdSchema.safeParse(id);
    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Invalid Spotify Playlist ID' },
            { status: 400 }
        );
    }

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

        const spotifyToken = user.user_metadata?.['spotify_access_token'];

        if (!spotifyToken) {
            return NextResponse.json(
                { error: 'Spotify not connected' },
                { status: 403 }
            );
        }

        const tracks = await getPlaylistTracks(id, spotifyToken);

        return NextResponse.json({ tracks });
    } catch (error) {
        console.error('Get playlist tracks error:', error);
        return NextResponse.json(
            { error: 'Failed to load tracks' },
            { status: 500 }
        );
    }
}
