'use client';

import { useEffect, useRef, useCallback } from 'react';

interface GestureHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    onPinchZoom?: (scale: number) => void;
    onPinchEnd?: (scale: number) => void;
}

interface TouchState {
    startX: number;
    startY: number;
    startTime: number;
    lastTapTime?: number;
    longPressTimer?: NodeJS.Timeout;
    initialDistance?: number;
    currentScale?: number;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity (px/ms)
const MAX_SWIPE_TIME = 300; // Maximum time for a swipe gesture (ms)
const DOUBLE_TAP_DELAY = 300; // Maximum time between taps for double-tap (ms)
const LONG_PRESS_DELAY = 500; // Minimum time for long press (ms)
const LONG_PRESS_THRESHOLD = 10; // Maximum movement for long press (px)
const PINCH_THRESHOLD = 20; // Minimum distance change for pinch (px)

/**
 * Hook for handling touch swipe gestures
 * @param handlers - Object containing swipe direction callbacks
 * @param enabled - Whether gestures are enabled (default: true)
 */
export function useTouchGestures(
    handlers: GestureHandlers,
    enabled: boolean = true
) {
    const touchStateRef = useRef<TouchState | null>(null);
    const elementRef = useRef<HTMLElement | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;

        const touch = e.touches[0];
        if (!touch) return;

        const now = Date.now();
        const state = touchStateRef.current;

        // Check for double tap
        if (state?.lastTapTime && now - state.lastTapTime < DOUBLE_TAP_DELAY) {
            handlers.onDoubleTap?.();
            touchStateRef.current = null;
            return;
        }

        // Clear any existing long press timer
        if (state?.longPressTimer) {
            clearTimeout(state.longPressTimer);
        }

        // Set up long press detection
        const longPressTimer = setTimeout(() => {
            const currentState = touchStateRef.current;
            if (currentState) {
                handlers.onLongPress?.();
            }
        }, LONG_PRESS_DELAY);

        // Handle pinch gesture initialization (two fingers)
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            if (!touch1 || !touch2) return;

            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            touchStateRef.current = {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: now,
                initialDistance: distance,
                currentScale: 1,
            };
            return;
        }

        touchStateRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: now,
            lastTapTime: now,
            longPressTimer,
        };
    }, [enabled, handlers]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStateRef.current) return;

        const state = touchStateRef.current;

        // Handle pinch gesture
        if (e.touches.length === 2 && state.initialDistance) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            if (!touch1 || !touch2) return;

            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            const scale = distance / state.initialDistance;

            // Only trigger if significant change
            if (Math.abs(distance - state.initialDistance) > PINCH_THRESHOLD) {
                touchStateRef.current = { ...state, currentScale: scale };
                handlers.onPinchZoom?.(scale);
            }
            return;
        }

        // Cancel long press if moved too much
        if (state.longPressTimer) {
            const touch = e.touches[0];
            if (!touch) return;

            const deltaX = Math.abs(touch.clientX - state.startX);
            const deltaY = Math.abs(touch.clientY - state.startY);

            if (deltaX > LONG_PRESS_THRESHOLD || deltaY > LONG_PRESS_THRESHOLD) {
                if (state.longPressTimer) {
                    clearTimeout(state.longPressTimer);
                }
                const { longPressTimer, ...restState } = state;
                touchStateRef.current = restState;
            }
        }
    }, [enabled, handlers]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStateRef.current) return;

        const state = touchStateRef.current;

        // Clear long press timer
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
        }

        // Handle pinch end
        if (state.currentScale !== undefined && state.currentScale !== 1) {
            handlers.onPinchEnd?.(state.currentScale);
            touchStateRef.current = null;
            return;
        }

        const touch = e.changedTouches[0];
        if (!touch) return;

        const { startX, startY, startTime } = state;

        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const deltaTime = Date.now() - startTime;

        // Check if within time threshold
        if (deltaTime > MAX_SWIPE_TIME) {
            touchStateRef.current = null;
            return;
        }

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Calculate velocity
        const velocity = Math.max(absX, absY) / deltaTime;

        // Check if meets swipe thresholds
        if (velocity < SWIPE_VELOCITY_THRESHOLD) {
            touchStateRef.current = null;
            return;
        }

        // Determine swipe direction (horizontal takes precedence if similar)
        if (absX > absY && absX > SWIPE_THRESHOLD) {
            if (deltaX > 0) {
                handlers.onSwipeRight?.();
            } else {
                handlers.onSwipeLeft?.();
            }
        } else if (absY > SWIPE_THRESHOLD) {
            if (deltaY > 0) {
                handlers.onSwipeDown?.();
            } else {
                handlers.onSwipeUp?.();
            }
        }

        touchStateRef.current = null;
    }, [enabled, handlers]);

    // Attach to a specific element
    const attachToElement = useCallback((element: HTMLElement | null) => {
        // Remove from previous element
        if (elementRef.current) {
            elementRef.current.removeEventListener('touchstart', handleTouchStart);
            elementRef.current.removeEventListener('touchend', handleTouchEnd);
        }

        elementRef.current = element;

        // Add to new element
        if (element) {
            element.addEventListener('touchstart', handleTouchStart, { passive: true });
            element.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    }, [handleTouchStart, handleTouchEnd]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (elementRef.current) {
                elementRef.current.removeEventListener('touchstart', handleTouchStart);
                elementRef.current.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [handleTouchStart, handleTouchEnd]);

    return { attachToElement };
}

/**
 * Hook for pull-to-refresh gesture
 * @param onRefresh - Callback when pull-to-refresh is triggered
 * @param threshold - Pull distance threshold (default: 80px)
 */
export function usePullToRefresh(
    onRefresh: () => Promise<void> | void,
    threshold: number = 80
) {
    const startY = useRef<number>(0);
    const pulling = useRef<boolean>(false);
    const refreshing = useRef<boolean>(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only trigger if at top of scroll
        const touch = e.touches[0];
        if (window.scrollY === 0 && touch) {
            startY.current = touch.clientY;
            pulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!pulling.current || refreshing.current) return;

        const touch = e.touches[0];
        if (!touch) return;

        const deltaY = touch.clientY - startY.current;

        // Prevent default to enable visual feedback
        if (deltaY > 0 && window.scrollY === 0) {
            // Could add visual indicator here
        }
    }, []);

    const handleTouchEnd = useCallback(async (e: TouchEvent) => {
        if (!pulling.current || refreshing.current) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaY = touch.clientY - startY.current;

        if (deltaY > threshold && window.scrollY === 0) {
            refreshing.current = true;
            await onRefresh();
            refreshing.current = false;
        }

        pulling.current = false;
    }, [onRefresh, threshold]);

    useEffect(() => {
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}
