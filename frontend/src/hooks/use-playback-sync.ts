'use client';

import { useState, useCallback, useEffect } from 'react';

interface SyncData {
    trackId: string;
    position: number;
    timestamp: number;
    deviceId: string;
}

const SYNC_KEY = 'playback_sync';
const DEVICE_ID_KEY = 'device_id';

/**
 * Hook for cross-platform playback sync
 * 
 * Syncs playback position across devices using localStorage/cloud
 */
export function usePlaybackSync() {
    const [deviceId] = useState(() => {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    });

    const savePlaybackPosition = useCallback((trackId: string, position: number) => {
        const syncData: SyncData = {
            trackId,
            position,
            timestamp: Date.now(),
            deviceId,
        };
        localStorage.setItem(SYNC_KEY, JSON.stringify(syncData));
        // TODO: Also sync to cloud storage (Supabase/Firebase)
    }, [deviceId]);

    const getPlaybackPosition = useCallback((trackId: string): number | null => {
        const stored = localStorage.getItem(SYNC_KEY);
        if (!stored) return null;

        try {
            const syncData: SyncData = JSON.parse(stored);
            if (syncData.trackId === trackId) {
                // Only use if recent (within 1 hour)
                if (Date.now() - syncData.timestamp < 3600000) {
                    return syncData.position;
                }
            }
        } catch (e) {
            console.error('[Sync] Failed to get position:', e);
        }
        return null;
    }, []);

    const clearSync = useCallback(() => {
        localStorage.removeItem(SYNC_KEY);
    }, []);

    return {
        deviceId,
        savePlaybackPosition,
        getPlaybackPosition,
        clearSync,
    };
}
