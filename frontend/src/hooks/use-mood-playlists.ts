'use client';

import { useState, useCallback } from 'react';

export type Mood = 'happy' | 'sad' | 'energetic' | 'calm' | 'focus' | 'party' | 'chill' | 'workout' | 'sleep' | 'romantic';

interface MoodPreset {
    name: string;
    description: string;
    genres: string[];
    tempo: 'slow' | 'medium' | 'fast';
    energy: 'low' | 'medium' | 'high';
}

const MOOD_PRESETS: Record<Mood, MoodPreset> = {
    happy: {
        name: 'Happy',
        description: 'Upbeat and positive vibes',
        genres: ['pop', 'indie', 'dance'],
        tempo: 'fast',
        energy: 'high',
    },
    sad: {
        name: 'Sad',
        description: 'Melancholic and emotional',
        genres: ['indie', 'alternative', 'acoustic'],
        tempo: 'slow',
        energy: 'low',
    },
    energetic: {
        name: 'Energetic',
        description: 'High energy workout music',
        genres: ['edm', 'rock', 'hip-hop'],
        tempo: 'fast',
        energy: 'high',
    },
    calm: {
        name: 'Calm',
        description: 'Peaceful and relaxing',
        genres: ['ambient', 'classical', 'jazz'],
        tempo: 'slow',
        energy: 'low',
    },
    focus: {
        name: 'Focus',
        description: 'Concentration and productivity',
        genres: ['lo-fi', 'classical', 'ambient'],
        tempo: 'medium',
        energy: 'medium',
    },
    party: {
        name: 'Party',
        description: 'Dance and celebration',
        genres: ['edm', 'dance', 'hip-hop'],
        tempo: 'fast',
        energy: 'high',
    },
    chill: {
        name: 'Chill',
        description: 'Laid-back and easy-going',
        genres: ['lo-fi', 'r&b', 'indie'],
        tempo: 'slow',
        energy: 'low',
    },
    workout: {
        name: 'Workout',
        description: 'Pump up the energy',
        genres: ['rock', 'hip-hop', 'edm'],
        tempo: 'fast',
        energy: 'high',
    },
    sleep: {
        name: 'Sleep',
        description: 'Soothing sleep sounds',
        genres: ['ambient', 'classical', 'nature'],
        tempo: 'slow',
        energy: 'low',
    },
    romantic: {
        name: 'Romantic',
        description: 'Love and romance',
        genres: ['r&b', 'pop', 'acoustic'],
        tempo: 'medium',
        energy: 'medium',
    },
};

/**
 * Hook for mood-based playlist generation
 * 
 * Selects music based on user's current mood
 */
export function useMoodPlaylists() {
    const [currentMood, setCurrentMood] = useState<Mood | null>(null);

    const selectMood = useCallback((mood: Mood) => {
        setCurrentMood(mood);
        localStorage.setItem('current_mood', mood);
        // TODO: Fetch playlist based on mood preset
        console.log('[Mood] Selected:', mood, MOOD_PRESETS[mood]);
    }, []);

    const clearMood = useCallback(() => {
        setCurrentMood(null);
        localStorage.removeItem('current_mood');
    }, []);

    const getMoodPreset = useCallback((mood: Mood) => {
        return MOOD_PRESETS[mood];
    }, []);

    return {
        currentMood,
        selectMood,
        clearMood,
        getMoodPreset,
        allMoods: MOOD_PRESETS,
    };
}
