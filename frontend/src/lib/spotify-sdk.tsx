'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from './logger';
import { handleError } from './error-handler';
import { SpotifyPlayer, SpotifyState } from './types';

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: {
            Player: new (options: {
                name: string;
                getOAuthToken: (cb: (token: string) => void) => void;
                volume: number;
            }) => SpotifyPlayer;
        };
    }
}

interface SpotifyContextType {
    player: SpotifyPlayer | null;
    deviceId: string | null;
    isPaused: boolean;
    currentTrack: SpotifyState['track_window']['current_track'] | null;
    isActive: boolean;
}

const SpotifyContext = createContext<SpotifyContextType | null>(null);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
    const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<SpotifyState['track_window']['current_track'] | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration errors by only rendering on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined' || !isMounted) return;

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = async () => {
            // Import token refresh utility
            const { getValidSpotifyToken } = await import('./spotify-token-refresh');

            // Get valid token (auto-refreshes if needed)
            const accessToken = await getValidSpotifyToken();

            if (!accessToken) {
                // This is normal - user hasn't connected Spotify yet
                logger.debug('No Spotify token - user may not be connected to Spotify');
                return;
            }

            const player = new window.Spotify.Player({
                name: 'BOOMBOX Web Player',
                getOAuthToken: async (cb: (token: string) => void) => {
                    // Always get fresh token (auto-refreshes if needed)
                    const { getValidSpotifyToken } = await import('./spotify-token-refresh');
                    const token = await getValidSpotifyToken();
                    if (token) {
                        cb(token);
                    }
                },
                volume: 0.5,
            });

            setPlayer(player);

            player.addListener('ready', (state: unknown) => {
                const { device_id } = state as { device_id: string };
                logger.info('Spotify Player Ready', { deviceId: device_id });
                setDeviceId(device_id);
            });

            player.addListener('not_ready', (state: unknown) => {
                const { device_id } = state as { device_id: string };
                logger.warn('Spotify Device Offline', { deviceId: device_id });
                setDeviceId(null);
            });

            player.addListener('player_state_changed', (state: unknown) => {
                const spotifyState = state as SpotifyState;
                if (!spotifyState) {
                    setIsActive(false);
                    return;
                }

                setIsActive(true);
                setIsPaused(spotifyState.paused);
                setCurrentTrack(spotifyState.track_window.current_track);
            });

            player.connect();
        };

        return () => {
            if (player) {
                player.disconnect();
            }
        };
    }, [isMounted]);

    // Prevent hydration mismatch by not rendering until mounted on client
    return (
        <SpotifyContext.Provider value={{ player, deviceId, isPaused, currentTrack, isActive }}>
            {children}
        </SpotifyContext.Provider>
    );
}

export function useSpotify() {
    const context = useContext(SpotifyContext);
    if (!context) {
        throw new Error('useSpotify must be used within a SpotifyProvider');
    }
    return context;
}
