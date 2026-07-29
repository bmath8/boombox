'use client';

import { useState, useCallback, useEffect } from 'react';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    relatedArtists: string[];
}

/**
 * Hook for Music News Feed
 * 
 * Aggregates news relevant to user's taste
 */
export function useMusicNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNews = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/news');
            if (!response.ok) throw new Error('Failed to fetch news');

            const data = await response.json();
            setNews(data);
        } catch (error) {
            console.error('[News] Fetch failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const refresh = useCallback(() => {
        fetchNews();
    }, [fetchNews]);

    return {
        news,
        isLoading,
        refresh,
    };
}
