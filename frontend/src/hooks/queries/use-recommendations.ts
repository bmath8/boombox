import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsAPI } from '@/lib/api/services/recommendations';
import { toast } from 'sonner';
import type { RecommendationParams, SmartPlaylist } from '@/types/recommendations';

/**
 * React Query Hooks for Recommendations
 */

// ==================== Query Keys ====================

export const recommendationKeys = {
    all: ['recommendations'] as const,
    personalized: () => [...recommendationKeys.all, 'personalized'] as const,
    discoverWeekly: () => [...recommendationKeys.all, 'discover-weekly'] as const,
    dailyMixes: () => [...recommendationKeys.all, 'daily-mixes'] as const,
    dailyMix: (id: string) => [...recommendationKeys.dailyMixes(), id] as const,
    smartPlaylists: () => [...recommendationKeys.all, 'smart-playlists'] as const,
    smartPlaylist: (id: string) => [...recommendationKeys.smartPlaylists(), id] as const,
    similarArtists: (artistId: string) =>
        [...recommendationKeys.all, 'similar-artists', artistId] as const,
    similarTracks: (trackId: string) =>
        [...recommendationKeys.all, 'similar-tracks', trackId] as const,
    similarToRecent: () => [...recommendationKeys.all, 'similar-to-recent'] as const,
    byMood: (mood: string) => [...recommendationKeys.all, 'by-mood', mood] as const,
    byActivity: (activity: string) =>
        [...recommendationKeys.all, 'by-activity', activity] as const,
    newReleases: () => [...recommendationKeys.all, 'new-releases'] as const,
    fromFriends: () => [...recommendationKeys.all, 'from-friends'] as const,
};

// ==================== Recommendation Queries ====================

/**
 * Get personalized recommendations
 */
export function usePersonalizedRecommendations() {
    return useQuery({
        queryKey: recommendationKeys.personalized(),
        queryFn: () => recommendationsAPI.getPersonalized(),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Get recommendations with custom parameters
 */
export function useRecommendations(params: RecommendationParams) {
    return useQuery({
        queryKey: [...recommendationKeys.all, 'custom', params],
        queryFn: () => recommendationsAPI.getRecommendations(params),
        enabled: !!(params.seed_artists || params.seed_tracks || params.seed_genres),
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}

/**
 * Get Discover Weekly playlist
 */
export function useDiscoverWeekly() {
    return useQuery({
        queryKey: recommendationKeys.discoverWeekly(),
        queryFn: () => recommendationsAPI.getDiscoverWeekly(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Refresh Discover Weekly
 */
export function useRefreshDiscoverWeekly() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => recommendationsAPI.refreshDiscoverWeekly(),
        onSuccess: (data) => {
            queryClient.setQueryData(recommendationKeys.discoverWeekly(), data);
            toast.success('Discover Weekly refreshed!');
        },
        onError: () => {
            toast.error('Failed to refresh Discover Weekly');
        },
    });
}

/**
 * Get Daily Mixes
 */
export function useDailyMixes() {
    return useQuery({
        queryKey: recommendationKeys.dailyMixes(),
        queryFn: () => recommendationsAPI.getDailyMixes(),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Get specific Daily Mix
 */
export function useDailyMix(mixId: string) {
    return useQuery({
        queryKey: recommendationKeys.dailyMix(mixId),
        queryFn: () => recommendationsAPI.getDailyMix(mixId),
        enabled: !!mixId,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Get smart playlists
 */
export function useSmartPlaylists() {
    return useQuery({
        queryKey: recommendationKeys.smartPlaylists(),
        queryFn: () => recommendationsAPI.getSmartPlaylists(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get specific smart playlist
 */
export function useSmartPlaylist(playlistId: string) {
    return useQuery({
        queryKey: recommendationKeys.smartPlaylist(playlistId),
        queryFn: () => recommendationsAPI.getSmartPlaylist(playlistId),
        enabled: !!playlistId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Create smart playlist
 */
export function useCreateSmartPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playlist: Parameters<typeof recommendationsAPI.createSmartPlaylist>[0]) =>
            recommendationsAPI.createSmartPlaylist(playlist),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: recommendationKeys.smartPlaylists() });
            toast.success('Smart playlist created!');
        },
        onError: () => {
            toast.error('Failed to create smart playlist');
        },
    });
}

/**
 * Update smart playlist
 */
export function useUpdateSmartPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ playlistId, updates }: { playlistId: string; updates: Partial<SmartPlaylist> }) =>
            recommendationsAPI.updateSmartPlaylist(playlistId, updates),
        onSuccess: (data) => {
            queryClient.setQueryData(recommendationKeys.smartPlaylist(data.id), data);
            queryClient.invalidateQueries({ queryKey: recommendationKeys.smartPlaylists() });
            toast.success('Smart playlist updated!');
        },
        onError: () => {
            toast.error('Failed to update smart playlist');
        },
    });
}

/**
 * Delete smart playlist
 */
export function useDeleteSmartPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playlistId: string) =>
            recommendationsAPI.deleteSmartPlaylist(playlistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: recommendationKeys.smartPlaylists() });
            toast.success('Smart playlist deleted');
        },
        onError: () => {
            toast.error('Failed to delete smart playlist');
        },
    });
}

/**
 * Get similar artists
 */
export function useSimilarArtists(artistId: string) {
    return useQuery({
        queryKey: recommendationKeys.similarArtists(artistId),
        queryFn: () => recommendationsAPI.getSimilarArtists(artistId),
        enabled: !!artistId,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Get similar tracks
 */
export function useSimilarTracks(trackId: string) {
    return useQuery({
        queryKey: recommendationKeys.similarTracks(trackId),
        queryFn: () => recommendationsAPI.getSimilarTracks(trackId),
        enabled: !!trackId,
        staleTime: 60 * 60 * 1000,
    });
}

/**
 * Get tracks similar to recently played
 */
export function useSimilarToRecent(limit = 50) {
    return useQuery({
        queryKey: [...recommendationKeys.similarToRecent(), limit],
        queryFn: () => recommendationsAPI.getSimilarToRecent(limit),
        staleTime: 15 * 60 * 1000,
    });
}

/**
 * Get recommendations by mood
 */
export function useRecommendationsByMood(mood: string) {
    return useQuery({
        queryKey: recommendationKeys.byMood(mood),
        queryFn: () => recommendationsAPI.getByMood(mood as any),
        enabled: !!mood,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Get recommendations by activity
 */
export function useRecommendationsByActivity(activity: string) {
    return useQuery({
        queryKey: recommendationKeys.byActivity(activity),
        queryFn: () => recommendationsAPI.getByActivity(activity as any),
        enabled: !!activity,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Get new releases
 */
export function useNewReleases() {
    return useQuery({
        queryKey: recommendationKeys.newReleases(),
        queryFn: () => recommendationsAPI.getNewReleases(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Get recommendations from friends
 */
export function useRecommendationsFromFriends() {
    return useQuery({
        queryKey: recommendationKeys.fromFriends(),
        queryFn: () => recommendationsAPI.getFromFriends(),
        staleTime: 15 * 60 * 1000,
    });
}
