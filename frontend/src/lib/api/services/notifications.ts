import { apiClient } from '../client';
import type {
    Notification,
    NotificationPreferences,
    PushSubscription,
} from '@/types/notification';

/**
 * Notifications API Service
 *
 * Handles all notification-related API calls
 */

export const notificationsAPI = {
    // ==================== Notifications ====================

    /**
     * Get user's notifications
     */
    getNotifications: async (params?: {
        unread_only?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Notification[]> => {
        return apiClient.get<Notification[]>('/api/notifications', { params: params || {} });
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<{ count: number }> => {
        return apiClient.get<{ count: number }>('/api/notifications/unread-count');
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId: string): Promise<void> => {
        return apiClient.patch(`/api/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<void> => {
        return apiClient.post('/api/notifications/mark-all-read');
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (notificationId: string): Promise<void> => {
        return apiClient.delete(`/api/notifications/${notificationId}`);
    },

    /**
     * Clear all read notifications
     */
    clearRead: async (): Promise<void> => {
        return apiClient.delete('/api/notifications/clear-read');
    },

    // ==================== Push Subscriptions ====================

    /**
     * Register push notification subscription
     */
    subscribePush: async (
        subscription: PushSubscriptionJSON
    ): Promise<PushSubscription> => {
        return apiClient.post<PushSubscription>('/api/notifications/subscribe', {
            subscription,
        });
    },

    /**
     * Unsubscribe from push notifications
     */
    unsubscribePush: async (endpoint: string): Promise<void> => {
        return apiClient.post('/api/notifications/unsubscribe', { endpoint });
    },

    /**
     * Get user's push subscriptions
     */
    getPushSubscriptions: async (): Promise<PushSubscription[]> => {
        return apiClient.get<PushSubscription[]>('/api/notifications/subscriptions');
    },

    // ==================== Preferences ====================

    /**
     * Get notification preferences
     */
    getPreferences: async (): Promise<NotificationPreferences> => {
        return apiClient.get<NotificationPreferences>(
            '/api/notifications/preferences'
        );
    },

    /**
     * Update notification preferences
     */
    updatePreferences: async (
        preferences: Partial<NotificationPreferences>
    ): Promise<NotificationPreferences> => {
        return apiClient.patch<NotificationPreferences>(
            '/api/notifications/preferences',
            preferences
        );
    },

    // ==================== Test ====================

    /**
     * Send a test notification (development only)
     */
    sendTestNotification: async (): Promise<void> => {
        return apiClient.post('/api/notifications/test');
    },
};
