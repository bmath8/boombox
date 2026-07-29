'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type StudyPhase = 'work' | 'short-break' | 'long-break';

interface StudyTimerState {
    isActive: boolean;
    phase: StudyPhase;
    remainingSeconds: number;
    completedPomodoros: number;
    totalPomodoros: number;
}

interface StudyTimerSettings {
    workDuration: number; // minutes
    shortBreakDuration: number; // minutes
    longBreakDuration: number; // minutes
    pomodorosUntilLongBreak: number;
}

const DEFAULT_SETTINGS: StudyTimerSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
};

/**
 * Hook for study timer with Pomodoro technique and focus music
 * 
 * 25min work + 5min break cycles
 * Switches to calm music during breaks
 * Tracks completed pomodoros
 */
export function useStudyTimer(settings: Partial<StudyTimerSettings> = {}) {
    const finalSettings = { ...DEFAULT_SETTINGS, ...settings };

    const [state, setState] = useState<StudyTimerState>({
        isActive: false,
        phase: 'work',
        remainingSeconds: finalSettings.workDuration * 60,
        completedPomodoros: 0,
        totalPomodoros: 0,
    });

    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const onPhaseChangeRef = useRef<((phase: StudyPhase) => void) | null>(null);

    useEffect(() => {
        if (!state.isActive) return;

        intervalRef.current = setInterval(() => {
            setState(prev => {
                if (prev.remainingSeconds <= 1) {
                    // Phase complete - switch to next phase
                    const nextPhase = getNextPhase(prev.phase, prev.completedPomodoros, finalSettings);
                    const nextDuration = getPhaseDuration(nextPhase, finalSettings);

                    // Trigger callback
                    if (onPhaseChangeRef.current) {
                        onPhaseChangeRef.current(nextPhase);
                    }

                    return {
                        ...prev,
                        phase: nextPhase,
                        remainingSeconds: nextDuration,
                        completedPomodoros: prev.phase === 'work'
                            ? prev.completedPomodoros + 1
                            : prev.completedPomodoros,
                        totalPomodoros: prev.phase === 'work'
                            ? prev.totalPomodoros + 1
                            : prev.totalPomodoros,
                    };
                }

                return {
                    ...prev,
                    remainingSeconds: prev.remainingSeconds - 1,
                };
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.isActive, finalSettings]);

    const getNextPhase = (currentPhase: StudyPhase, completedPomodoros: number, settings: StudyTimerSettings): StudyPhase => {
        if (currentPhase === 'work') {
            // After work, check if we should take long break
            const nextPomodoros = completedPomodoros + 1;
            return nextPomodoros % settings.pomodorosUntilLongBreak === 0
                ? 'long-break'
                : 'short-break';
        }
        // After any break, back to work
        return 'work';
    };

    const getPhaseDuration = (phase: StudyPhase, settings: StudyTimerSettings): number => {
        switch (phase) {
            case 'work':
                return settings.workDuration * 60;
            case 'short-break':
                return settings.shortBreakDuration * 60;
            case 'long-break':
                return settings.longBreakDuration * 60;
        }
    };

    const start = useCallback(() => {
        setState(prev => ({ ...prev, isActive: true }));
    }, []);

    const pause = useCallback(() => {
        setState(prev => ({ ...prev, isActive: false }));
    }, []);

    const reset = useCallback(() => {
        setState({
            isActive: false,
            phase: 'work',
            remainingSeconds: finalSettings.workDuration * 60,
            completedPomodoros: 0,
            totalPomodoros: 0,
        });
    }, [finalSettings]);

    const skipToNextPhase = useCallback(() => {
        const nextPhase = getNextPhase(state.phase, state.completedPomodoros, finalSettings);
        const nextDuration = getPhaseDuration(nextPhase, finalSettings);

        setState(prev => ({
            ...prev,
            phase: nextPhase,
            remainingSeconds: nextDuration,
            completedPomodoros: prev.phase === 'work'
                ? prev.completedPomodoros + 1
                : prev.completedPomodoros,
            totalPomodoros: prev.phase === 'work'
                ? prev.totalPomodoros + 1
                : prev.totalPomodoros,
        }));

        if (onPhaseChangeRef.current) {
            onPhaseChangeRef.current(nextPhase);
        }
    }, [state.phase, state.completedPomodoros, finalSettings]);

    const setOnPhaseChange = useCallback((callback: (phase: StudyPhase) => void) => {
        onPhaseChangeRef.current = callback;
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        state,
        start,
        pause,
        reset,
        skipToNextPhase,
        setOnPhaseChange,
        formatTime,
        settings: finalSettings,
    };
}
