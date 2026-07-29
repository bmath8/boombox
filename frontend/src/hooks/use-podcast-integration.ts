'use client';

import { useState, useCallback } from 'react';

interface PodcastEpisode {
    id: string;
    title: string;
    show: string;
    duration: number; // seconds
    description: string;
    publishedAt: string;
}

/**
 * Hook for Podcast Integration
 * 
 * Manages podcast subscriptions and playback features
 * (Variable speed, skip silence, save progress)
 */
export function usePodcastIntegration() {
    const [subscriptions, setSubscriptions] = useState<string[]>([]);
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
    const [playbackSettings, setPlaybackSettings] = useState({
        speed: 1.0,
        skipSilence: false,
        autoDownload: false,
    });

    const toggleSubscription = useCallback((showId: string) => {
        setSubscriptions(prev => {
            const exists = prev.includes(showId);
            if (exists) return prev.filter(id => id !== showId);
            return [...prev, showId];
        });
    }, []);

    const fetchEpisodes = useCallback(async () => {
        // Mock fetch
        const mockEpisodes: PodcastEpisode[] = [
            {
                id: 'ep-1',
                title: 'The Future of Music Streaming',
                show: 'Tech Talks',
                duration: 3600,
                description: 'Deep dive into algorithms...',
                publishedAt: new Date().toISOString(),
            },
        ];
        setEpisodes(mockEpisodes);
    }, []);

    const updatePlaybackSettings = useCallback((settings: Partial<typeof playbackSettings>) => {
        setPlaybackSettings(prev => ({ ...prev, ...settings }));
    }, []);

    return {
        subscriptions,
        episodes,
        playbackSettings,
        toggleSubscription,
        fetchEpisodes,
        updatePlaybackSettings,
    };
}
