/**
 * User Profile & Social Types
 *
 * Comprehensive type definitions for user profiles and social features
 */

export interface UserProfile {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    favorite_genres: string[];

    // Stats
    total_listening_time: number; // in minutes
    stations_created: number;
    playlists_created: number;
    followers_count: number;
    following_count: number;

    // Badges
    badges: UserBadge[];

    // Privacy
    is_public: boolean;
    show_listening_history: boolean;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface UserBadge {
    id: string;
    type: BadgeType;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
}

export type BadgeType =
    | 'early_adopter'
    | 'broadcaster'
    | 'social_butterfly'
    | 'playlist_master'
    | 'music_explorer'
    | 'night_owl'
    | 'weekend_warrior'
    | 'genre_specialist'
    | '100_hours'
    | '1000_hours';

export interface FollowRelationship {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;

    // Populated data
    follower?: UserProfile;
    following?: UserProfile;
}

export interface UserActivity {
    id: string;
    user_id: string;
    type: ActivityType;
    data: Record<string, any>;
    created_at: string;

    // Populated
    user?: UserProfile;
}

export type ActivityType =
    | 'created_station'
    | 'joined_station'
    | 'created_playlist'
    | 'followed_user'
    | 'liked_track'
    | 'shared_playlist'
    | 'earned_badge';

export interface ListeningHistory {
    id: string;
    user_id: string;
    track_id: string;
    track_name: string;
    artist_name: string;
    album_name: string;
    duration_ms: number;
    played_at: string;

    // Stats
    completion_percentage: number; // 0-100
}

export interface TopArtist {
    rank: number;
    artist_id: string;
    artist_name: string;
    image_url: string;
    play_count: number;
    listening_time: number; // minutes
}

export interface TopTrack {
    rank: number;
    track_id: string;
    track_name: string;
    artist_name: string;
    album_name: string;
    image_url: string;
    play_count: number;
}

export interface UserStats {
    user_id: string;

    // Time-based stats
    listening_time_today: number;
    listening_time_week: number;
    listening_time_month: number;
    listening_time_all_time: number;

    // Top content
    top_artists_month: TopArtist[];
    top_artists_all_time: TopArtist[];
    top_tracks_month: TopTrack[];
    top_tracks_all_time: TopTrack[];

    // Activity
    stations_created: number;
    stations_joined: number;
    playlists_created: number;
    tracks_played: number;

    // Social
    followers_count: number;
    following_count: number;
}

export interface ProfileUpdateInput {
    display_name?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
    cover_url?: string;
    favorite_genres?: string[];
    is_public?: boolean;
    show_listening_history?: boolean;
}
