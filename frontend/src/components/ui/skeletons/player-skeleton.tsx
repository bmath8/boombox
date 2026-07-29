'use client';

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader that matches the Player layout
 *
 * This provides a loading state for the fixed bottom music player
 */
export function PlayerSkeleton() {
    return (
        <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 p-4 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Track Info */}
                <div className="flex items-center gap-4 w-1/3">
                    <Skeleton className="w-14 h-14 rounded-lg" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="flex items-center gap-6">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-5 h-5 rounded" />
                    </div>
                </div>

                {/* Volume / Device */}
                <div className="flex items-center gap-4 justify-end w-1/3">
                    <Skeleton className="w-24 h-4 rounded" />
                </div>
            </div>
        </div>
    );
}
