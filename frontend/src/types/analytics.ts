/**
 * Analytics Types
 *
 * Type definitions for music analytics and insights
 */

export interface ListeningStats {
    user_id: string;
    period: 'day' | 'week' | 'month' | 'year' | 'all_time';

    // Time-based metrics
    total_listening_time: number; // minutes
    total_tracks_played: number;
    unique_tracks: number;
    unique_artists: number;
    unique_albums: number;

    // Averages
    avg_session_length: number; // minutes
    avg_tracks_per_session: number;
    avg_daily_listening: number; // minutes

    // Trends (compared to previous period)
    listening_time_change: number; // percentage
    tracks_played_change: number; // percentage
}

export interface GenreDistribution {
    genre: string;
    play_count: number;
    listening_time: number; // minutes
    percentage: number; // 0-100
}

export interface ListeningPattern {
    hour: number; // 0-23
    day_of_week: number; // 0-6 (Sunday-Saturday)
    play_count: number;
    avg_energy: number; // 0-1
    avg_valence: number; // 0-1 (mood)
}

export interface DiscoveryStats {
    period: 'week' | 'month' | 'year';

    new_artists: number;
    new_tracks: number;
    new_genres: number;

    discovery_rate: number; // percentage of new vs old music
    exploration_score: number; // 0-100

    newly_discovered_artists: Array<{
        artist_id: string;
        artist_name: string;
        discovered_at: string;
        play_count: number;
    }>;
}

export interface MoodAnalysis {
    period: 'week' | 'month' | 'year';

    dominant_mood: MoodType;
    mood_distribution: Array<{
        mood: MoodType;
        percentage: number;
        play_count: number;
    }>;

    // Audio features (averaged)
    avg_energy: number; // 0-1
    avg_valence: number; // 0-1
    avg_danceability: number; // 0-1
    avg_acousticness: number; // 0-1
    avg_tempo: number; // BPM
}

export type MoodType =
    | 'happy'
    | 'sad'
    | 'energetic'
    | 'calm'
    | 'angry'
    | 'romantic'
    | 'focused';

export interface TimeSeriesData {
    date: string; // ISO date
    value: number;
}

export interface ListeningTrend {
    period: 'week' | 'month' | 'year';
    data: TimeSeriesData[];
}

export interface ArtistInsight {
    artist_id: string;
    artist_name: string;
    image_url: string;

    // Stats
    total_plays: number;
    listening_time: number; // minutes
    unique_tracks_played: number;

    // Trends
    plays_last_week: number;
    plays_last_month: number;
    trend: 'rising' | 'falling' | 'stable';

    // First and last played
    first_played: string;
    last_played: string;
}

export interface GenreInsight {
    genre: string;
    play_count: number;
    listening_time: number;
    top_artists: Array<{
        artist_name: string;
        play_count: number;
    }>;
    popularity_trend: 'rising' | 'falling' | 'stable';
}

export interface SocialComparison {
    user_id: string;
    friend_id: string;
    friend_name: string;

    // Compatibility
    music_compatibility_score: number; // 0-100
    shared_artists: number;
    shared_tracks: number;
    shared_genres: number;

    // Differences
    unique_to_user_artists: number;
    unique_to_friend_artists: number;

    // Top shared
    top_shared_artists: Array<{
        artist_name: string;
        user_plays: number;
        friend_plays: number;
    }>;
}

export interface ListeningMilestone {
    type: MilestoneType;
    achieved_at: string;
    value: number;
    description: string;
}

export type MilestoneType =
    | '100_hours'
    | '1000_hours'
    | '10000_tracks'
    | 'year_complete'
    | 'artist_superfan'
    | 'genre_explorer';

export interface AnalyticsSummary {
    user_id: string;
    generated_at: string;

    listening_stats: ListeningStats;
    top_artists: ArtistInsight[];
    top_genres: GenreInsight[];
    genre_distribution: GenreDistribution[];
    listening_patterns: ListeningPattern[];
    discovery_stats: DiscoveryStats;
    mood_analysis: MoodAnalysis;
    recent_milestones: ListeningMilestone[];
}
