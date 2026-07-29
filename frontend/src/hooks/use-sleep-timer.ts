'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface SleepTimerState {
    isActive: boolean;
    remainingSeconds: number;
    totalSeconds: number;
    endTime: number | null;
}

/**
 * Hook for sleep timer functionality
 * 
 * Automatically pauses playback after a set duration
 */
export function useSleepTimer(onTimerEnd: () => void) {
    const [state, setState] = useState<SleepTimerState>({
        isActive: false,
        remainingSeconds: 0,
        totalSeconds: 0,
        endTime: null,
    });

    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!state.isActive || !state.endTime) return;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((state.endTime! - now) / 1000));

            if (remaining === 0) {
                setState(prev => ({ ...prev, isActive: false, remainingSeconds: 0 }));
                clearInterval(intervalRef.current);
                onTimerEnd();
            } else {
                setState(prev => ({ ...prev, remainingSeconds: remaining }));
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.isActive, state.endTime, onTimerEnd]);

    const startTimer = useCallback((minutes: number) => {
        const totalSeconds = minutes * 60;
        const endTime = Date.now() + (totalSeconds * 1000);

        setState({
            isActive: true,
            remainingSeconds: totalSeconds,
            totalSeconds,
            endTime,
        });
    }, []);

    const cancelTimer = useCallback(() => {
        setState({
            isActive: false,
            remainingSeconds: 0,
            totalSeconds: 0,
            endTime: null,
        });
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        state,
        startTimer,
        cancelTimer,
        formatTime,
    };
}
