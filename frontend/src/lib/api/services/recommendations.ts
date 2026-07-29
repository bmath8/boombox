import { apiClient } from '../client';
import type {
    RecommendationParams,
    RecommendationResponse,
    DailyMix,
    DiscoverWeekly,
    SmartPlaylist,
    SimilarArtist,
    SimilarTrack,
    PersonalizedRecommendations,
    Track,
} from '@/types/recommendations';

/**
 * Recommendations API Service
 *
 * Handles all AI-powered recommendation API calls
 */

export const recommendationsAPI = {
    // ==================== General Recommendations ====================

    /**
     * Get recommendations based on seeds
     */
    getRecommendations: async (
        params: RecommendationParams
    ): Promise<RecommendationResponse> => {
        return apiClient.post<RecommendationResponse>(
            '/api/recommendations',
            params || {},
        );
    },

    /**
     * Get personalized recommendations (all types)
     */
    getPersonalized: async (): Promise<PersonalizedRecommendations> => {
        return apiClient.get<PersonalizedRecommendations>(
            '/api/recommendations/personalized'
        );
    },

    // ==================== Discover Weekly ====================

    /**
     * Get Discover Weekly playlist
     */
    getDiscoverWeekly: async (): Promise<DiscoverWeekly> => {
        return apiClient.get<DiscoverWeekly>('/api/recommendations/discover-weekly');
    },

    /**
     * Refresh Discover Weekly playlist
     */
    refreshDiscoverWeekly: async (): Promise<DiscoverWeekly> => {
        return apiClient.post<DiscoverWeekly>(
            '/api/recommendations/discover-weekly/refresh'
        );
    },

    // ==================== Daily Mixes ====================

    /**
     * Get Daily Mix playlists
     */
    getDailyMixes: async (): Promise<DailyMix[]> => {
        return apiClient.get<DailyMix[]>('/api/recommendations/daily-mixes');
    },

    /**
     * Get specific Daily Mix
     */
    getDailyMix: async (mixId: string): Promise<DailyMix> => {
        return apiClient.get<DailyMix>(`/api/recommendations/daily-mixes/${mixId}`);
    },

    // ==================== Smart Playlists ====================

    /**
     * Create a smart playlist
     */
    createSmartPlaylist: async (
        playlist: Omit<SmartPlaylist, 'id' | 'tracks' | 'created_at' | 'updated_at'>
    ): Promise<SmartPlaylist> => {
        return apiClient.post<SmartPlaylist>(
            '/api/recommendations/smart-playlists',
            playlist
        );
    },

    /**
     * Get user's smart playlists
     */
    getSmartPlaylists: async (): Promise<SmartPlaylist[]> => {
        return apiClient.get<SmartPlaylist[]>(
            '/api/recommendations/smart-playlists'
        );
    },

    /**
     * Get specific smart playlist
     */
    getSmartPlaylist: async (playlistId: string): Promise<SmartPlaylist> => {
        return apiClient.get<SmartPlaylist>(
            `/api/recommendations/smart-playlists/${playlistId}`
        );
    },

    /**
     * Update smart playlist
     */
    updateSmartPlaylist: async (
        playlistId: string,
        updates: Partial<SmartPlaylist>
    ): Promise<SmartPlaylist> => {
        return apiClient.patch<SmartPlaylist>(
            `/api/recommendations/smart-playlists/${playlistId}`,
            updates
        );
    },

    /**
     * Delete smart playlist
     */
    deleteSmartPlaylist: async (playlistId: string): Promise<void> => {
        return apiClient.delete(
            `/api/recommendations/smart-playlists/${playlistId}`
        );
    },

    /**
     * Refresh smart playlist tracks
     */
    refreshSmartPlaylist: async (playlistId: string): Promise<SmartPlaylist> => {
        return apiClient.post<SmartPlaylist>(
            `/api/recommendations/smart-playlists/${playlistId}/refresh`
        );
    },

    // ==================== Similar Content ====================

    /**
     * Get similar artists
     */
    getSimilarArtists: async (artistId: string): Promise<SimilarArtist[]> => {
        return apiClient.get<SimilarArtist[]>(
            `/api/recommendations/artists/${artistId}/similar`
        );
    },

    /**
     * Get similar tracks
     */
    getSimilarTracks: async (trackId: string): Promise<SimilarTrack[]> => {
        return apiClient.get<SimilarTrack[]>(
            `/api/recommendations/tracks/${trackId}/similar`
        );
    },

    /**
     * Get tracks similar to recently played
     */
    getSimilarToRecent: async (limit = 50): Promise<Track[]> => {
        return apiClient.get<Track[]>('/api/recommendations/similar-to-recent', {
            params: { limit },
        });
    },

    // ==================== Mood & Activity ====================

    /**
     * Get recommendations by mood
     */
    getByMood: async (
        mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'focus'
    ): Promise<Track[]> => {
        return apiClient.get<Track[]>('/api/recommendations/by-mood', {
            params: { mood },
        });
    },

    /**
     * Get recommendations by activity
     */
    getByActivity: async (
        activity: 'workout' | 'study' | 'party' | 'sleep' | 'commute'
    ): Promise<Track[]> => {
        return apiClient.get<Track[]>('/api/recommendations/by-activity', {
            params: { activity },
        });
    },

    // ==================== New Releases ====================

    /**
     * Get new releases from favorite artists
     */
    getNewReleases: async (): Promise<Track[]> => {
        return apiClient.get<Track[]>('/api/recommendations/new-releases');
    },

    // ==================== Friend-Based ====================

    /**
     * Get recommendations based on friends' listening
     */
    getFromFriends: async (): Promise<Track[]> => {
        return apiClient.get<Track[]>('/api/recommendations/from-friends');
    },

    /**
     * Get what a specific friend is listening to
     */
    getFromFriend: async (friendId: string): Promise<Track[]> => {
        return apiClient.get<Track[]>(
            `/api/recommendations/from-friend/${friendId}`
        );
    },
};
