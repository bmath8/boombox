'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Wake Lock API type definitions
 * Note: Using lib.dom.d.ts types for Navigator.wakeLock
 */
interface WakeLockSentinel extends EventTarget {
    readonly type: 'screen';
    release(): Promise<void>;
}

interface WakeLock {
    request(type: 'screen'): Promise<WakeLockSentinel>;
}

/**
 * Hook for Screen Wake Lock API
 * 
 * Prevents the device screen from dimming or locking while the app is active.
 * Useful for music players, video players, and other continuous-use apps.
 * 
 * Automatically re-acquires lock when page becomes visible again.
 * 
 * @param enabled - Whether wake lock should be active
 * @returns Object with wake lock status and control functions
 * 
 * @example
 * ```tsx
 * const { isActive, isSupported, request, release } = useWakeLock(isPlaying);
 * 
 * // Wake lock is automatically requested when enabled=true
 * // and released when enabled=false
 * ```
 */
export function useWakeLock(enabled: boolean = false) {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Check for Wake Lock API support
    useEffect(() => {
        setIsSupported(
            typeof navigator !== 'undefined' &&
            'wakeLock' in navigator
        );
    }, []);

    /**
     * Request a wake lock
     */
    const request = useCallback(async () => {
        if (!isSupported || wakeLockRef.current) {
            return;
        }

        try {
            wakeLockRef.current = await navigator.wakeLock!.request('screen');
            setIsActive(true);

            console.debug('[WakeLock] Wake lock acquired');

            // Listen for release (can happen automatically on page visibility change)
            wakeLockRef.current.addEventListener('release', () => {
                console.debug('[WakeLock] Wake lock released');
                wakeLockRef.current = null;
                setIsActive(false);
            });
        } catch (error) {
            console.error('[WakeLock] Failed to acquire wake lock:', error);
            wakeLockRef.current = null;
            setIsActive(false);
        }
    }, [isSupported]);

    /**
     * Release the wake lock
     */
    const release = useCallback(async () => {
        if (!wakeLockRef.current) {
            return;
        }

        try {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            setIsActive(false);
            console.debug('[WakeLock] Wake lock released manually');
        } catch (error) {
            console.error('[WakeLock] Failed to release wake lock:', error);
        }
    }, []);

    // Request/release based on enabled prop
    useEffect(() => {
        if (enabled) {
            void request();
        } else {
            void release();
        }

        // Cleanup on unmount
        return () => {
            void release();
        };
    }, [enabled, request, release]);

    // Re-acquire wake lock when page becomes visible
    useEffect(() => {
        if (!isSupported) {
            return;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && enabled && !wakeLockRef.current) {
                void request();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSupported, enabled, request]);

    return {
        isSupported,
        isActive,
        request,
        release,
    };
}

/**
 * Hook that automatically manages wake lock based on media playback state
 * 
 * @param isPlaying - Whether media is currently playing
 * @returns Wake lock status and control functions
 * 
 * @example
 * ```tsx
 * const { isActive } = useMediaWakeLock(isPlaying);
 * ```
 */
export function useMediaWakeLock(isPlaying: boolean) {
    return useWakeLock(isPlaying);
}
