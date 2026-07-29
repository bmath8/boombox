'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseReal } from '@/lib/supabase';
import { toast } from 'sonner';

interface FavoriteItem {
    id: string;
    type: 'track' | 'station' | 'artist' | 'playlist';
    name: string;
    metadata?: any;
    addedAt: number;
}

const STORAGE_KEY = 'favorites';

/**
 * Hook for managing user favorites with Supabase Sync
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial Load - Local then Cloud
    useEffect(() => {
        // 1. Load Local
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error('[Favorites] Failed to load local:', e);
            }
        }

        // 2. Load Cloud (if authenticated)
        const syncFromCloud = async () => {
            if (!isSupabaseReal()) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Works anonymously too if configured, but usually needs user

                const { data, error } = await supabase
                    .from('favorites')
                    .select('*')
                    .order('added_at', { ascending: false });

                if (error) {
                    console.warn('[Favorites] Sync error:', error);
                    return;
                }

                if (data) {
                    // Merge strategies can be complex. For now, Cloud wins or basic merge.
                    // We'll map DB fields to our interface if they differ. 
                    // assuming DB has matching cols (snake_case conversion often needed)
                    const cloudFavorites: FavoriteItem[] = data.map(item => ({
                        id: item.item_id,
                        type: item.item_type,
                        name: item.name,
                        metadata: item.metadata,
                        addedAt: new Date(item.added_at).getTime()
                    }));

                    setFavorites(cloudFavorites);
                    // Update local cache
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudFavorites));
                }
            } catch (e) {
                console.error('[Favorites] Cloud fetch failed', e);
            }
        };

        syncFromCloud();
    }, []);

    const addFavorite = useCallback(async (item: Omit<FavoriteItem, 'addedAt'>) => {
        const newItem = { ...item, addedAt: Date.now() };

        // Optimistic Update
        setFavorites(prev => {
            const exists = prev.find(f => f.id === item.id && f.type === item.type);
            if (exists) return prev;
            const next = [newItem, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });

        // Cloud Sync
        if (isSupabaseReal()) {
            setIsSyncing(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Anonymous or unauth flow
                    // might skip or store anonymously
                } else {
                    await supabase.from('favorites').insert({
                        user_id: user.id,
                        item_id: item.id,
                        item_type: item.type,
                        name: item.name,
                        metadata: item.metadata,
                        added_at: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.error('[Favorites] Cloud add failed', e);
                toast.error('Could not save to cloud');
            } finally {
                setIsSyncing(false);
            }
        }
    }, []);

    const removeFavorite = useCallback(async (id: string, type: FavoriteItem['type']) => {
        // Optimistic Update
        setFavorites(prev => {
            const next = prev.filter(f => !(f.id === id && f.type === type));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });

        // Cloud Sync
        if (isSupabaseReal()) {
            try {
                await supabase
                    .from('favorites')
                    .delete()
                    .match({ item_id: id, item_type: type });
            } catch (e) {
                console.error('[Favorites] Cloud remove failed', e);
            }
        }
    }, []);

    const isFavorite = useCallback((id: string, type: FavoriteItem['type']) => {
        return favorites.some(f => f.id === id && f.type === type);
    }, [favorites]);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        isSyncing
    };
}
