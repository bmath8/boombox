'use client';

/**
 * Track metadata for Media Session API
 */
export interface TrackMetadata {
    title: string;
    artist: string;
    album: string;
    artwork?: Array<{
        src: string;
        sizes: string;
        type: string;
    }>;
}

/**
 * Media session action handlers
 */
export interface MediaSessionHandlers {
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onSeekBackward?: () => void;
    onSeekForward?: () => void;
    onSeekTo?: (time: number) => void;
    onStop?: () => void;
}

/**
 * Check if Media Session API is supported
 */
export function isMediaSessionSupported(): boolean {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

/**
 * Update media session metadata
 * This shows track info on lock screen, notification shade, and media controls
 * 
 * @param metadata - Track metadata to display
 * 
 * @example
 * ```ts
 * updateMediaSessionMetadata({
 *   title: 'Song Name',
 *   artist: 'Artist Name',
 *   album: 'Album Name',
 *   artwork: [
 *     { src: 'cover-96.png', sizes: '96x96', type: 'image/png' },
 *     { src: 'cover-256.png', sizes: '256x256', type: 'image/png' },
 *     { src: 'cover-512.png', sizes: '512x512', type: 'image/png' },
 *   ]
 * });
 * ```
 */
export function updateMediaSessionMetadata(metadata: TrackMetadata): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            artwork: metadata.artwork || [
                // Default artwork if none provided
                { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
                { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            ],
        });

        console.debug('[MediaSession] Metadata updated:', metadata.title);
    } catch (error) {
        console.error('[MediaSession] Failed to update metadata:', error);
    }
}

/**
 * Register media session action handlers
 * These handlers respond to hardware media keys and lock screen controls
 * 
 * @param handlers - Object containing action handlers
 * 
 * @example
 * ```ts
 * registerMediaSessionHandlers({
 *   onPlay: () => player.play(),
 *   onPause: () => player.pause(),
 *   onNext: () => player.next(),
 *   onPrevious: () => player.previous(),
 * });
 * ```
 */
export function registerMediaSessionHandlers(handlers: MediaSessionHandlers): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        // Play action
        if (handlers.onPlay) {
            navigator.mediaSession.setActionHandler('play', handlers.onPlay);
        }

        // Pause action
        if (handlers.onPause) {
            navigator.mediaSession.setActionHandler('pause', handlers.onPause);
        }

        // Next track
        if (handlers.onNext) {
            navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
        }

        // Previous track
        if (handlers.onPrevious) {
            navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
        }

        // Seek backward (10s)
        if (handlers.onSeekBackward) {
            navigator.mediaSession.setActionHandler('seekbackward', handlers.onSeekBackward);
        }

        // Seek forward (10s)
        if (handlers.onSeekForward) {
            navigator.mediaSession.setActionHandler('seekforward', handlers.onSeekForward);
        }

        // Seek to specific time
        if (handlers.onSeekTo) {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && handlers.onSeekTo) {
                    handlers.onSeekTo(details.seekTime);
                }
            });
        }

        // Stop action
        if (handlers.onStop) {
            navigator.mediaSession.setActionHandler('stop', handlers.onStop);
        }

        console.debug('[MediaSession] Action handlers registered');
    } catch (error) {
        console.error('[MediaSession] Failed to register handlers:', error);
    }
}

/**
 * Update media session playback state
 * 
 * @param state - Playback state: 'none' | 'paused' | 'playing'
 * 
 * @example
 * ```ts
 * updateMediaSessionPlaybackState('playing');
 * ```
 */
export function updateMediaSessionPlaybackState(
    state: 'none' | 'paused' | 'playing'
): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        navigator.mediaSession.playbackState = state;
        console.debug('[MediaSession] Playback state updated:', state);
    } catch (error) {
        console.error('[MediaSession] Failed to update playback state:', error);
    }
}

/**
 * Update media session position state (for seekbar in lock screen)
 * 
 * @param position - Current position in seconds
 * @param duration - Total duration in seconds
 * @param playbackRate - Playback rate (default: 1.0)
 * 
 * @example
 * ```ts
 * updateMediaSessionPositionState(45, 180, 1.0);
 * ```
 */
export function updateMediaSessionPositionState(
    position: number,
    duration: number,
    playbackRate: number = 1.0
): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        navigator.mediaSession.setPositionState({
            duration,
            playbackRate,
            position,
        });
    } catch (error) {
        // Position state might not be supported on all devices
        console.debug('[MediaSession] Position state not supported:', error);
    }
}

/**
 * Clear media session (remove from lock screen/notification)
 * 
 * @example
 * ```ts
 * clearMediaSession();
 * ```
 */
export function clearMediaSession(): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        console.debug('[MediaSession] Cleared');
    } catch (error) {
        console.error('[MediaSession] Failed to clear:', error);
    }
}

/**
 * Unregister all media session action handlers
 * 
 * @example
 * ```ts
 * unregisterMediaSessionHandlers();
 * ```
 */
export function unregisterMediaSessionHandlers(): void {
    if (!isMediaSessionSupported()) {
        return;
    }

    try {
        const actions: MediaSessionAction[] = [
            'play',
            'pause',
            'nexttrack',
            'previoustrack',
            'seekbackward',
            'seekforward',
            'seekto',
            'stop',
        ];

        actions.forEach(action => {
            try {
                navigator.mediaSession.setActionHandler(action, null);
            } catch (e) {
                // Some actions might not be supported
            }
        });

        console.debug('[MediaSession] Handlers unregistered');
    } catch (error) {
        console.error('[MediaSession] Failed to unregister handlers:', error);
    }
}
