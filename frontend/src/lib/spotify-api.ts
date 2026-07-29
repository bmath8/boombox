/**
 * Spotify API Utilities
 * Handles Spotify Web API calls for search, playlists, and recommendations
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string; id: string }[];
    album: {
        name: string;
        images: { url: string; height: number; width: number }[];
    };
    duration_ms: number;
    uri: string;
    preview_url: string | null;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: { url: string }[];
    tracks: {
        total: number;
        items: { track: SpotifyTrack }[];
    };
    owner: {
        display_name: string;
    };
}

export interface SpotifySearchResults {
    tracks: {
        items: SpotifyTrack[];
        total: number;
    };
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
    query: string,
    accessToken: string,
    limit: number = 20
): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
        q: query,
        type: 'track',
        limit: limit.toString(),
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data: SpotifySearchResults = await response.json();
    return data.tracks.items;
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(
    accessToken: string,
    limit: number = 50
): Promise<SpotifyPlaylist[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?${params}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items;
}

/**
 * Get playlist tracks
 */
export async function getPlaylistTracks(
    playlistId: string,
    accessToken: string
): Promise<SpotifyTrack[]> {
    const response = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((item: { track: SpotifyTrack }) => item.track);
}

/**
 * Get track recommendations based on seed tracks
 */
export async function getRecommendations(
    seedTracks: string[],
    accessToken: string,
    limit: number = 20
): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
        seed_tracks: seedTracks.slice(0, 5).join(','), // Max 5 seeds
        limit: limit.toString(),
    });

    const response = await fetch(
        `${SPOTIFY_API_BASE}/recommendations?${params}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks;
}

/**
 * Get track details
 */
export async function getTrack(
    trackId: string,
    accessToken: string
): Promise<SpotifyTrack> {
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Play a track on the active device
 */
export async function playTrack(
    trackUri: string,
    deviceId: string,
    accessToken: string,
    positionMs: number = 0
): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uris: [trackUri],
            position_ms: positionMs,
        }),
    });

    if (!response.ok && response.status !== 204) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }
}

/**
 * Pause playback
 */
export async function pausePlayback(
    deviceId: string,
    accessToken: string
): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok && response.status !== 204) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }
}

/**
 * Resume playback
 */
export async function resumePlayback(
    deviceId: string,
    accessToken: string
): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok && response.status !== 204) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }
}
