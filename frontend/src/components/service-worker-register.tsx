'use client';

import { useEffect } from 'react';
import { showSuccessToast } from '@/lib/toast-utils';

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for PWA functionality.
 * Shows toast notifications for install and update events.
 */
export function ServiceWorkerRegister() {
    useEffect(() => {
        // EMERGENCY FIX: FORCE UNREGISTER ALL SERVICE WORKERS
        // The user reported "page doesn't load without hard refresh", which implies a stuck SW.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                if (registrations.length > 0) {
                    console.log('[SW] Found existing registrations. Unregistering all to clear cache...');
                    for (let registration of registrations) {
                        registration.unregister();
                        console.log('[SW] Unregistered:', registration);
                    }
                    // Force reload to ensure clean slate
                    window.location.reload();
                } else {
                    console.log('[SW] No active service workers found. Clean slate.');
                }
            });
        }
    }, []);

    // Listen for install prompt
    useEffect(() => {
        let deferredPrompt: any = null;

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;

            // Show install prompt after a delay
            setTimeout(() => {
                if (deferredPrompt) {
                    showSuccessToast('Install BOOMBOX', {
                        description: 'Add to home screen for quick access',
                        action: {
                            label: 'Install',
                            onClick: async () => {
                                if (deferredPrompt) {
                                    deferredPrompt.prompt();
                                    const { outcome } = await deferredPrompt.userChoice;
                                    console.log(`[PWA] User response: ${outcome}`);
                                    deferredPrompt = null;
                                }
                            },
                        },
                        duration: 15000,
                    });
                }
            }, 5000); // Show after 5 seconds
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed');
            showSuccessToast('App installed!', {
                description: 'BOOMBOX has been added to your home screen',
            });
            deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    return null;
}
