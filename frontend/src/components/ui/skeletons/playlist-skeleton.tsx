'use client';

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for playlist track cards
 *
 * Matches the PlaylistTrackCard layout
 */
export function PlaylistTrackSkeleton() {
    return (
        <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-4">
                {/* Position */}
                <Skeleton className="w-8 h-6" />

                {/* Album Art */}
                <Skeleton className="w-14 h-14 rounded" />

                {/* Track Info */}
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>

                {/* Voting */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-6" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>

                {/* Duration */}
                <Skeleton className="w-12 h-4" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * Multiple playlist track skeletons for list views
 */
export function PlaylistTrackSkeletons({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <PlaylistTrackSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton loader for playlist cards (grid view)
 */
export function PlaylistCardSkeleton() {
    return (
        <div className="glass-dark p-5 rounded-2xl border border-white/5">
            {/* Playlist image */}
            <Skeleton className="w-full aspect-square rounded-xl mb-4" />

            {/* Playlist name */}
            <Skeleton className="h-6 w-3/4 mb-2" />

            {/* Track count and creator */}
            <Skeleton className="h-4 w-1/2 mb-4" />

            {/* Play button and actions */}
            <div className="flex items-center justify-between">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * Multiple playlist card skeletons for grid layouts
 */
export function PlaylistCardSkeletons({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <PlaylistCardSkeleton key={i} />
            ))}
        </>
    );
}
