'use client';

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader that matches the StationCard layout
 *
 * This provides a loading state that closely matches the actual
 * station card structure for better perceived performance
 */
export function StationCardSkeleton() {
    return (
        <div className="glass-dark p-5 rounded-2xl border border-white/5">
            <div className="flex items-start justify-between mb-4">
                {/* Radio icon placeholder */}
                <Skeleton className="w-12 h-12 rounded-xl" />

                {/* Live badge placeholder */}
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>

            {/* Station name placeholder */}
            <Skeleton className="h-7 w-3/4 mb-2" />

            {/* Broadcaster name placeholder */}
            <div className="flex items-center gap-2 mb-6">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Footer with listener count and play button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                </div>

                {/* Play button placeholder */}
                <Skeleton className="w-10 h-10 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Multiple station card skeletons for grid layouts
 */
export function StationCardSkeletons({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <StationCardSkeleton key={i} />
            ))}
        </>
    );
}
