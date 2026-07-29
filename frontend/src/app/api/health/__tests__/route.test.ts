/**
 * Health Check API Route Tests
 * Tests system health monitoring endpoint
 */

import { GET } from '../route';
import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Mock the rate limiter to avoid request.ip issues
jest.mock('@/middleware/rate-limit', () => ({
    healthCheckLimiter: jest.fn(() => null),
}));

// Mock env to avoid validation issues in tests
jest.mock('@/lib/env', () => ({
    env: {
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
        NEXT_PUBLIC_WS_URL: 'wss://example.com',
        NEXT_PUBLIC_SPOTIFY_CLIENT_ID: 'test-spotify-client-id',
        NEXT_PUBLIC_SPOTIFY_REDIRECT_URI: 'http://localhost:3000/auth/callback/spotify',
    },
}));

// Helper to create a mock NextRequest
function createMockRequest(url = 'http://localhost:3000/api/health'): NextRequest {
    return new NextRequest(url);
}

describe('Health Check API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Successful Health Checks', () => {
        it('should return healthy status when database is accessible', async () => {
            // Mock successful database query
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { count: 1 },
                    error: null,
                }),
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.status).toBe('healthy');
            expect(body.timestamp).toBeDefined();
            expect(body.checks.database.status).toBe('up');
            expect(body.checks.application.status).toBe('up');
            expect(response.status).toBe(200);
        });

        it('should include response time in database check', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { count: 1 },
                    error: null,
                }),
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.checks.database.responseTime).toMatch(/\d+ms/);
        });

        it('should include application environment', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { count: 1 },
                    error: null,
                }),
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.checks.application.environment).toBe('test');
        });
    });

    describe('Unhealthy States', () => {
        it('should return unhealthy status when database is down', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Connection refused' },
                }),
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.status).toBe('unhealthy');
            expect(body.checks.database.status).toBe('down');
            expect(body.checks.database.error).toBe('Connection refused');
            expect(response.status).toBe(503);
        });

        it('should handle unexpected errors gracefully', async () => {
            (supabase.from as jest.Mock).mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.status).toBe('unhealthy');
            expect(body.error).toBe('Unexpected error');
            expect(response.status).toBe(503);
        });

        it('should handle non-Error exceptions', async () => {
            (supabase.from as jest.Mock).mockImplementation(() => {
                throw 'String error';
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            expect(body.status).toBe('unhealthy');
            expect(body.error).toBe('Unknown error');
            expect(response.status).toBe(503);
        });
    });

    describe('Timestamp Validation', () => {
        it('should include valid ISO timestamp', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { count: 1 },
                    error: null,
                }),
            });

            const response = await GET(createMockRequest());
            const body = await response.json();

            const timestamp = new Date(body.timestamp);
            expect(timestamp.toISOString()).toBe(body.timestamp);
            expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
        });
    });
});
