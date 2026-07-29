'use client';

import { useState, useCallback } from 'react';

interface KaraokeState {
    enabled: boolean;
    vocalReduction: number; // 0 to 1
    pitchShift: number; // -12 to +12 semitones
    showLyrics: boolean;
}

/**
 * Hook for Karaoke Mode
 * 
 * Reduces vocals and allows pitch shifting
 * Uses Web Audio API filters
 */
export function useKaraokeMode(audioElement: HTMLAudioElement | null) {
    const [state, setState] = useState<KaraokeState>({
        enabled: false,
        vocalReduction: 0.7,
        pitchShift: 0,
        showLyrics: true,
    });

    const enableKaraoke = useCallback((enabled: boolean) => {
        setState(prev => ({ ...prev, enabled }));

        if (enabled && audioElement) {
            // TODO: Apply vocal reduction filter
            // Center channel reduction technique
            console.log('[Karaoke] Mode enabled');
        }
    }, [audioElement]);

    const setVocalReduction = useCallback((amount: number) => {
        const clamped = Math.max(0, Math.min(1, amount));
        setState(prev => ({ ...prev, vocalReduction: clamped }));
        // TODO: Update filter
    }, []);

    const setPitchShift = useCallback((semitones: number) => {
        const clamped = Math.max(-12, Math.min(12, semitones));
        setState(prev => ({ ...prev, pitchShift: clamped }));
        // TODO: Apply pitch shift
    }, []);

    const toggleLyrics = useCallback(() => {
        setState(prev => ({ ...prev, showLyrics: !prev.showLyrics }));
    }, []);

    return {
        state,
        enableKaraoke,
        setVocalReduction,
        setPitchShift,
        toggleLyrics,
    };
}
