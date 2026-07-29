/**
 * Recommendations Types
 *
 * Type definitions for AI-powered music recommendations
 */

export interface Track {
    id: string;
    name: string;
    artist: string;
    album: string;
    duration_ms: number;
    image_url: string;
    preview_url?: string;
    spotify_uri: string;
}

export interface RecommendationSeed {
    type: 'artist' | 'track' | 'genre';
    id: string;
    name: string;
}

export interface RecommendationParams {
    seed_artists?: string[];
    seed_tracks?: string[];
    seed_genres?: string[];
    limit?: number;

    // Audio features constraints
    target_energy?: number; // 0-1
    target_valence?: number; // 0-1 (happiness)
    target_danceability?: number; // 0-1
    target_acousticness?: number; // 0-1
    target_tempo?: number; // BPM
    min_popularity?: number; // 0-100
    max_popularity?: number; // 0-100
}

export interface RecommendationResponse {
    tracks: Track[];
    seeds: RecommendationSeed[];
}

export interface DailyMix {
    id: string;
    name: string;
    description: string;
    tracks: Track[];
    image_url: string;
    created_at: string;
}

export interface DiscoverWeekly {
    id: string;
    tracks: Track[];
    week_start: string;
    generated_at: string;
}

export interface SmartPlaylist {
    id: string;
    name: string;
    description: string;
    type: SmartPlaylistType;
    rules: PlaylistRule[];
    tracks: Track[];
    auto_update: boolean;
    created_at: string;
    updated_at: string;
}

export type SmartPlaylistType =
    | 'mood_based'
    | 'activity_based'
    | 'discovery'
    | 'time_based'
    | 'collaborative';

export interface PlaylistRule {
    type: RuleType;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
    value: any;
}

export type RuleType =
    | 'genre'
    | 'artist'
    | 'energy'
    | 'valence'
    | 'tempo'
    | 'release_date'
    | 'popularity'
    | 'duration';

export interface SimilarArtist {
    id: string;
    name: string;
    image_url: string;
    genres: string[];
    popularity: number;
    similarity_score: number; // 0-1
}

export interface SimilarTrack {
    track: Track;
    similarity_score: number; // 0-1
    reason: string;
}

export interface PersonalizedRecommendations {
    discover_weekly?: DiscoverWeekly;
    daily_mixes: DailyMix[];
    similar_to_recent: Track[];
    new_releases_for_you: Track[];
    recommended_artists: SimilarArtist[];
    mood_playlists: SmartPlaylist[];
}
