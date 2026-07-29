import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationsAPI } from '@/lib/api/services/notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { pushManager } from '@/lib/notifications/push-manager';
import { toast } from 'sonner';

/**
 * React Query Hooks for Notifications
 */

// ==================== Query Keys ====================

export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
        [...notificationKeys.lists(), filters] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
    preferences: () => [...notificationKeys.all, 'preferences'] as const,
    subscriptions: () => [...notificationKeys.all, 'subscriptions'] as const,
};

// ==================== Notification Queries ====================

/**
 * Get user's notifications
 */
export function useNotificationsQuery(params?: {
    unread_only?: boolean;
    limit?: number;
}) {
    const setNotifications = useNotificationStore((state) => state.setNotifications);

    const query = useQuery({
        queryKey: notificationKeys.list(params || {}),
        queryFn: () => notificationsAPI.getNotifications(params),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });

    useEffect(() => {
        if (query.data) {
            setNotifications(query.data);
        }
    }, [query.data, setNotifications]);

    return query;
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
    const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

    const query = useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: () => notificationsAPI.getUnreadCount(),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });

    useEffect(() => {
        if (query.data) {
            setUnreadCount(query.data.count);
        }
    }, [query.data, setUnreadCount]);

    return query;
}

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();
    const markAsRead = useNotificationStore((state) => state.markAsRead);

    return useMutation({
        mutationFn: (notificationId: string) =>
            notificationsAPI.markAsRead(notificationId),
        onMutate: async (notificationId) => {
            // Optimistic update
            markAsRead(notificationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
        onError: () => {
            toast.error('Failed to mark notification as read');
        },
    });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

    return useMutation({
        mutationFn: () => notificationsAPI.markAllAsRead(),
        onMutate: async () => {
            markAllAsRead();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            toast.success('All notifications marked as read');
        },
        onError: () => {
            toast.error('Failed to mark all as read');
        },
    });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient();
    const removeNotification = useNotificationStore(
        (state) => state.removeNotification
    );

    return useMutation({
        mutationFn: (notificationId: string) =>
            notificationsAPI.deleteNotification(notificationId),
        onMutate: async (notificationId) => {
            removeNotification(notificationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
        onError: () => {
            toast.error('Failed to delete notification');
        },
    });
}

// ==================== Push Subscription ====================

/**
 * Subscribe to push notifications
 */
export function useSubscribePush() {
    const queryClient = useQueryClient();
    const setPushSubscribed = useNotificationStore(
        (state) => state.setPushSubscribed
    );
    const setPushSubscription = useNotificationStore(
        (state) => state.setPushSubscription
    );

    return useMutation({
        mutationFn: async (vapidPublicKey: string) => {
            const subscription = await pushManager.subscribe(vapidPublicKey);
            const subscriptionJSON = subscription.toJSON();
            await notificationsAPI.subscribePush(subscriptionJSON);
            return subscription;
        },
        onSuccess: (subscription) => {
            setPushSubscribed(true);
            setPushSubscription(subscription);
            queryClient.invalidateQueries({ queryKey: notificationKeys.subscriptions() });
            toast.success('Push notifications enabled!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to enable push notifications');
        },
    });
}

/**
 * Unsubscribe from push notifications
 */
export function useUnsubscribePush() {
    const queryClient = useQueryClient();
    const setPushSubscribed = useNotificationStore(
        (state) => state.setPushSubscribed
    );
    const setPushSubscription = useNotificationStore(
        (state) => state.setPushSubscription
    );

    return useMutation({
        mutationFn: async () => {
            const subscription = await pushManager.getSubscription();
            if (subscription) {
                await notificationsAPI.unsubscribePush(subscription.endpoint);
                await pushManager.unsubscribe();
            }
        },
        onSuccess: () => {
            setPushSubscribed(false);
            setPushSubscription(null);
            queryClient.invalidateQueries({ queryKey: notificationKeys.subscriptions() });
            toast.success('Push notifications disabled');
        },
        onError: () => {
            toast.error('Failed to disable push notifications');
        },
    });
}

// ==================== Preferences ====================

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
    const setPreferences = useNotificationStore((state) => state.setPreferences);

    const query = useQuery({
        queryKey: notificationKeys.preferences(),
        queryFn: () => notificationsAPI.getPreferences(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    useEffect(() => {
        if (query.data) {
            setPreferences(query.data);
        }
    }, [query.data, setPreferences]);

    return query;
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
    const queryClient = useQueryClient();
    const setPreferences = useNotificationStore((state) => state.setPreferences);

    return useMutation({
        mutationFn: (preferences: Parameters<typeof notificationsAPI.updatePreferences>[0]) =>
            notificationsAPI.updatePreferences(preferences),
        onSuccess: (data) => {
            setPreferences(data);
            queryClient.setQueryData(notificationKeys.preferences(), data);
            toast.success('Notification preferences updated');
        },
        onError: () => {
            toast.error('Failed to update preferences');
        },
    });
}

// ==================== Test ====================

/**
 * Send test notification
 */
export function useSendTestNotification() {
    return useMutation({
        mutationFn: () => notificationsAPI.sendTestNotification(),
        onSuccess: () => {
            toast.success('Test notification sent!');
        },
        onError: () => {
            toast.error('Failed to send test notification');
        },
    });
}
