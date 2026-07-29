import { apiClient } from '../client';
import type {
    AnalyticsSummary,
    ListeningStats,
    GenreDistribution,
    ListeningPattern,
    DiscoveryStats,
    MoodAnalysis,
    ListeningTrend,
    ArtistInsight,
    GenreInsight,
    SocialComparison,
    ListeningMilestone,
} from '@/types/analytics';

/**
 * Analytics API Service
 *
 * Handles all analytics-related API calls
 */

export const analyticsAPI = {
    // ==================== Overview ====================

    /**
     * Get comprehensive analytics summary
     */
    getSummary: async (params?: {
        period?: 'week' | 'month' | 'year' | 'all_time';
    }): Promise<AnalyticsSummary> => {
        return apiClient.get<AnalyticsSummary>('/api/analytics/summary', {
            params: params || {},
        });
    },

    // ==================== Listening Stats ====================

    /**
     * Get listening statistics
     */
    getListeningStats: async (period?: string): Promise<ListeningStats> => {
        return apiClient.get<ListeningStats>('/api/analytics/listening-stats', {
            params: { period },
        });
    },

    /**
     * Get listening trends over time
     */
    getListeningTrends: async (
        period: 'week' | 'month' | 'year'
    ): Promise<ListeningTrend> => {
        return apiClient.get<ListeningTrend>('/api/analytics/trends', {
            params: { period },
        });
    },

    // ==================== Genre Analytics ====================

    /**
     * Get genre distribution
     */
    getGenreDistribution: async (
        period?: string
    ): Promise<GenreDistribution[]> => {
        return apiClient.get<GenreDistribution[]>(
            '/api/analytics/genre-distribution',
            { params: { period } }
        );
    },

    /**
     * Get genre insights
     */
    getGenreInsights: async (period?: string): Promise<GenreInsight[]> => {
        return apiClient.get<GenreInsight[]>('/api/analytics/genre-insights', {
            params: { period },
        });
    },

    // ==================== Artist Analytics ====================

    /**
     * Get top artists with detailed insights
     */
    getArtistInsights: async (params?: {
        period?: string;
        limit?: number;
    }): Promise<ArtistInsight[]> => {
        return apiClient.get<ArtistInsight[]>('/api/analytics/artist-insights', {
            params: params || {},
        });
    },

    // ==================== Patterns & Behavior ====================

    /**
     * Get listening patterns (by time of day, day of week)
     */
    getListeningPatterns: async (
        period?: string
    ): Promise<ListeningPattern[]> => {
        return apiClient.get<ListeningPattern[]>('/api/analytics/patterns', {
            params: { period },
        });
    },

    /**
     * Get discovery statistics
     */
    getDiscoveryStats: async (
        period: 'week' | 'month' | 'year'
    ): Promise<DiscoveryStats> => {
        return apiClient.get<DiscoveryStats>('/api/analytics/discovery', {
            params: { period },
        });
    },

    /**
     * Get mood analysis
     */
    getMoodAnalysis: async (
        period: 'week' | 'month' | 'year'
    ): Promise<MoodAnalysis> => {
        return apiClient.get<MoodAnalysis>('/api/analytics/mood', {
            params: { period },
        });
    },

    // ==================== Social ====================

    /**
     * Compare music taste with a friend
     */
    compareWithFriend: async (friendId: string): Promise<SocialComparison> => {
        return apiClient.get<SocialComparison>(
            `/api/analytics/compare/${friendId}`
        );
    },

    /**
     * Get friend comparisons for all friends
     */
    getFriendComparisons: async (): Promise<SocialComparison[]> => {
        return apiClient.get<SocialComparison[]>('/api/analytics/friend-comparisons');
    },

    // ==================== Milestones ====================

    /**
     * Get user's listening milestones
     */
    getMilestones: async (): Promise<ListeningMilestone[]> => {
        return apiClient.get<ListeningMilestone[]>('/api/analytics/milestones');
    },

    // ==================== Export ====================

    /**
     * Export analytics data
     */
    exportData: async (format: 'json' | 'csv'): Promise<Blob> => {
        return apiClient.get<Blob>('/api/analytics/export', {
            params: { format },
            responseType: 'blob',
        });
    },
};
