'use client';

import { useState, useCallback, useEffect } from 'react';

type AnimationPreset = 'default' | 'minimal' | 'enhanced' | 'off';

interface AnimationSettings {
    preset: AnimationPreset;
    vinylRotation: boolean;
    waveformAnimation: boolean;
    visualizerEnabled: boolean;
    transitionDuration: number; // ms
    reducedMotion: boolean;
}

const DEFAULT_SETTINGS: AnimationSettings = {
    preset: 'default',
    vinylRotation: true,
    waveformAnimation: true,
    visualizerEnabled: true,
    transitionDuration: 300,
    reducedMotion: false,
};

const STORAGE_KEY = 'animation_settings';

/**
 * Hook for customizing background animations and visual effects
 */
export function useAnimationCustomization() {
    const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        // Check system preference for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const loadedSettings = JSON.parse(stored);
                setSettings({
                    ...loadedSettings,
                    reducedMotion: prefersReducedMotion || loadedSettings.reducedMotion,
                });
            } catch (e) {
                console.error('[Animations] Failed to load settings:', e);
            }
        } else if (prefersReducedMotion) {
            setSettings(prev => ({ ...prev, reducedMotion: true }));
        }
    }, []);

    const setPreset = useCallback((preset: AnimationPreset) => {
        let newSettings: AnimationSettings;

        switch (preset) {
            case 'minimal':
                newSettings = {
                    ...settings,
                    preset,
                    vinylRotation: true,
                    waveformAnimation: false,
                    visualizerEnabled: false,
                    transitionDuration: 150,
                };
                break;
            case 'enhanced':
                newSettings = {
                    ...settings,
                    preset,
                    vinylRotation: true,
                    waveformAnimation: true,
                    visualizerEnabled: true,
                    transitionDuration: 500,
                };
                break;
            case 'off':
                newSettings = {
                    ...settings,
                    preset,
                    vinylRotation: false,
                    waveformAnimation: false,
                    visualizerEnabled: false,
                    transitionDuration: 0,
                };
                break;
            default:
                newSettings = { ...DEFAULT_SETTINGS, preset: 'default' };
        }

        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof AnimationSettings>(
        key: K,
        value: AnimationSettings[K]
    ) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value, preset: 'default' as AnimationPreset };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    return {
        settings,
        setPreset,
        updateSetting,
    };
}
