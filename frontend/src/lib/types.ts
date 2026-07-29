// Centralized Type Definitions
// Source of truth for all data models

// ============================================================================
// SPOTIFY TYPES
// ============================================================================
export interface SpotifyPlayer {
    getCurrentState: () => Promise<SpotifyState | null>;
    seek: (positionMs: number) => Promise<void>;
    connect: () => Promise<boolean>;
    disconnect: () => void;
    addListener: (event: string, callback: (state: unknown) => void) => void;
    removeListener: (event: string, callback: (state: unknown) => void) => void;
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
}


export interface SpotifyState {
    position: number;
    paused: boolean;
    track_window: {
        current_track: {
            id: string;
            name: string;
            uri: string;
            artists: Artist[];
            album: { name: string; images: { url: string }[] };
        };
    };
}

export interface Artist {
    name: string;
    id?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================
export type User = {
    user_id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
    country?: string;
    created_at: string;
    last_active: string;
    is_active: boolean;
    settings?: UserSettings;
};

export type UserSettings = {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    privacy?: 'public' | 'friends' | 'private';
};

// ============================================================================
// RADIO TYPES
// ============================================================================
export type Station = {
    station_id: string;
    station_name: string;
    broadcaster_id: string;
    status: 'live' | 'offline';
    current_track_id?: string;
    current_track_uri?: string;
    listener_count: number;
    peak_listeners: number;
    description?: string;
    theme?: string;
    went_live_at?: string;
};

export type StationMessage = {
    message_id: string;
    station_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
};

export type QueueItem = {
    queue_id: string;
    station_id: string;
    user_id: string;
    track_uri: string;
    track_name: string;
    artist_name: string;
    album_art_url?: string;
    duration_ms: number;
    status: 'pending' | 'playing' | 'played' | 'skipped';
    position: number;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
};

// ============================================================================
// PLAYLIST TYPES
// ============================================================================
export type Playlist = {
    playlist_id: string;
    created_by: string;
    playlist_name: string;
    description?: string;
    cover_image_url?: string;
    theme: 'road_trip' | 'workout' | 'party' | 'chill' | 'custom';
    voting_enabled: boolean;
    auto_sort_by_votes: boolean;
    max_tracks_per_user: number;
    total_tracks: number;
    total_collaborators: number;
    total_plays: number;
    created_at: string;
};

export type PlaylistTrack = {
    track_id: string;
    playlist_id: string;
    spotify_track_id: string;
    track_name: string;
    artist_name: string;
    album_name?: string;
    album_art_url?: string;
    duration_ms: number;
    added_by: string;
    added_at: string;
    vote_count: number;
    play_count: number;
    position: number;
    user_vote?: number | null; // 1, -1, or null
    added_by_user?: {
        display_name: string;
        avatar_url?: string;
    };
};

export type TrackComment = {
    comment_id: string;
    track_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        display_name: string;
        avatar_url?: string;
    };
};

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================
export type Challenge = {
    challenge_id: string;
    challenge_type: 'theme_master' | 'hidden_gem' | 'crowd_pleaser' | 'consistency_king' | 'discovery_champion';
    challenge_name: string;
    challenge_description: string;
    points_reward: number;
    badge_reward?: string;
    is_active: boolean;
};

export type UserChallengeProgress = {
    user_id: string;
    challenge_id: string;
    progress: number;
    target: number;
    completed: boolean;
    completed_at?: string;
    completed_at_timestamp?: number;
};

export type CuratorStats = {
    user_id: string;
    total_playlists_created: number;
    total_tracks_added: number;
    total_upvotes_received: number;
    total_points: number;
    curator_level: number;
    unlocked_badges: string[];
};
