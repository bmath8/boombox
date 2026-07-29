'use client';

import { useState, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
    threshold?: number; // Distance to trigger refresh (px)
    maxPullDistance?: number; // Maximum pull distance (px)
    resistance?: number; // Pull resistance (0-1, lower = more resistance)
}

interface PullToRefreshResult {
    pullDistance: number;
    pulling: boolean;
    refreshing: boolean;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: () => void;
}

/**
 * Hook for pull-to-refresh functionality
 * 
 * @example
 * ```tsx
 * const { pullDistance, pulling, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } =
 *   usePullToRefresh(async () => {
 *     await fetchNewData();
 *   });
 * 
 * useEffect(() => {
 *   window.addEventListener('touchstart', handleTouchStart);
 *   window.addEventListener('touchmove', handleTouchMove);
 *   window.addEventListener('touchend', handleTouchEnd);
 *   return () => {
 *     window.removeEventListener('touchstart', handleTouchStart);
 *     window.removeEventListener('touchmove', handleTouchMove);
 *     window.removeEventListener('touchend', handleTouchEnd);
 *   };
 * }, []);
 * ```
 */
export function usePullToRefresh(
    onRefresh: () => Promise<void>,
    options: PullToRefreshOptions = {}
): PullToRefreshResult {
    const {
        threshold = 80,
        maxPullDistance = 120,
        resistance = 0.5,
    } = options;

    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only start pull if at top of page
        const touch = e.touches[0];
        if (window.scrollY === 0 && !refreshing && touch) {
            startY.current = touch.clientY;
            isDragging.current = true;
        }
    }, [refreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging.current || refreshing) return;

        const touch = e.touches[0];
        if (!touch) return;

        currentY.current = touch.clientY;
        const distance = currentY.current - startY.current;

        // Only allow pulling down
        if (distance > 0 && window.scrollY === 0) {
            // Apply resistance
            const resistedDistance = Math.min(
                distance * resistance,
                maxPullDistance
            );

            setPullDistance(resistedDistance);
            setPulling(resistedDistance > threshold);

            // Prevent default scrolling when pulling
            if (resistedDistance > 10) {
                e.preventDefault();
            }
        }
    }, [threshold, maxPullDistance, resistance, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging.current) return;

        isDragging.current = false;

        if (pulling && !refreshing) {
            setRefreshing(true);
            setPullDistance(threshold); // Snap to loading position

            try {
                await onRefresh();
            } catch (error) {
                console.error('[PullToRefresh] Refresh failed:', error);
            } finally {
                setRefreshing(false);
                setPullDistance(0);
                setPulling(false);
            }
        } else {
            // Release without refreshing
            setPullDistance(0);
            setPulling(false);
        }

        startY.current = 0;
        currentY.current = 0;
    }, [pulling, refreshing, onRefresh, threshold]);

    return {
        pullDistance,
        pulling,
        refreshing,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}
