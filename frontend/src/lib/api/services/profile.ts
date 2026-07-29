import { apiClient } from '../client';
import type {
    UserProfile,
    UserActivity,
    FollowRelationship,
    UserStats,
    ListeningHistory,
    ProfileUpdateInput,
    UserBadge,
} from '@/types/profile';

/**
 * Profile API Service
 *
 * Handles all profile-related API calls including:
 * - Profile CRUD operations
 * - Following/followers management
 * - User activity feeds
 * - Listening history
 * - User statistics
 */

export const profileAPI = {
    // ==================== Profile Management ====================

    /**
     * Get user profile by ID
     */
    getProfile: async (userId: string): Promise<UserProfile> => {
        return apiClient.get<UserProfile>(`/api/profiles/${userId}`);
    },

    /**
     * Get current user's profile
     */
    getMyProfile: async (): Promise<UserProfile> => {
        return apiClient.get<UserProfile>('/api/profiles/me');
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (data: ProfileUpdateInput): Promise<UserProfile> => {
        return apiClient.patch<UserProfile>('/api/profiles/me', data);
    },

    /**
     * Upload profile avatar
     */
    uploadAvatar: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('avatar', file);

        return apiClient.post<{ url: string }>('/api/profiles/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /**
     * Upload cover photo
     */
    uploadCover: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('cover', file);

        return apiClient.post<{ url: string }>('/api/profiles/me/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // ==================== Social Features ====================

    /**
     * Follow a user
     */
    followUser: async (userId: string): Promise<FollowRelationship> => {
        return apiClient.post<FollowRelationship>('/api/profiles/follow', { userId });
    },

    /**
     * Unfollow a user
     */
    unfollowUser: async (userId: string): Promise<void> => {
        return apiClient.delete(`/api/profiles/follow/${userId}`);
    },

    /**
     * Get user's followers
     */
    getFollowers: async (userId: string): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>(`/api/profiles/${userId}/followers`);
    },

    /**
     * Get users that a user is following
     */
    getFollowing: async (userId: string): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>(`/api/profiles/${userId}/following`);
    },

    /**
     * Check if current user follows another user
     */
    isFollowing: async (userId: string): Promise<boolean> => {
        const result = await apiClient.get<{ is_following: boolean }>(
            `/api/profiles/${userId}/is-following`
        );
        return result.is_following;
    },

    /**
     * Get mutual followers
     */
    getMutualFollowers: async (userId: string): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>(`/api/profiles/${userId}/mutual`);
    },

    // ==================== Activity Feed ====================

    /**
     * Get user's activity feed
     */
    getActivity: async (userId: string, limit = 20): Promise<UserActivity[]> => {
        return apiClient.get<UserActivity[]>(`/api/profiles/${userId}/activity`, {
            params: { limit },
        });
    },

    /**
     * Get activity feed from followed users
     */
    getFeed: async (limit = 50): Promise<UserActivity[]> => {
        return apiClient.get<UserActivity[]>('/api/profiles/feed', {
            params: { limit },
        });
    },

    // ==================== Listening History ====================

    /**
     * Get user's listening history
     */
    getListeningHistory: async (
        userId: string,
        params?: { limit?: number; offset?: number }
    ): Promise<ListeningHistory[]> => {
        return apiClient.get<ListeningHistory[]>(
            `/api/profiles/${userId}/history`,
            { params: params || {} }
        );
    },

    /**
     * Record a track play
     */
    recordPlay: async (trackData: {
        track_id: string;
        track_name: string;
        artist_name: string;
        album_name: string;
        duration_ms: number;
        completion_percentage: number;
    }): Promise<void> => {
        return apiClient.post('/api/profiles/me/history', trackData);
    },

    // ==================== Statistics ====================

    /**
     * Get user statistics
     */
    getStats: async (userId: string): Promise<UserStats> => {
        return apiClient.get<UserStats>(`/api/profiles/${userId}/stats`);
    },

    /**
     * Get user's badges
     */
    getBadges: async (userId: string): Promise<UserBadge[]> => {
        return apiClient.get<UserBadge[]>(`/api/profiles/${userId}/badges`);
    },

    // ==================== Discovery ====================

    /**
     * Search for users
     */
    searchUsers: async (query: string): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>('/api/profiles/search', {
            params: { q: query },
        });
    },

    /**
     * Get suggested users to follow
     */
    getSuggestions: async (limit = 10): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>('/api/profiles/suggestions', {
            params: { limit },
        });
    },

    /**
     * Get featured/popular users
     */
    getFeaturedUsers: async (limit = 20): Promise<UserProfile[]> => {
        return apiClient.get<UserProfile[]>('/api/profiles/featured', {
            params: { limit },
        });
    },
};
