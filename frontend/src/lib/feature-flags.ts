/**
 * Feature Flags System
 *
 * Allows toggling features on/off without deploying code.
 * Supports:
 * - Environment-based flags
 * - User-based flags
 * - A/B testing
 * - Gradual rollouts
 *
 * Usage:
 * import { features } from '@/lib/feature-flags';
 *
 * if (features.newPlayer.enabled) {
 *   return <NewPlayer />;
 * }
 */

export type FeatureFlag = {
    key: string;
    enabled: boolean;
    description: string;
    rolloutPercentage?: number; // 0-100
    enabledFor?: string[]; // User IDs
};

/**
 * Feature flag configuration
 */
const featureFlags: Record<string, FeatureFlag> = {
    // Player Features
    newPlayer: {
        key: 'new-player',
        enabled: true,
        description: 'New redesigned music player',
        rolloutPercentage: 100, // 100% of users
    },

    enhancedVisualizer: {
        key: 'enhanced-visualizer',
        enabled: true,
        description: 'Enhanced audio visualizer',
    },

    // AI Features
    aiRecommendations: {
        key: 'ai-recommendations',
        enabled: true,
        description: 'AI-powered music recommendations',
        rolloutPercentage: 100,
    },

    smartPlaylists: {
        key: 'smart-playlists',
        enabled: true,
        description: 'Auto-generated smart playlists',
    },

    // Social Features
    voiceChat: {
        key: 'voice-chat',
        enabled: true,
        description: 'Voice chat in stations',
    },

    liveReactions: {
        key: 'live-reactions',
        enabled: true,
        description: 'Real-time reactions to tracks',
    },

    // Experimental
    virtualEvents: {
        key: 'virtual-events',
        enabled: true,
        description: 'Virtual listening parties',
        enabledFor: [], // Specific beta testers
    },

    offlineMode: {
        key: 'offline-mode',
        enabled: true,
        description: 'Full offline playback support',
    },

    // UI Features
    darkMode: {
        key: 'dark-mode',
        enabled: true,
        description: 'Dark mode theme',
    },

    compactView: {
        key: 'compact-view',
        enabled: true,
        description: 'Compact UI layout',
    },
};

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(
    flagKey: string,
    userId?: string
): boolean {
    const flag = featureFlags[flagKey];

    if (!flag) {
        console.warn(`Feature flag "${flagKey}" not found`);
        return false;
    }

    // Check if explicitly disabled
    if (!flag.enabled) {
        return false;
    }

    // Check user-specific flags
    if (flag.enabledFor && userId) {
        return flag.enabledFor.includes(userId);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
        if (!userId) return false;

        // Consistent hash-based rollout
        const hash = hashString(userId);
        const userPercentage = hash % 100;

        return userPercentage < flag.rolloutPercentage;
    }

    return true;
}

/**
 * Simple string hash function for consistent user bucketing
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Hook for using feature flags in components
 */
export function useFeatureFlag(flagKey: string, userId?: string): boolean {
    return isFeatureEnabled(flagKey, userId);
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<string, FeatureFlag> {
    return { ...featureFlags };
}

/**
 * Update feature flag (for admin panel)
 */
export function updateFeatureFlag(
    flagKey: string,
    updates: Partial<FeatureFlag>
): void {
    if (featureFlags[flagKey]) {
        featureFlags[flagKey] = {
            ...featureFlags[flagKey],
            ...updates,
        };
    }
}

/**
 * Convenience object for easy access
 */
export const features = new Proxy({} as Record<string, { enabled: boolean }>, {
    get: (target, prop: string) => ({
        enabled: isFeatureEnabled(prop),
        check: (userId?: string) => isFeatureEnabled(prop, userId),
    }),
});

/**
 * Environment-based feature flags
 * These override the default flags
 */
if (typeof window !== 'undefined') {
    // Check for environment variable overrides
    const envFlags = process.env['NEXT_PUBLIC_FEATURE_FLAGS'];

    if (envFlags) {
        try {
            const parsedFlags = JSON.parse(envFlags);
            Object.entries(parsedFlags).forEach(([key, value]) => {
                if (featureFlags[key] && typeof value === 'boolean') {
                    featureFlags[key].enabled = value;
                }
            });
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_FEATURE_FLAGS');
        }
    }

    // Development mode: expose to window for debugging
    if (process.env.NODE_ENV === 'development') {
        (window as any).__FEATURE_FLAGS__ = {
            list: getAllFeatureFlags,
            enable: (key: string) => updateFeatureFlag(key, { enabled: true }),
            disable: (key: string) => updateFeatureFlag(key, { enabled: false }),
            check: isFeatureEnabled,
        };

        console.log(
            '%c🚩 Feature Flags',
            'font-weight: bold; color: #FF6B6B',
            '\nAccess via window.__FEATURE_FLAGS__'
        );
    }
}
