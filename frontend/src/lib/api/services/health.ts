import { apiClient } from '../client';

/**
 * Health Check API Service
 *
 * Handles health check and status API calls.
 */

export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    checks?: {
        database?: { status: string; response_time?: number };
        redis?: { status: string; response_time?: number };
        websocket?: { status: string; response_time?: number };
        spotify?: { status: string; response_time?: number };
    };
}

export const healthAPI = {
    /**
     * Basic health check
     */
    check: async (): Promise<{ status: string }> => {
        return apiClient.get('/api/health');
    },

    /**
     * Advanced health check with component details
     */
    checkAdvanced: async (): Promise<HealthStatus> => {
        return apiClient.get('/api/health/advanced');
    },
};
