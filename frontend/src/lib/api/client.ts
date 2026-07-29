/**
 * API Client
 *
 * Centralized API client for all backend calls.
 * Provides consistent error handling, request/response interceptors,
 * and type-safe API calls.
 */

import { handleError } from '@/lib/error-handler';

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public data?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

interface RequestConfig extends RequestInit {
    params?: Record<string, any>;
    responseType?: 'json' | 'blob' | 'text';
}

class APIClient {
    private baseURL: string;
    private defaultHeaders: HeadersInit;

    constructor(baseURL: string = '') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Build URL with query parameters
     */
    private buildURL(endpoint: string, params?: Record<string, any>): string {
        const url = new URL(endpoint, this.baseURL || window.location.origin);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Handle API response
     */
    private async handleResponse<T>(response: Response, config?: RequestConfig): Promise<T> {
        // Handle no content
        if (response.status === 204) {
            return null as T;
        }

        if (config?.responseType === 'blob') {
            return (await response.blob()) as unknown as T;
        }

        if (config?.responseType === 'text') {
            return (await response.text()) as unknown as T;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new APIError(
                data?.message || data?.error || 'Request failed',
                response.status,
                data?.code,
                data
            );
        }

        return data as T;
    }

    /**
     * Make a request
     */
    private async request<T>(
        endpoint: string,
        config: RequestConfig = {}
    ): Promise<T> {
        const { params, headers, ...fetchConfig } = config;

        const url = this.buildURL(endpoint, params);

        try {
            const response = await fetch(url, {
                ...fetchConfig,
                headers: {
                    ...this.defaultHeaders,
                    ...headers,
                },
            });

            return await this.handleResponse<T>(response, config);
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            // Network error or other fetch error
            throw new APIError(
                error instanceof Error ? error.message : 'Network error',
                0,
                'NETWORK_ERROR'
            );
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * PUT request
     */
    async put<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for custom instances
export { APIClient };
