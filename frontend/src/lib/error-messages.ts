/**
 * Error Messages Configuration
 *
 * Centralized error messages with user-friendly titles, descriptions, and actions.
 * Each error code maps to a specific user experience.
 */

export type ErrorAction = {
    label: string;
    onClick?: () => void;
    href?: string;
};

export type ErrorConfig = {
    title: string;
    message: string;
    action?: ErrorAction;
    variant?: 'error' | 'warning' | 'info';
};

export const errorMessages: Record<string, ErrorConfig> = {
    // Authentication Errors
    'AUTH_EXPIRED': {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        action: {
            label: 'Log In',
            href: '/login',
        },
        variant: 'warning',
    },
    'AUTH_REQUIRED': {
        title: 'Login Required',
        message: 'You need to be logged in to access this feature.',
        action: {
            label: 'Log In',
            href: '/login',
        },
        variant: 'info',
    },
    'AUTH_INVALID': {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        action: {
            label: 'Try Again',
        },
        variant: 'error',
    },

    // Spotify Errors
    'SPOTIFY_NOT_CONNECTED': {
        title: 'Spotify Not Connected',
        message: 'Please connect your Spotify account to use this feature.',
        action: {
            label: 'Connect Spotify',
            href: '/settings',
        },
        variant: 'info',
    },
    'SPOTIFY_PREMIUM_REQUIRED': {
        title: 'Spotify Premium Required',
        message: 'This feature requires a Spotify Premium subscription.',
        action: {
            label: 'Upgrade',
            href: 'https://www.spotify.com/premium/',
        },
        variant: 'warning',
    },
    'SPOTIFY_PLAYBACK_ERROR': {
        title: 'Playback Error',
        message: 'Unable to play this track. Try skipping to the next song.',
        action: {
            label: 'Skip',
        },
        variant: 'error',
    },

    // Station Errors
    'STATION_FULL': {
        title: 'Station is Full',
        message: 'This station has reached maximum capacity. Try again later or join a different station.',
        action: {
            label: 'Browse Stations',
            href: '/radio',
        },
        variant: 'warning',
    },
    'STATION_OFFLINE': {
        title: 'Station Offline',
        message: 'This station is currently offline. The broadcaster may have ended the session.',
        action: {
            label: 'Find Other Stations',
            href: '/radio',
        },
        variant: 'info',
    },
    'STATION_NOT_FOUND': {
        title: 'Station Not Found',
        message: 'We couldn\'t find this station. It may have been deleted or is no longer available.',
        action: {
            label: 'Browse All Stations',
            href: '/radio',
        },
        variant: 'error',
    },

    // Network Errors
    'NETWORK_ERROR': {
        title: 'Connection Lost',
        message: 'Please check your internet connection and try again.',
        action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
        },
        variant: 'error',
    },
    'NETWORK_SLOW': {
        title: 'Slow Connection',
        message: 'Your internet connection is slow. Audio quality may be affected.',
        variant: 'warning',
    },
    'NETWORK_TIMEOUT': {
        title: 'Request Timeout',
        message: 'The server took too long to respond. Please try again.',
        action: {
            label: 'Retry',
        },
        variant: 'error',
    },

    // Playlist Errors
    'PLAYLIST_NOT_FOUND': {
        title: 'Playlist Not Found',
        message: 'This playlist may have been deleted or is no longer available.',
        action: {
            label: 'Browse Playlists',
            href: '/playlists',
        },
        variant: 'error',
    },
    'PLAYLIST_PERMISSION_DENIED': {
        title: 'Access Denied',
        message: 'You don\'t have permission to edit this playlist.',
        action: {
            label: 'Request Access',
        },
        variant: 'warning',
    },
    'PLAYLIST_TRACK_EXISTS': {
        title: 'Track Already Added',
        message: 'This track is already in the playlist.',
        variant: 'info',
    },

    // Upload Errors
    'UPLOAD_FILE_TOO_LARGE': {
        title: 'File Too Large',
        message: 'The file you\'re trying to upload exceeds the maximum size of 5MB.',
        variant: 'error',
    },
    'UPLOAD_INVALID_FORMAT': {
        title: 'Invalid File Format',
        message: 'This file format is not supported. Please use JPG, PNG, or GIF.',
        variant: 'error',
    },
    'UPLOAD_FAILED': {
        title: 'Upload Failed',
        message: 'Something went wrong while uploading your file. Please try again.',
        action: {
            label: 'Retry',
        },
        variant: 'error',
    },

    // Rate Limiting
    'RATE_LIMIT_EXCEEDED': {
        title: 'Too Many Requests',
        message: 'You\'re doing that too quickly. Please wait a moment and try again.',
        variant: 'warning',
    },

    // Server Errors
    'SERVER_ERROR': {
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified.',
        action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
        },
        variant: 'error',
    },
    'SERVICE_UNAVAILABLE': {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again in a few minutes.',
        action: {
            label: 'Retry',
        },
        variant: 'error',
    },

    // Validation Errors
    'VALIDATION_ERROR': {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        variant: 'error',
    },
    'REQUIRED_FIELD': {
        title: 'Required Field',
        message: 'Please fill in all required fields.',
        variant: 'error',
    },

    // Default/Unknown Error
    'UNKNOWN_ERROR': {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        action: {
            label: 'Try Again',
        },
        variant: 'error',
    },
};

/**
 * Get error configuration for a given error code
 */
export function getErrorConfig(code: string): ErrorConfig {
    return errorMessages[code] || errorMessages['UNKNOWN_ERROR']!;
}

/**
 * Get user-friendly error from any error type
 */
export function parseError(error: unknown): { code: string; config: ErrorConfig } {
    let code = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Check for specific error patterns
        if (message.includes('jwt') || message.includes('session')) {
            code = 'AUTH_EXPIRED';
        } else if (message.includes('network') || message.includes('fetch')) {
            code = 'NETWORK_ERROR';
        } else if (message.includes('timeout')) {
            code = 'NETWORK_TIMEOUT';
        } else if (message.includes('premium')) {
            code = 'SPOTIFY_PREMIUM_REQUIRED';
        } else if (message.includes('not found') || message.includes('404')) {
            code = 'STATION_NOT_FOUND';
        } else if (message.includes('permission') || message.includes('403')) {
            code = 'PLAYLIST_PERMISSION_DENIED';
        } else if (message.includes('500') || message.includes('server')) {
            code = 'SERVER_ERROR';
        } else if (message.includes('rate limit') || message.includes('429')) {
            code = 'RATE_LIMIT_EXCEEDED';
        }
    }

    return {
        code,
        config: getErrorConfig(code),
    };
}
