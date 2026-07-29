'use client';

import { useState, useCallback } from 'react';

type TransitionType = 'cut' | 'fade' | 'spin-back' | 'brake' | 'scratch';

/**
 * Hook for DJ Transition Effects
 * 
 * Extends basic crossfade with DJ-style effects
 */
export function useDJTransitions(audioElement: HTMLAudioElement | null) {
    const [currentEffect, setCurrentEffect] = useState<TransitionType>('fade');

    const triggerTransition = useCallback((type: TransitionType) => {
        if (!audioElement) return;

        console.log('[DJ FX] Triggering:', type);
        setCurrentEffect(type);

        // Apply effect logic
        switch (type) {
            case 'brake':
                // Simulate vinyl brake (slow down to stop)
                const brakeInterval = setInterval(() => {
                    if (audioElement.playbackRate > 0.1) {
                        audioElement.playbackRate -= 0.1;
                    } else {
                        audioElement.pause();
                        audioElement.playbackRate = 1.0;
                        clearInterval(brakeInterval);
                    }
                }, 50);
                break;

            case 'spin-back':
                // Cannot reverse actual audio element easily, simulate with mute + fast rewind
                // Placeholder logic
                break;

            case 'cut':
                audioElement.volume = 0;
                setTimeout(() => {
                    audioElement.volume = 1;
                }, 100); // Chop mechanism
                break;
        }
    }, [audioElement]);

    return {
        currentEffect,
        triggerTransition,
    };
}
