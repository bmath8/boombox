'use client';

import { useState, useEffect, useCallback } from 'react';

interface DataUsageStats {
    totalBytes: number;
    sessionBytes: number;
    lastReset: number;
}

const STORAGE_KEY = 'data_usage_stats';

/**
 * Hook for monitoring network data usage
 * 
 * Tracks data consumption for music streaming
 */
export function useDataUsage() {
    const [stats, setStats] = useState<DataUsageStats>({
        totalBytes: 0,
        sessionBytes: 0,
        lastReset: Date.now(),
    });

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setStats({ ...data, sessionBytes: 0 }); // Reset session on load
            } catch (e) {
                console.error('[Data Usage] Failed to load:', e);
            }
        }
    }, []);

    const trackDataUsage = useCallback((bytes: number) => {
        setStats(prev => {
            const newStats = {
                ...prev,
                totalBytes: prev.totalBytes + bytes,
                sessionBytes: prev.sessionBytes + bytes,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
            return newStats;
        });
    }, []);

    const resetStats = useCallback(() => {
        const newStats: DataUsageStats = {
            totalBytes: 0,
            sessionBytes: 0,
            lastReset: Date.now(),
        };
        setStats(newStats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    }, []);

    const formatBytes = useCallback((bytes: number) => {
        if (bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    }, []);

    return {
        stats,
        trackDataUsage,
        resetStats,
        formatBytes,
    };
}
