/**
 * API Index
 *
 * Central export for all API services.
 *
 * Usage:
 * import { api } from '@/lib/api';
 * const results = await api.search.search('indie rock');
 */

import { searchAPI } from './services/search';
import { healthAPI } from './services/health';
import { profileAPI } from './services/profile';
import { notificationsAPI } from './services/notifications';
import { analyticsAPI } from './services/analytics';
import { recommendationsAPI } from './services/recommendations';

export { apiClient, APIError, APIClient } from './client';
export { searchAPI, healthAPI, profileAPI, notificationsAPI, analyticsAPI, recommendationsAPI };

// Aggregate API object for convenience
export const api = {
    search: searchAPI,
    health: healthAPI,
    profile: profileAPI,
    notifications: notificationsAPI,
    analytics: analyticsAPI,
    recommendations: recommendationsAPI,
} as const;

// Re-export types
export type { SearchResults } from './services/search';
export type { HealthStatus } from './services/health';
