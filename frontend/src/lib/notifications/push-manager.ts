/**
 * Push Notification Manager
 *
 * Handles push notification subscriptions and permissions using Web Push API
 */

import type { PushNotificationPayload } from '@/types/notification';

class PushNotificationManager {
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

    /**
     * Initialize the push notification manager
     */
    async initialize(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported');
            return;
        }

        if (!('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
            console.log('Push notification manager initialized');
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        }
    }

    /**
     * Check if push notifications are supported
     */
    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }

    /**
     * Request notification permission
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            throw new Error('Push notifications not supported');
        }

        const permission = await Notification.requestPermission();
        return permission;
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe(vapidPublicKey: string): Promise<PushSubscription> {
        if (!this.serviceWorkerRegistration) {
            await this.initialize();
        }

        if (!this.serviceWorkerRegistration) {
            throw new Error('Service worker not registered');
        }

        const permission = await this.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        try {
            const subscription =
                await this.serviceWorkerRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
                });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            return;
        }

        try {
            const subscription =
                await this.serviceWorkerRegistration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('Unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
            throw error;
        }
    }

    /**
     * Get current push subscription
     */
    async getSubscription(): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration) {
            await this.initialize();
        }

        if (!this.serviceWorkerRegistration) {
            return null;
        }

        try {
            return await this.serviceWorkerRegistration.pushManager.getSubscription();
        } catch (error) {
            console.error('Failed to get push subscription:', error);
            return null;
        }
    }

    /**
     * Show a local notification (for testing)
     */
    async showNotification(
        payload: PushNotificationPayload
    ): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            throw new Error('Service worker not registered');
        }

        const permission = this.getPermissionStatus();
        if (permission !== 'granted') {
            throw new Error('Notification permission not granted');
        }

        await this.serviceWorkerRegistration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icon-192x192.png',
            badge: payload.badge || '/badge-72x72.png',
            ...(payload.tag ? { tag: payload.tag } : {}),
            requireInteraction: payload.requireInteraction || false,
            ...(payload.data ? { data: payload.data } : {}),
        });
    }

    /**
     * Convert VAPID key to Uint8Array
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray as Uint8Array<ArrayBuffer>;
    }
}

// Export singleton instance
export const pushManager = new PushNotificationManager();
