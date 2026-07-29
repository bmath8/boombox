'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for gapless audio playback
 * 
 * Preloads next track and seamlessly transitions without gaps
 * 
 * @example
 * ```tsx
 * const { preloadNextTrack, isNextTrackReady } = useGaplessPlayback();
 * 
 * useEffect(() => {
 *   if (queue[currentIndex + 1]) {
 *     preloadNextTrack(queue[currentIndex + 1].url);
 *   }
 * }, [currentIndex]);
 * ```
 */
export function useGaplessPlayback() {
    const nextAudioRef = useRef<HTMLAudioElement | null>(null);
    const isReadyRef = useRef(false);

    useEffect(() => {
        // Create hidden audio element for preloading
        nextAudioRef.current = new Audio();
        nextAudioRef.current.preload = 'auto';

        return () => {
            if (nextAudioRef.current) {
                nextAudioRef.current.pause();
                nextAudioRef.current.src = '';
                nextAudioRef.current = null;
            }
        };
    }, []);

    const preloadNextTrack = useCallback((url: string) => {
        if (!nextAudioRef.current) return;

        isReadyRef.current = false;
        nextAudioRef.current.src = url;

        nextAudioRef.current.addEventListener('canplaythrough', () => {
            isReadyRef.current = true;
        }, { once: true });

        nextAudioRef.current.load();
    }, []);

    const getPreloadedAudio = useCallback(() => {
        return nextAudioRef.current;
    }, []);

    const isNextTrackReady = useCallback(() => {
        return isReadyRef.current;
    }, []);

    const clearPreload = useCallback(() => {
        if (nextAudioRef.current) {
            nextAudioRef.current.src = '';
            isReadyRef.current = false;
        }
    }, []);

    return {
        preloadNextTrack,
        getPreloadedAudio,
        isNextTrackReady,
        clearPreload,
    };
}
