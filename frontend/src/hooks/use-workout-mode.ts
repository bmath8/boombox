'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface WorkoutModeState {
    isActive: boolean;
    targetBPM: number;
    currentBPM: number;
    duration: number; // seconds
    elapsed: number; // seconds
}

const BPM_RANGES = {
    warmup: { min: 100, max: 120, name: 'Warm-up' },
    cardio: { min: 140, max: 180, name: 'Cardio' },
    hiit: { min: 160, max: 200, name: 'HIIT' },
    cooldown: { min: 80, max: 100, name: 'Cool-down' },
    strength: { min: 120, max: 140, name: 'Strength Training' },
};

/**
 * Hook for workout mode with BPM-based music selection
 * 
 * Automatically selects music based on target heart rate/BPM
 * Tracks workout duration and adjusts tempo
 */
export function useWorkoutMode() {
    const [state, setState] = useState<WorkoutModeState>({
        isActive: false,
        targetBPM: 140,
        currentBPM: 0,
        duration: 0,
        elapsed: 0,
    });

    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!state.isActive) return;

        intervalRef.current = setInterval(() => {
            setState(prev => ({
                ...prev,
                elapsed: prev.elapsed + 1,
            }));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.isActive]);

    const startWorkout = useCallback((type: keyof typeof BPM_RANGES, durationMinutes: number = 30) => {
        const bpmRange = BPM_RANGES[type];
        const targetBPM = Math.floor((bpmRange.min + bpmRange.max) / 2);

        setState({
            isActive: true,
            targetBPM,
            currentBPM: targetBPM,
            duration: durationMinutes * 60,
            elapsed: 0,
        });

        // TODO: Filter/sort playlist by BPM
        console.log('[Workout] Started:', type, `Target BPM: ${targetBPM}`);
    }, []);

    const stopWorkout = useCallback(() => {
        setState(prev => ({ ...prev, isActive: false }));
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, []);

    const adjustBPM = useCallback((bpm: number) => {
        setState(prev => ({ ...prev, targetBPM: bpm, currentBPM: bpm }));
        // TODO: Adjust playlist tempo
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getProgress = useCallback(() => {
        if (state.duration === 0) return 0;
        return (state.elapsed / state.duration) * 100;
    }, [state.duration, state.elapsed]);

    return {
        state,
        startWorkout,
        stopWorkout,
        adjustBPM,
        formatTime,
        getProgress,
        bpmRanges: BPM_RANGES,
    };
}
