'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing browser notifications
 * 
 * Handles permission requests and sending notifications
 */
export function useSmartNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (e) {
            console.error('Notification permission error:', e);
            return false;
        }
    }, []);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            try {
                // Ensure we interact with service worker if available, or fallback to standard
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, options);
                    });
                } else {
                    new Notification(title, options);
                }
            } catch (e) {
                console.error('Notification send error:', e);
            }
        }
    }, [permission]);

    const notifyNowPlaying = useCallback((trackName: string, artistName: string, albumArt?: string) => {
        if (document.hidden) { // Only notify if app is in background
            sendNotification(`Now Playing: ${trackName}`, {
                body: artistName,
                icon: albumArt || '/icons/icon-192x192.png',
                tag: 'now-playing',
                silent: true, // Don't make noise for track changes usually
            });
        }
    }, [sendNotification]);

    return {
        permission,
        requestPermission,
        sendNotification,
        notifyNowPlaying,
    };
}
