'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Haptic feedback pattern types for iOS
 */
export type HapticPattern =
    | 'light'      // Light tap (e.g., UI feedback)
    | 'medium'     // Medium tap (e.g., button press)
    | 'heavy'      // Heavy tap (e.g., important action)
    | 'success'    // Success pattern
    | 'warning'    // Warning pattern
    | 'error';     // Error pattern

/**
 * Haptic pattern configurations using Vibration API
 * Pattern format: [vibrate_ms, pause_ms, vibrate_ms, ...]
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [10, 50, 10, 50, 10],
    error: [30, 50, 30],
};

/**
 * Hook for iOS haptic feedback using Vibration API
 * 
 * Provides haptic feedback on iOS devices that support vibration.
 * Gracefully degrades on devices without haptic support.
 * 
 * @returns Object with haptic trigger function and support detection
 * 
 * @example
 * ```tsx
 * const { triggerHaptic, isSupported } = useIOSHaptics();
 * 
 * <button onClick={() => triggerHaptic('medium')}>
 *   Click me
 * </button>
 * ```
 */
export function useIOSHaptics() {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if Vibration API is supported
        setIsSupported(
            typeof navigator !== 'undefined' &&
            'vibrate' in navigator
        );
    }, []);

    /**
     * Trigger a haptic feedback pattern
     * @param pattern - The haptic pattern to trigger
     */
    const triggerHaptic = useCallback((pattern: HapticPattern) => {
        if (!isSupported) {
            // Silently fail on unsupported devices
            return;
        }

        try {
            const vibrationPattern = HAPTIC_PATTERNS[pattern];
            navigator.vibrate(vibrationPattern);
        } catch (error) {
            // Suppress errors - haptics are enhancement only
            console.debug('[Haptics] Failed to trigger haptic:', error);
        }
    }, [isSupported]);

    /**
     * Trigger a custom haptic pattern
     * @param pattern - Custom vibration pattern array
     */
    const triggerCustomHaptic = useCallback((pattern: number | number[]) => {
        if (!isSupported) {
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.debug('[Haptics] Failed to trigger custom haptic:', error);
        }
    }, [isSupported]);

    /**
     * Cancel any ongoing haptic feedback
     */
    const cancelHaptic = useCallback(() => {
        if (!isSupported) {
            return;
        }

        try {
            navigator.vibrate(0);
        } catch (error) {
            console.debug('[Haptics] Failed to cancel haptic:', error);
        }
    }, [isSupported]);

    return {
        triggerHaptic,
        triggerCustomHaptic,
        cancelHaptic,
        isSupported,
    };
}

/**
 * Hook for haptic feedback on button interactions
 * Automatically triggers haptic on click events
 * 
 * @param pattern - Haptic pattern to use (default: 'light')
 * @param enabled - Whether haptics are enabled (default: true)
 * @returns onClick handler that triggers haptic
 * 
 * @example
 * ```tsx
 * const handleClick = useHapticClick('medium');
 * 
 * <button onClick={handleClick(() => console.log('clicked'))}>
 *   Click me
 * </button>
 * ```
 */
export function useHapticClick(
    pattern: HapticPattern = 'light',
    enabled: boolean = true
) {
    const { triggerHaptic } = useIOSHaptics();

    const handleClick = useCallback(
        (callback?: () => void) => () => {
            if (enabled) {
                triggerHaptic(pattern);
            }
            callback?.();
        },
        [triggerHaptic, pattern, enabled]
    );

    return handleClick;
}
