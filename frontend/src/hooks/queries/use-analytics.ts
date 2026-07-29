import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/services/analytics';

/**
 * React Query Hooks for Analytics
 */

// ==================== Query Keys ====================

export const analyticsKeys = {
    all: ['analytics'] as const,
    summary: (period?: string) => [...analyticsKeys.all, 'summary', period] as const,
    listeningStats: (period?: string) =>
        [...analyticsKeys.all, 'listening-stats', period] as const,
    trends: (period: string) => [...analyticsKeys.all, 'trends', period] as const,
    genreDistribution: (period?: string) =>
        [...analyticsKeys.all, 'genre-distribution', period] as const,
    genreInsights: (period?: string) =>
        [...analyticsKeys.all, 'genre-insights', period] as const,
    artistInsights: (period?: string, limit?: number) =>
        [...analyticsKeys.all, 'artist-insights', period, limit] as const,
    patterns: (period?: string) => [...analyticsKeys.all, 'patterns', period] as const,
    discovery: (period: string) => [...analyticsKeys.all, 'discovery', period] as const,
    mood: (period: string) => [...analyticsKeys.all, 'mood', period] as const,
    compareWithFriend: (friendId: string) =>
        [...analyticsKeys.all, 'compare', friendId] as const,
    friendComparisons: () => [...analyticsKeys.all, 'friend-comparisons'] as const,
    milestones: () => [...analyticsKeys.all, 'milestones'] as const,
};

// ==================== Analytics Queries ====================

/**
 * Get analytics summary
 */
export function useAnalyticsSummary(period?: 'week' | 'month' | 'year' | 'all_time') {
    return useQuery({
        queryKey: analyticsKeys.summary(period),
        queryFn: () => analyticsAPI.getSummary(period ? { period } : {}),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Get listening statistics
 */
export function useListeningStats(period?: string) {
    return useQuery({
        queryKey: analyticsKeys.listeningStats(period),
        queryFn: () => analyticsAPI.getListeningStats(period),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Get listening trends
 */
export function useListeningTrends(period: 'week' | 'month' | 'year' = 'month') {
    return useQuery({
        queryKey: analyticsKeys.trends(period),
        queryFn: () => analyticsAPI.getListeningTrends(period),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get genre distribution
 */
export function useGenreDistribution(period?: string) {
    return useQuery({
        queryKey: analyticsKeys.genreDistribution(period),
        queryFn: () => analyticsAPI.getGenreDistribution(period),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Get genre insights
 */
export function useGenreInsights(period?: string) {
    return useQuery({
        queryKey: analyticsKeys.genreInsights(period),
        queryFn: () => analyticsAPI.getGenreInsights(period),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Get artist insights
 */
export function useArtistInsights(params?: { period?: string; limit?: number }) {
    return useQuery({
        queryKey: analyticsKeys.artistInsights(params?.period, params?.limit),
        queryFn: () => analyticsAPI.getArtistInsights(params),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Get listening patterns
 */
export function useListeningPatterns(period?: string) {
    return useQuery({
        queryKey: analyticsKeys.patterns(period),
        queryFn: () => analyticsAPI.getListeningPatterns(period),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Get discovery statistics
 */
export function useDiscoveryStats(period: 'week' | 'month' | 'year' = 'month') {
    return useQuery({
        queryKey: analyticsKeys.discovery(period),
        queryFn: () => analyticsAPI.getDiscoveryStats(period),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Get mood analysis
 */
export function useMoodAnalysis(period: 'week' | 'month' | 'year' = 'month') {
    return useQuery({
        queryKey: analyticsKeys.mood(period),
        queryFn: () => analyticsAPI.getMoodAnalysis(period),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Compare with a friend
 */
export function useCompareWithFriend(friendId: string) {
    return useQuery({
        queryKey: analyticsKeys.compareWithFriend(friendId),
        queryFn: () => analyticsAPI.compareWithFriend(friendId),
        enabled: !!friendId,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}

/**
 * Get all friend comparisons
 */
export function useFriendComparisons() {
    return useQuery({
        queryKey: analyticsKeys.friendComparisons(),
        queryFn: () => analyticsAPI.getFriendComparisons(),
        staleTime: 15 * 60 * 1000,
    });
}

/**
 * Get listening milestones
 */
export function useMilestones() {
    return useQuery({
        queryKey: analyticsKeys.milestones(),
        queryFn: () => analyticsAPI.getMilestones(),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}
