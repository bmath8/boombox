'use client';

import { useState, useEffect } from 'react';

interface LyricsLine {
    time: number; // Timestamp in milliseconds
    text: string;
}

interface LyricsData {
    trackId: string;
    trackName: string;
    artist: string;
    lines: LyricsLine[];
    syncType: 'LINE_SYNCED' | 'UNSYNCED';
}

/**
 * Hook for fetching and displaying synchronized lyrics
 * 
 * Features:
 * - Fetches lyrics from Spotify or Genius
 * - Line-synced lyrics display
 * - Auto-scroll to current line
 * - Cached lyrics data
 * 
 * @example
 * ```tsx
 * const { lyrics, currentLineIndex, isLoading } = useLyrics(trackId, currentTime);
 * ```
 */
export function useLyrics(trackId: string | null, currentTime: number = 0) {
    const [lyrics, setLyrics] = useState<LyricsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);

    // Fetch lyrics when track changes
    useEffect(() => {
        if (!trackId) {
            setLyrics(null);
            return;
        }

        const cached = localStorage.getItem(`lyrics_${trackId}`);
        if (cached) {
            try {
                setLyrics(JSON.parse(cached));
                return;
            } catch (e) {
                // Invalid cache, fetch fresh
            }
        }

        setIsLoading(true);
        setError(null);

        const fetchLyrics = async () => {
            try {
                const params = new URLSearchParams();
                if (trackId) params.append('track', trackId); // Ideally pass names not IDs, but API handles fallbacks

                // In a real app, we'd pass metadata:
                // params.append('artist', currentTrack.artist); 
                // params.append('track', currentTrack.name);

                const response = await fetch(`/api/lyrics?${params}`);
                if (!response.ok) throw new Error('Lyrics fetch failed');

                const data = await response.json();
                setLyrics(data);
                localStorage.setItem(`lyrics_${trackId}`, JSON.stringify(data));
            } catch (err) {
                console.error('[Lyrics] Failed to fetch:', err);
                setError('Could not load lyrics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLyrics();
    }, [trackId]);

    // Update current line based on playback time
    useEffect(() => {
        if (!lyrics || lyrics.syncType !== 'LINE_SYNCED') return;

        const index = lyrics.lines.findIndex((line, i) => {
            const nextLine = lyrics.lines[i + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });

        if (index !== -1) {
            setCurrentLineIndex(index);
        }
    }, [currentTime, lyrics]);

    return {
        lyrics,
        currentLineIndex,
        isLoading,
        error,
    };
}
