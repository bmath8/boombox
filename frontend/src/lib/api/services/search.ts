import { apiClient } from '../client';

/**
 * Search API Service
 *
 * Handles all search-related API calls.
 */

export interface SearchResults {
    tracks: any[];
    users: any[];
    stations: any[];
    playlists: any[];
}

export const searchAPI = {
    /**
     * Global search across all types
     */
    search: async (query: string, type?: string): Promise<SearchResults> => {
        return apiClient.get<SearchResults>('/api/search', {
            params: { q: query, type },
        });
    },

    /**
     * Search only stations
     */
    searchStations: async (query: string) => {
        return apiClient.get<SearchResults>('/api/search', {
            params: { q: query, type: 'stations' },
        });
    },

    /**
     * Search only users
     */
    searchUsers: async (query: string) => {
        return apiClient.get<SearchResults>('/api/search', {
            params: { q: query, type: 'users' },
        });
    },

    /**
     * Search only playlists
     */
    searchPlaylists: async (query: string) => {
        return apiClient.get<SearchResults>('/api/search', {
            params: { q: query, type: 'playlists' },
        });
    },

    /**
     * Search only tracks
     */
    searchTracks: async (query: string) => {
        return apiClient.get<SearchResults>('/api/search', {
            params: { q: query, type: 'tracks' },
        });
    },
};
