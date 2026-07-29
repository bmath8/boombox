'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for VinylBroadcast component
 * 
 * Matches the layout of the desktop vinyl player
 */
export function VinylBroadcastSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#1a0a25] to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <Skeleton className="h-12 w-48" />
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-32 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Main vinyl player area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Vinyl/Album art */}
                    <div className="space-y-6">
                        <Skeleton className="w-full aspect-square rounded-full" />
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-3/4 mx-auto" />
                            <Skeleton className="h-6 w-1/2 mx-auto" />
                        </div>
                    </div>

                    {/* Controls and info */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-12 w-full" />
                        </div>

                        {/* Playback controls */}
                        <div className="flex items-center justify-center gap-6">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="w-14 h-14 rounded-full" />
                            ))}
                        </div>

                        {/* Progress bar */}
                        <Skeleton className="h-2 w-full rounded-full" />

                        {/* Additional info */}
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton loader for chat messages
 */
export function ChatSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for queue panel
 */
export function QueueSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for discovery feed
 */
export function DiscoveryFeedSkeleton() {
    return (
        <div className="space-y-6 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <div className="flex gap-2">
                        {[...Array(3)].map((_, j) => (
                            <Skeleton key={j} className="h-8 w-20 rounded-full" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for search results
 */
export function SearchSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg">
                    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );
}
