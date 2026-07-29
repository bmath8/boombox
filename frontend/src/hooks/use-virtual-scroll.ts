'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Virtual scroll configuration
 */
interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number; // Number of extra items to render above/below viewport
}

/**
 * Virtual scroll result
 */
interface VirtualScrollResult<T> {
    visibleItems: T[];
    totalHeight: number;
    offsetY: number;
    scrollHandler: (scrollTop: number) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for virtual scrolling large lists
 * 
 * Dramatically improves performance by only rendering visible items
 * 
 * @example
 * ```tsx
 * const { visibleItems, totalHeight, offsetY, containerRef } = useVirtualScroll(
 *   items,
 *   { itemHeight: 80, containerHeight: 600, overscan: 3 }
 * );
 * 
 * return (
 *   <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetY}px)` }}>
 *         {visibleItems.map(item => <Item key={item.id} data={item} />)}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll<T>(
    items: T[],
    options: VirtualScrollOptions
): VirtualScrollResult<T> {
    const { itemHeight, containerHeight, overscan = 3 } = options;
    const containerRef = useRef<HTMLDivElement>(null);

    const [visibleRange, setVisibleRange] = useState({
        start: 0,
        end: Math.ceil(containerHeight / itemHeight) + overscan * 2,
    });

    // Calculate visible range based on scroll position
    const scrollHandler = useCallback((scrollTop: number) => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = Math.min(
            items.length,
            start + visibleCount + overscan * 2
        );

        setVisibleRange({ start, end });
    }, [itemHeight, containerHeight, overscan, items.length]);

    // Attach scroll listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            scrollHandler(container.scrollTop);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        // Initial calculation
        handleScroll();

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [scrollHandler]);

    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    const totalHeight = items.length * itemHeight;
    const offsetY = visibleRange.start * itemHeight;

    return {
        visibleItems,
        totalHeight,
        offsetY,
        scrollHandler,
        containerRef,
    };
}
