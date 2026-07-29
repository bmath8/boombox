'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CrossfadeOptions {
    duration?: number; // Crossfade duration in milliseconds
    curve?: 'linear' | 'exponential' | 'logarithmic';
}

interface CrossfadeState {
    isEnabled: boolean;
    duration: number;
    curve: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * Hook for smooth audio crossfading between tracks
 * 
 * Features:
 * - Configurable crossfade duration
 * - Multiple fade curve types (linear, exponential, logarithmic)
 * - Web Audio API for precise volume control
 * - Automatic crossfade on track change
 * 
 * @example
 * ```tsx
 * const { enableCrossfade, setCrossfadeDuration, crossfadeState } = useCrossfade(audioRef);
 * 
 * // Enable 3-second exponential crossfade
 * enableCrossfade(true);
 * setCrossfadeDuration(3000, 'exponential');
 * ```
 */
export function useCrossfade(audioElement: HTMLAudioElement | null) {
    const [crossfadeState, setCrossfadeState] = useState<CrossfadeState>({
        isEnabled: true,
        duration: 2000, // 2 seconds default
        curve: 'exponential',
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const previousTrackRef = useRef<string | null>(null);
    const isCrossfadingRef = useRef(false);

    // Initialize Web Audio API
    useEffect(() => {
        if (!audioElement) return;

        try {
            // Create AudioContext if not exists
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const audioContext = audioContextRef.current;

            // Create source node from audio element
            if (!sourceNodeRef.current) {
                sourceNodeRef.current = audioContext.createMediaElementSource(audioElement);
            }

            // Create gain node for volume control
            if (!gainNodeRef.current) {
                gainNodeRef.current = audioContext.createGain();
                gainNodeRef.current.gain.value = 1; // Start at full volume
            }

            // Connect nodes: source -> gain -> destination
            sourceNodeRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContext.destination);

            console.log('[Crossfade] Web Audio API initialized');
        } catch (error) {
            console.error('[Crossfade] Failed to initialize Web Audio API:', error);
        }

        return () => {
            // Cleanup on unmount
            if (gainNodeRef.current) {
                gainNodeRef.current.disconnect();
            }
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
            }
        };
    }, [audioElement]);

    /**
     * Apply crossfade effect when track changes
     */
    const applyCrossfade = useCallback((newTrackId: string) => {
        if (!crossfadeState.isEnabled || !gainNodeRef.current || !audioContextRef.current) {
            return;
        }

        const gainNode = gainNodeRef.current;
        const audioContext = audioContextRef.current;
        const currentTime = audioContext.currentTime;
        const { duration, curve } = crossfadeState;
        const durationInSeconds = duration / 1000;

        // Cancel any scheduled changes
        gainNode.gain.cancelScheduledValues(currentTime);

        // If this is a track change (not initial play)
        if (previousTrackRef.current && previousTrackRef.current !== newTrackId && !isCrossfadingRef.current) {
            isCrossfadingRef.current = true;

            console.log(`[Crossfade] Applying ${curve} crossfade (${duration}ms)`);

            // Fade out current track
            gainNode.gain.setValueAtTime(1, currentTime);

            if (curve === 'linear') {
                gainNode.gain.linearRampToValueAtTime(0, currentTime + durationInSeconds / 2);
            } else if (curve === 'exponential') {
                // Exponential requires values > 0, so use 0.001 as minimum
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + durationInSeconds / 2);
            } else {
                // Logarithmic curve (custom implementation)
                const steps = 20;
                for (let i = 0; i <= steps; i++) {
                    const progress = i / steps;
                    const time = currentTime + (durationInSeconds / 2) * progress;
                    const volume = Math.log10(1 + 9 * (1 - progress)); // Logarithmic decay
                    gainNode.gain.linearRampToValueAtTime(volume, time);
                }
            }

            // Fade in new track
            setTimeout(() => {
                gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);

                if (curve === 'linear') {
                    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + durationInSeconds / 2);
                } else if (curve === 'exponential') {
                    gainNode.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + durationInSeconds / 2);
                } else {
                    // Logarithmic curve (inverse)
                    const steps = 20;
                    for (let i = 0; i <= steps; i++) {
                        const progress = i / steps;
                        const time = audioContext.currentTime + (durationInSeconds / 2) * progress;
                        const volume = 1 - Math.log10(1 + 9 * (1 - progress));
                        gainNode.gain.linearRampToValueAtTime(volume, time);
                    }
                }

                isCrossfadingRef.current = false;
            }, (duration / 2));
        } else {
            // Initial play - just fade in
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(1, currentTime + 0.1); // Quick fade in
        }

        previousTrackRef.current = newTrackId;
    }, [crossfadeState]);

    /**
     * Enable or disable crossfade
     */
    const enableCrossfade = useCallback((enabled: boolean) => {
        setCrossfadeState(prev => ({ ...prev, isEnabled: enabled }));
        localStorage.setItem('crossfade_enabled', JSON.stringify(enabled));
    }, []);

    /**
     * Set crossfade duration and curve
     */
    const setCrossfadeDuration = useCallback((
        duration: number,
        curve: 'linear' | 'exponential' | 'logarithmic' = 'exponential'
    ) => {
        setCrossfadeState(prev => ({ ...prev, duration, curve }));
        localStorage.setItem('crossfade_duration', duration.toString());
        localStorage.setItem('crossfade_curve', curve);
    }, []);

    /**
     * Get current volume (for external use)
     */
    const getCurrentVolume = useCallback(() => {
        return gainNodeRef.current?.gain.value || 1;
    }, []);

    /**
     * Set volume directly (bypasses crossfade)
     */
    const setVolume = useCallback((volume: number) => {
        if (gainNodeRef.current && audioContextRef.current) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            gainNodeRef.current.gain.setValueAtTime(
                clampedVolume,
                audioContextRef.current.currentTime
            );
        }
    }, []);

    // Load saved preferences
    useEffect(() => {
        const savedEnabled = localStorage.getItem('crossfade_enabled');
        const savedDuration = localStorage.getItem('crossfade_duration');
        const savedCurve = localStorage.getItem('crossfade_curve');

        if (savedEnabled !== null) {
            setCrossfadeState(prev => ({ ...prev, isEnabled: JSON.parse(savedEnabled) }));
        }
        if (savedDuration) {
            setCrossfadeState(prev => ({ ...prev, duration: parseInt(savedDuration, 10) }));
        }
        if (savedCurve) {
            setCrossfadeState(prev => ({
                ...prev,
                curve: savedCurve as 'linear' | 'exponential' | 'logarithmic'
            }));
        }
    }, []);

    return {
        crossfadeState,
        enableCrossfade,
        setCrossfadeDuration,
        applyCrossfade,
        getCurrentVolume,
        setVolume,
    };
}
