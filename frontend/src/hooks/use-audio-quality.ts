'use client';

import { useState, useCallback, useEffect } from 'react';

export type AudioQuality = 'low' | 'medium' | 'high' | 'very-high';

interface QualitySettings {
    quality: AudioQuality;
    bitrate: number; // kbps
    autoAdjust: boolean; // Adjust based on network
}

const QUALITY_PRESETS: Record<AudioQuality, number> = {
    'low': 96,
    'medium': 160,
    'high': 320,
    'very-high': 500,
};

const STORAGE_KEY = 'audio_quality_settings';

/**
 * Hook for managing audio quality settings
 */
export function useAudioQuality() {
    const [settings, setSettings] = useState<QualitySettings>({
        quality: 'high',
        bitrate: 320,
        autoAdjust: true,
    });

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error('[Audio Quality] Failed to load:', e);
            }
        }
    }, []);

    const setQuality = useCallback((quality: AudioQuality) => {
        const newSettings: QualitySettings = {
            quality,
            bitrate: QUALITY_PRESETS[quality],
            autoAdjust: settings.autoAdjust,
        };
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }, [settings.autoAdjust]);

    const toggleAutoAdjust = useCallback(() => {
        setSettings(prev => {
            const newSettings = { ...prev, autoAdjust: !prev.autoAdjust };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    return {
        settings,
        setQuality,
        toggleAutoAdjust,
        qualityPresets: QUALITY_PRESETS,
    };
}
