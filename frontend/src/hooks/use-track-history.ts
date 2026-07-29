'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseReal } from '@/lib/supabase';

interface HistoryTrack {
    id: string;
    name: string;
    artist: string;
    album?: string;
    playedAt: number;
    duration: number;
}

const MAX_HISTORY_SIZE = 100;
const STORAGE_KEY = 'track_history';

/**
 * Hook for managing track playback history with Supabase Sync
 */
export function useTrackHistory() {
    const [history, setHistory] = useState<HistoryTrack[]>([]);

    // 1. Initial Load (Local + Cloud)
    useEffect(() => {
        // Load Local
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error('[History] Failed to load local:', e);
            }
        }

        // Load Cloud
        const syncFromCloud = async () => {
            if (!isSupabaseReal()) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('play_history')
                    .select('*')
                    .order('played_at', { ascending: false })
                    .limit(MAX_HISTORY_SIZE);

                if (error) {
                    console.warn('[History] Cloud sync error:', error);
                    return;
                }

                if (data) {
                    // Convert DB snake_case to CamelCase
                    const cloudHistory: HistoryTrack[] = data.map(item => ({
                        id: item.track_id,
                        name: item.track_name,
                        artist: item.artist_name,
                        album: item.album_name,
                        playedAt: new Date(item.played_at).getTime(),
                        duration: item.duration_ms || 0
                    }));

                    setHistory(cloudHistory);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudHistory));
                }
            } catch (e) {
                console.error('[History] Cloud fetch failed', e);
            }
        };

        syncFromCloud();
    }, []);

    // 2. Add Track (Optimistic + Cloud)
    const addToHistory = useCallback(async (track: Omit<HistoryTrack, 'playedAt'>) => {
        const timestamp = Date.now();

        // Optimistic Update
        setHistory(prev => {
            const newHistory = [
                { ...track, playedAt: timestamp },
                ...prev.filter(t => t.id !== track.id || (timestamp - t.playedAt > 60000)), // Allow repeates after 1 min
            ].slice(0, MAX_HISTORY_SIZE);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });

        // Cloud Sync
        if (isSupabaseReal()) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('play_history').insert({
                        user_id: user.id,
                        track_id: track.id,
                        track_name: track.name,
                        artist_name: track.artist,
                        album_name: track.album,
                        duration_ms: track.duration,
                        played_at: new Date(timestamp).toISOString()
                    });
                }
            } catch (e) {
                console.error('[History] Failed to save to cloud', e);
            }
        }
    }, []);

    // 3. Clear History
    const clearHistory = useCallback(async () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);

        if (isSupabaseReal()) {
            // Optional: Clears cloud history too if desired
            // await supabase.from('play_history').delete().neq('id', 0);
        }
    }, []);

    return {
        history,
        addToHistory,
        clearHistory,
    };
}
