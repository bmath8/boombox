import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 *
 * Centralized configuration for TanStack Query.
 * Handles caching, refetching, and error handling defaults.
 */

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data remains fresh for 1 minute
            staleTime: 60 * 1000,

            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,

            // Refetch on window focus (good for real-time apps)
            refetchOnWindowFocus: true,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Don't retry on 404s
            retry: (failureCount, error: any) => {
                if (error?.status === 404) return false;
                return failureCount < 2;
            },

            // Show errors in console during development
            throwOnError: process.env.NODE_ENV === 'development',
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,

            // Don't throw errors, handle them in onError callbacks
            throwOnError: false,
        },
    },
});

/**
 * Query Keys Factory
 *
 * Centralized query key management for consistent caching.
 * Use these to ensure cache invalidation works properly.
 */
export const queryKeys = {
    // Stations
    stations: {
        all: ['stations'] as const,
        lists: () => [...queryKeys.stations.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.stations.lists(), filters] as const,
        details: () => [...queryKeys.stations.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.stations.details(), id] as const,
    },

    // Playlists
    playlists: {
        all: ['playlists'] as const,
        lists: () => [...queryKeys.playlists.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.playlists.lists(), filters] as const,
        details: () => [...queryKeys.playlists.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.playlists.details(), id] as const,
        tracks: (id: string) => [...queryKeys.playlists.detail(id), 'tracks'] as const,
    },

    // Users
    users: {
        all: ['users'] as const,
        lists: () => [...queryKeys.users.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
        details: () => [...queryKeys.users.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.users.details(), id] as const,
        profile: (id: string) => [...queryKeys.users.detail(id), 'profile'] as const,
        current: () => ['user', 'current'] as const,
    },

    // Discovery
    discovery: {
        all: ['discovery'] as const,
        matches: (userId: string) => [...queryKeys.discovery.all, 'matches', userId] as const,
        feed: (userId: string) => [...queryKeys.discovery.all, 'feed', userId] as const,
    },

    // Search
    search: {
        all: ['search'] as const,
        results: (query: string, type?: string) => [...queryKeys.search.all, query, type || 'all'] as const,
    },

    // Spotify
    spotify: {
        all: ['spotify'] as const,
        playlists: () => [...queryKeys.spotify.all, 'playlists'] as const,
        tracks: (playlistId: string) => [...queryKeys.spotify.all, 'tracks', playlistId] as const,
        search: (query: string) => [...queryKeys.spotify.all, 'search', query] as const,
    },
} as const;
