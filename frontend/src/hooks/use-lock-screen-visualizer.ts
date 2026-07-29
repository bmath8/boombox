'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook for Mini Visualizer on Lock Screen
 * 
 * Uses Media Session API to show waveform visualization on mobile lock screens
 */
export function useLockScreenVisualizer(audioElement: HTMLAudioElement | null) {
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!audioElement || !('mediaSession' in navigator)) return;

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audioElement);
            const analyser = audioContext.createAnalyser();

            analyser.fftSize = 64; // Small for lock screen
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            analyserRef.current = analyser;

            // Update Media Session artwork with visualization
            // Note: Most platforms don't support dynamic artwork yet
            // This is a placeholder for future support

            console.log('[Lock Screen] Visualizer initialized');
        } catch (error) {
            console.error('[Lock Screen] Failed to initialize:', error);
        }

        return () => {
            if (analyserRef.current) {
                analyserRef.current.disconnect();
            }
        };
    }, [audioElement]);

    return {
        isSupported: 'mediaSession' in navigator,
        analyser: analyserRef.current,
    };
}
