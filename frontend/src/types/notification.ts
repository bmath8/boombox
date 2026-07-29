/**
 * Notification Types
 *
 * Type definitions for push notifications and in-app notifications
 */

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    read: boolean;
    created_at: string;

    // Optional metadata
    action_url?: string;
    image_url?: string;
    icon?: string;
}

export type NotificationType =
    // Social
    | 'new_follower'
    | 'friend_joined_station'
    | 'mention'
    | 'friend_request'
    // Music
    | 'song_request_accepted'
    | 'playlist_shared'
    | 'playlist_collaboration_invite'
    | 'new_release_from_artist'
    // Achievements
    | 'badge_earned'
    | 'milestone_reached'
    // System
    | 'station_broadcast_started'
    | 'station_ending_soon'
    | 'new_message';

export interface NotificationPreferences {
    user_id: string;

    // Push notification settings
    push_enabled: boolean;
    push_new_follower: boolean;
    push_friend_joined_station: boolean;
    push_mention: boolean;
    push_song_request: boolean;
    push_playlist_shared: boolean;
    push_badge_earned: boolean;
    push_station_updates: boolean;

    // Email notification settings
    email_enabled: boolean;
    email_weekly_digest: boolean;
    email_monthly_report: boolean;

    // In-app notification settings
    sound_enabled: boolean;
    desktop_enabled: boolean;

    updated_at: string;
}

export interface PushSubscription {
    id: string;
    user_id: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    user_agent: string;
    created_at: string;
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    requireInteraction?: boolean;
    actions?: NotificationAction[];
    data?: Record<string, any>;
}
