'use client';

import { useState, useCallback } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';
import { getRecommendations, getTrack, playTrack, SpotifyTrack } from '@/lib/spotify-api';
import { toast } from 'sonner';

/**
 * Hook for Artist Radio functionality
 * 
 * Generates a station based on similar artists using Spotify Recommendations API
 */
export function useArtistRadio() {
    const { deviceId } = useSpotify();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStationArtist, setCurrentStationArtist] = useState<{ id: string; name: string } | null>(null);
    const [upNext, setUpNext] = useState<SpotifyTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Helper to get token (in a real app, this should be more robust)
    const getAccessToken = async () => {
        // This relies on the global token management from spotify-sdk or similar
        // For this implementation, we'll try to get it from local storage or session
        // In a perfect world, we'd use the useSpotify context's token if exposed
        // Temporarily, we will assume the token is available via the refresh utility
        const { getValidSpotifyToken } = await import('@/lib/spotify-token-refresh');
        return await getValidSpotifyToken();
    };

    const startRadio = useCallback(async (artistId: string) => {
        setIsLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('No Spotify token available');

            // 1. Get Artist Details (for UI)
            // We might need an artist fetcher, but for now we'll just set ID/Name if passed
            // or fetch a track to get artist info.
            // For simplicity, let's assume the ID is valid.
            setCurrentStationArtist({ id: artistId, name: 'Artist Radio' }); // Name would ideally come from API

            // 2. Get Recommendations (The Radio Mix)
            const tracks = await getRecommendations([artistId], token, 20); // 1. Use artist as seed

            if (tracks.length === 0) {
                toast.error('No tracks found for this radio station');
                return;
            }

            setUpNext(tracks);
            setIsPlaying(true);

            // 3. Start Playback
            if (deviceId && tracks[0]) {
                await playTrack(tracks[0].uri, deviceId, token);
                toast.success(`Started Radio`);
            } else {
                toast('Radio started (Playback pending active device)');
            }

        } catch (error) {
            console.error('[Artist Radio] Failed to start:', error);
            toast.error('Failed to start radio station');
        } finally {
            setIsLoading(false);
        }
    }, [deviceId]);

    const stopRadio = useCallback(() => {
        setIsPlaying(false);
        setCurrentStationArtist(null);
        setUpNext([]);
    }, []);

    const skipTrack = useCallback(async () => {
        if (upNext.length <= 1) return;

        const nextTracks = [...upNext];
        nextTracks.shift(); // Remove current
        setUpNext(nextTracks);

        // Play next
        const nextTrack = nextTracks[0];
        if (nextTrack && deviceId) {
            try {
                const token = await getAccessToken();
                if (token) {
                    await playTrack(nextTrack.uri, deviceId, token);
                }
            } catch (e) {
                console.error('Failed to skip radio track', e);
            }
        }
    }, [upNext, deviceId]);

    return {
        isPlaying,
        currentStationArtist,
        upNext,
        isLoading,
        startRadio,
        stopRadio,
        skipTrack,
    };
}
