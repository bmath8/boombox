'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

/**
 * Hook for controlling playback speed
 * 
 * Note: Spotify Web Playback SDK does not officially support variable playback speed.
 * This implementation applies it to local audio elements or emulates where possible.
 */
export function usePlaybackSpeed(audioElement: HTMLAudioElement | null) {
    const { player: spotifyPlayer } = useSpotify();
    const [speed, setSpeed] = useState(1.0);

    const setPlaybackSpeed = useCallback(async (newSpeed: number) => {
        // Clamp to valid range
        const validSpeed = Math.max(0.25, Math.min(4.0, newSpeed));

        // 1. Local Audio Element
        if (audioElement) {
            audioElement.playbackRate = validSpeed;
        }

        // 2. Spotify Player (Experimental/Limited support)
        // Spotify SDK doesn't expose speed control directly.
        // We persist it for UI state.

        setSpeed(validSpeed);
        localStorage.setItem('playback_speed', validSpeed.toString());
    }, [audioElement, spotifyPlayer]);

    const resetSpeed = useCallback(() => {
        setPlaybackSpeed(1.0);
    }, [setPlaybackSpeed]);

    // Initialize from storage
    useEffect(() => {
        const saved = localStorage.getItem('playback_speed');
        if (saved) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed)) {
                setPlaybackSpeed(parsed);
            }
        }
    }, [setPlaybackSpeed]);

    return {
        speed,
        setPlaybackSpeed,
        resetSpeed,
        availableSpeeds: PLAYBACK_SPEEDS,
    };
}
