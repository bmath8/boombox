'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * EQ Preset definitions
 */
export const EQ_PRESETS = {
    flat: {
        name: 'Flat',
        description: 'No equalization',
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    bassBoost: {
        name: 'Bass Boost',
        description: 'Enhanced low frequencies',
        bands: [12, 9, 6, 3, 0, 0, 0, 0, 0, 0],
    },
    trebleBoost: {
        name: 'Treble Boost',
        description: 'Enhanced high frequencies',
        bands: [0, 0, 0, 0, 0, 0, 3, 6, 9, 12],
    },
    vocal: {
        name: 'Vocal',
        description: 'Optimized for vocals',
        bands: [-3, -2, 0, 3, 6, 6, 3, 0, -2, -3],
    },
    rock: {
        name: 'Rock',
        description: 'Punchy rock sound',
        bands: [6, 4, 2, -2, -3, -2, 2, 4, 6, 7],
    },
    electronic: {
        name: 'Electronic',
        description: 'Deep bass and crisp highs',
        bands: [8, 6, 0, -2, -3, 0, 2, 4, 6, 8],
    },
    classical: {
        name: 'Classical',
        description: 'Balanced classical music',
        bands: [0, 0, 0, 0, 0, 0, -3, -3, -3, -5],
    },
    jazz: {
        name: 'Jazz',
        description: 'Smooth jazz tones',
        bands: [4, 3, 2, 2, 0, 0, 0, 2, 3, 4],
    },
    acoustic: {
        name: 'Acoustic',
        description: 'Natural acoustic sound',
        bands: [5, 4, 3, 1, 0, 0, 1, 3, 4, 4],
    },
    hiphop: {
        name: 'Hip Hop',
        description: 'Heavy bass emphasis',
        bands: [10, 8, 4, 2, 0, -2, -2, 0, 2, 3],
    },
} as const;

export type EQPresetName = keyof typeof EQ_PRESETS;

/**
 * Frequency bands for 10-band equalizer (Hz)
 */
const FREQUENCY_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

interface EQState {
    activePreset: EQPresetName;
    customBands: number[];
    isEnabled: boolean;
}

/**
 * Hook for audio equalization with presets
 * 
 * Features:
 * - 10-band parametric EQ using Web Audio API
 * - Pre-defined presets (Bass Boost, Treble, Rock, etc.)
 * - Custom EQ curves
 * - Real-time audio processing
 * - Persistent settings
 * 
 * @example
 * ```tsx
 * const { eqState, setPreset, setCustomBand, enableEQ } = useEqualizer(audioRef);
 * 
 * // Apply bass boost preset
 * setPreset('bassBoost');
 * 
 * // Custom adjustment
 * setCustomBand(0, 6); // Boost 32Hz by 6dB
 * ```
 */
export function useEqualizer(audioElement: HTMLAudioElement | null) {
    const [eqState, setEQState] = useState<EQState>({
        activePreset: 'flat',
        customBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        isEnabled: true,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const filterNodesRef = useRef<BiquadFilterNode[]>([]);
    const isInitializedRef = useRef(false);

    // Initialize Web Audio API and EQ filters
    useEffect(() => {
        if (!audioElement || isInitializedRef.current) return;

        try {
            // Create AudioContext
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const audioContext = audioContextRef.current;

            // Create source node
            if (!sourceNodeRef.current) {
                sourceNodeRef.current = audioContext.createMediaElementSource(audioElement);
            }

            const sourceNode = sourceNodeRef.current;

            // Create 10 bandfilters
            filterNodesRef.current = FREQUENCY_BANDS.map((frequency, index) => {
                const filter = audioContext.createBiquadFilter();

                // First and last bands are shelf filters, middle bands are peaking
                if (index === 0) {
                    filter.type = 'lowshelf';
                } else if (index === FREQUENCY_BANDS.length - 1) {
                    filter.type = 'highshelf';
                } else {
                    filter.type = 'peaking';
                }

                filter.frequency.value = frequency;
                filter.Q.value = 1; // Quality factor
                filter.gain.value = 0; // Start flat

                return filter;
            });

            // Connect nodes: source -> filter1 -> filter2 -> ... -> destination
            let previousNode: AudioNode = sourceNode;
            filterNodesRef.current.forEach(filter => {
                previousNode.connect(filter);
                previousNode = filter;
            });
            previousNode.connect(audioContext.destination);

            isInitializedRef.current = true;
            console.log('[Equalizer] Web Audio API initialized with', filterNodesRef.current.length, 'bands');
        } catch (error) {
            console.error('[Equalizer] Failed to initialize:', error);
        }

        return () => {
            // Cleanup
            filterNodesRef.current.forEach(filter => filter.disconnect());
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
            }
        };
    }, [audioElement]);

    /**
     * Apply EQ settings to filters
     */
    const applyEQSettings = useCallback((bands: number[]) => {
        if (!eqState.isEnabled) {
            // Reset all to 0 when disabled
            filterNodesRef.current.forEach(filter => {
                filter.gain.value = 0;
            });
            return;
        }

        filterNodesRef.current.forEach((filter, index) => {
            const gain = bands[index] || 0;
            filter.gain.value = gain;
        });

        console.log('[Equalizer] Applied settings:', bands);
    }, [eqState.isEnabled]);

    /**
     * Set EQ preset
     */
    const setPreset = useCallback((presetName: EQPresetName) => {
        const preset = EQ_PRESETS[presetName];
        const bandsCopy = [...preset.bands];
        setEQState(prev => ({
            ...prev,
            activePreset: presetName,
            customBands: bandsCopy,
        }));
        applyEQSettings(bandsCopy);
        localStorage.setItem('eq_preset', presetName);
        localStorage.setItem('eq_custom_bands', JSON.stringify(preset.bands));
    }, [applyEQSettings]);

    /**
     * Set custom band value
     */
    const setCustomBand = useCallback((bandIndex: number, value: number) => {
        if (bandIndex < 0 || bandIndex >= FREQUENCY_BANDS.length) return;

        const clampedValue = Math.max(-12, Math.min(12, value));

        setEQState(prev => {
            const newBands = [...prev.customBands];
            newBands[bandIndex] = clampedValue;
            applyEQSettings(newBands);
            localStorage.setItem('eq_custom_bands', JSON.stringify(newBands));
            localStorage.setItem('eq_preset', 'custom');
            return {
                ...prev,
                activePreset: 'custom' as any,
                customBands: newBands,
            };
        });
    }, [applyEQSettings]);

    /**
     * Enable/disable EQ
     */
    const enableEQ = useCallback((enabled: boolean) => {
        setEQState(prev => ({ ...prev, isEnabled: enabled }));
        if (!enabled) {
            // Reset all gains to 0
            filterNodesRef.current.forEach(filter => {
                filter.gain.value = 0;
            });
        } else {
            // Reapply current settings
            applyEQSettings(eqState.customBands);
        }
        localStorage.setItem('eq_enabled', JSON.stringify(enabled));
    }, [eqState.customBands, applyEQSettings]);

    /**
     * Reset to flat EQ
     */
    const resetEQ = useCallback(() => {
        setPreset('flat');
    }, [setPreset]);

    // Load saved settings
    useEffect(() => {
        const savedPreset = localStorage.getItem('eq_preset') as EQPresetName | null;
        const savedBands = localStorage.getItem('eq_custom_bands');
        const savedEnabled = localStorage.getItem('eq_enabled');

        if (savedEnabled !== null) {
            const enabled = JSON.parse(savedEnabled);
            setEQState(prev => ({ ...prev, isEnabled: enabled }));
        }

        if (savedBands) {
            try {
                const bands = JSON.parse(savedBands);
                setEQState(prev => ({ ...prev, customBands: bands }));
                applyEQSettings(bands);
            } catch (e) {
                console.error('[Equalizer] Failed to load saved bands:', e);
            }
        }

        if (savedPreset && savedPreset in EQ_PRESETS) {
            setEQState(prev => ({ ...prev, activePreset: savedPreset }));
        }
    }, [applyEQSettings]);

    return {
        eqState,
        setPreset,
        setCustomBand,
        enableEQ,
        resetEQ,
        presets: EQ_PRESETS,
        frequencyBands: FREQUENCY_BANDS,
    };
}
