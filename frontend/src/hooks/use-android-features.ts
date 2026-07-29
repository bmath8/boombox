'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Platform detection utilities for Android-specific features
 */

export type AndroidVersion = number | null;

/**
 * Detect if the current device is Android
 */
export function isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
}

/**
 * Get Android version number
 */
export function getAndroidVersion(): AndroidVersion {
    if (!isAndroid()) return null;

    const match = navigator.userAgent.match(/Android\s([0-9.]+)/);
    const version = match?.[1];
    return version ? parseFloat(version) : null;
}

/**
 * Check if device supports Android-style back button
 */
export function supportsAndroidBackButton(): boolean {
    return isAndroid() && 'onbackbutton' in window;
}

/**
 * Hook for Android-specific features
 * 
 * Provides utilities for:
 * - Platform detection
 * - Android back button handling
 * - Share target support
 * - Notification channel management
 * 
 * @returns Object with Android feature utilities
 */
export function useAndroidFeatures() {
    const [androidVersion, setAndroidVersion] = useState<AndroidVersion>(null);
    const [isAndroidDevice, setIsAndroidDevice] = useState(false);

    useEffect(() => {
        setIsAndroidDevice(isAndroid());
        setAndroidVersion(getAndroidVersion());
    }, []);

    return {
        isAndroid: isAndroidDevice,
        androidVersion,
        supportsBackButton: supportsAndroidBackButton(),
    };
}

/**
 * Hook for handling Android back button
 * 
 * @param handler - Callback when back button is pressed
 * @param enabled - Whether the handler is active
 * 
 * @example
 * ```tsx
 * useAndroidBackButton(() => {
 *   // Handle back button
 *   closeModal();
 * }, isModalOpen);
 * ```
 */
export function useAndroidBackButton(
    handler: () => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled || !supportsAndroidBackButton()) {
            return;
        }

        const handleBackButton = (e: Event) => {
            e.preventDefault();
            handler();
        };

        // @ts-ignore - Android-specific event
        window.addEventListener('backbutton', handleBackButton);

        return () => {
            // @ts-ignore
            window.removeEventListener('backbutton', handleBackButton);
        };
    }, [handler, enabled]);
}

/**
 * Request Android notification permission
 * 
 * On Android 13+, requires explicit permission request
 */
export async function requestAndroidNotificationPermission(): Promise<NotificationPermission> {
    if (!isAndroid()) {
        return 'default';
    }

    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    // Request permission
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('[Android] Notification permission request failed:', error);
        return 'denied';
    }
}

/**
 * Check if app can handle shared content (Android Share Target API)
 */
export function canHandleSharedContent(): boolean {
    if (!isAndroid()) return false;

    // Check if launched via share target
    const params = new URLSearchParams(window.location.search);
    return params.has('share-target');
}

/**
 * Extract shared content from URL params (Android Share Target)
 * 
 * @returns Shared content object or null
 */
export function getSharedContent(): { title?: string; text?: string; url?: string } | null {
    if (!canHandleSharedContent()) return null;

    const params = new URLSearchParams(window.location.search);

    const title = params.get('title');
    const text = params.get('text');
    const url = params.get('url');

    return {
        ...(title && { title }),
        ...(text && { text }),
        ...(url && { url }),
    };
}

/**
 * Hook for handling Android shared content
 * 
 * @param onShare - Callback when content is shared to the app
 * 
 * @example
 * ```tsx
 * useAndroidShareTarget((content) => {
 *   if (content.url) {
 *     // Handle shared URL
 *     importSpotifyPlaylist(content.url);
 *   }
 * });
 * ```
 */
export function useAndroidShareTarget(
    onShare: (content: { title?: string; text?: string; url?: string }) => void
) {
    useEffect(() => {
        const shared = getSharedContent();
        if (shared) {
            onShare(shared);

            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('share-target');
            url.searchParams.delete('title');
            url.searchParams.delete('text');
            url.searchParams.delete('url');
            window.history.replaceState({}, '', url.toString());
        }
    }, [onShare]);
}

/**
 * Add ripple effect for Android-style button feedback
 * 
 * @param element - Button element
 * @param color - Ripple color (default: rgba(255,255,255,0.3))
 */
export function addAndroidRipple(
    element: HTMLElement,
    color: string = 'rgba(255,255,255,0.3)'
): void {
    if (!isAndroid()) return;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';

    const handleClick = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.width = ripple.style.height = '100px';
        ripple.style.left = `${x - 50}px`;
        ripple.style.top = `${y - 50}px`;
        ripple.style.background = color;
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'scale(0)';
        ripple.style.opacity = '1';
        ripple.style.pointerEvents = 'none';
        ripple.style.transition = 'transform 0.6s, opacity 0.6s';

        element.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
        });

        setTimeout(() => {
            ripple.remove();
        }, 600);
    };

    element.addEventListener('click', handleClick);
}

/**
 * Hook for Android ripple effect on ref
 * 
 * @param color - Ripple color
 * @returns Ref to attach to element
 * 
 * @example
 * ```tsx
 * const rippleRef = useAndroidRipple();
 * <button ref={rippleRef}>Click me</button>
 * ```
 */
export function useAndroidRipple(color?: string) {
    const ref = useCallback((element: HTMLElement | null) => {
        if (element) {
            addAndroidRipple(element, color);
        }
    }, [color]);

    return ref;
}
