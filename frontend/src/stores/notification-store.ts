import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Notification, NotificationPreferences } from '@/types/notification';

/**
 * Notification Store
 *
 * Manages notification state including:
 * - In-app notifications
 * - Unread count
 * - Notification preferences
 * - Push subscription status
 */

interface NotificationState {
    // Notifications
    notifications: Notification[];
    unreadCount: number;

    // Preferences
    preferences: NotificationPreferences | null;

    // Push subscription
    isPushSubscribed: boolean;
    pushSubscription: PushSubscription | null;

    // UI state
    notificationPanelOpen: boolean;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    setUnreadCount: (count: number) => void;
    incrementUnreadCount: () => void;
    decrementUnreadCount: () => void;

    setPreferences: (preferences: NotificationPreferences) => void;
    updatePreference: (key: keyof NotificationPreferences, value: any) => void;

    setPushSubscribed: (subscribed: boolean) => void;
    setPushSubscription: (subscription: PushSubscription | null) => void;

    openNotificationPanel: () => void;
    closeNotificationPanel: () => void;
    toggleNotificationPanel: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                notifications: [],
                unreadCount: 0,
                preferences: null,
                isPushSubscribed: false,
                pushSubscription: null,
                notificationPanelOpen: false,

                // Notification actions
                setNotifications: (notifications) => set({ notifications }),

                addNotification: (notification) =>
                    set((state) => ({
                        notifications: [notification, ...state.notifications],
                        unreadCount: notification.read
                            ? state.unreadCount
                            : state.unreadCount + 1,
                    })),

                removeNotification: (id) =>
                    set((state) => ({
                        notifications: state.notifications.filter((n) => n.id !== id),
                    })),

                markAsRead: (id) =>
                    set((state) => {
                        const notification = state.notifications.find((n) => n.id === id);
                        if (!notification || notification.read) {
                            return state;
                        }

                        return {
                            notifications: state.notifications.map((n) =>
                                n.id === id ? { ...n, read: true } : n
                            ),
                            unreadCount: Math.max(0, state.unreadCount - 1),
                        };
                    }),

                markAllAsRead: () =>
                    set((state) => ({
                        notifications: state.notifications.map((n) => ({
                            ...n,
                            read: true,
                        })),
                        unreadCount: 0,
                    })),

                setUnreadCount: (count) => set({ unreadCount: count }),

                incrementUnreadCount: () =>
                    set((state) => ({ unreadCount: state.unreadCount + 1 })),

                decrementUnreadCount: () =>
                    set((state) => ({
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    })),

                // Preferences actions
                setPreferences: (preferences) => set({ preferences }),

                updatePreference: (key, value) =>
                    set((state) => ({
                        preferences: state.preferences
                            ? { ...state.preferences, [key]: value }
                            : null,
                    })),

                // Push subscription actions
                setPushSubscribed: (subscribed) => set({ isPushSubscribed: subscribed }),

                setPushSubscription: (subscription) =>
                    set({ pushSubscription: subscription }),

                // UI actions
                openNotificationPanel: () => set({ notificationPanelOpen: true }),
                closeNotificationPanel: () => set({ notificationPanelOpen: false }),
                toggleNotificationPanel: () =>
                    set((state) => ({
                        notificationPanelOpen: !state.notificationPanelOpen,
                    })),
            }),
            {
                name: 'notification-storage',
                partialize: (state) => ({
                    preferences: state.preferences,
                    isPushSubscribed: state.isPushSubscribed,
                }),
            }
        ),
        { name: 'NotificationStore' }
    )
);

// Optimized selectors
export const useNotifications = () =>
    useNotificationStore((state) => state.notifications);
export const useUnreadCount = () =>
    useNotificationStore((state) => state.unreadCount);
export const useNotificationPreferences = () =>
    useNotificationStore((state) => state.preferences);
export const useIsPushSubscribed = () =>
    useNotificationStore((state) => state.isPushSubscribed);
export const useNotificationPanelOpen = () =>
    useNotificationStore((state) => state.notificationPanelOpen);
