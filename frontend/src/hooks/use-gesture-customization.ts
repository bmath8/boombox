'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseReal } from '@/lib/supabase';
import { toast } from 'sonner';

type GestureAction = 'play-pause' | 'skip-next' | 'skip-prev' | 'like' | 'shuffle' | 'repeat' | 'volume-up' | 'volume-down' | 'none';

interface GestureMapping {
    swipeUp: GestureAction;
    swipeDown: GestureAction;
    swipeLeft: GestureAction;
    swipeRight: GestureAction;
    doubleTap: GestureAction;
    longPress: GestureAction;
}

const DEFAULT_MAPPINGS: GestureMapping = {
    swipeUp: 'none',
    swipeDown: 'none',
    swipeLeft: 'skip-next',
    swipeRight: 'skip-prev',
    doubleTap: 'like',
    longPress: 'none',
};

const STORAGE_KEY = 'gesture_mappings';

/**
 * Hook for customizable gesture controls with Supabase Sync
 */
export function useGestureCustomization() {
    const [mappings, setMappings] = useState<GestureMapping>(DEFAULT_MAPPINGS);

    // Initial Load (Local + Cloud)
    useEffect(() => {
        // 1. Local
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setMappings(JSON.parse(stored));
            } catch (e) {
                console.error('[Gestures] Failed to load local:', e);
            }
        }

        // 2. Cloud
        const syncFromCloud = async () => {
            if (!isSupabaseReal()) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('user_settings')
                    .select('gesture_mappings')
                    .eq('user_id', user.id)
                    .single();

                if (data?.gesture_mappings) {
                    setMappings(data.gesture_mappings);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.gesture_mappings));
                }
            } catch (e) {
                // Silent fail for settings
            }
        };

        syncFromCloud();
    }, []);

    const setGestureMapping = useCallback(async (gesture: keyof GestureMapping, action: GestureAction) => {
        setMappings(prev => {
            const newMappings = { ...prev, [gesture]: action };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newMappings));

            // Cloud Sync
            if (isSupabaseReal()) {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        supabase.from('user_settings').upsert({
                            user_id: user.id,
                            gesture_mappings: newMappings,
                            updated_at: new Date().toISOString()
                        }).then(({ error }) => {
                            if (error) console.error('[Gestures] Cloud save failed', error);
                        });
                    }
                });
            }

            return newMappings;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        setMappings(DEFAULT_MAPPINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MAPPINGS));

        if (isSupabaseReal()) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase.from('user_settings').upsert({
                        user_id: user.id,
                        gesture_mappings: DEFAULT_MAPPINGS,
                        updated_at: new Date().toISOString()
                    });
                }
            });
        }
    }, []);

    const getActionForGesture = useCallback((gesture: keyof GestureMapping) => {
        return mappings[gesture];
    }, [mappings]);

    return {
        mappings,
        setGestureMapping,
        resetToDefaults,
        getActionForGesture,
    };
}
