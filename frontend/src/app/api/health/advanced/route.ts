/**
 * Advanced Health Check API Route
 * Provides detailed health status for all system components
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { redisHealthCheckLimiter } from '@/lib/redis-rate-limit';
import { env } from '@/lib/env';

declare const process: { env: { [key: string]: string | undefined }; uptime: () => number };
declare const Buffer: { from: (str: string) => { toString: (encoding: string) => string } };

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    error?: string;
    details?: Record<string, unknown>;
}

interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        database: HealthCheckResult;
        redis: HealthCheckResult;
        websocket: HealthCheckResult;
        spotify: HealthCheckResult;
    };
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    // Check if Supabase is configured
    if (!supabase) {
        return {
            status: 'degraded',
            responseTime: 0,
            error: 'Supabase not configured',
            details: { configured: false },
        };
    }

    try {
        // Test database connection
        const { data, error: dbError } = await supabase
            .from('users')
            .select('count')
            .limit(1)
            .single();

        const responseTime = Date.now() - startTime;

        if (dbError) {
            return {
                status: 'unhealthy',
                responseTime,
                error: dbError.message,
            };
        }

        // Check if response time is acceptable
        const status = responseTime < 100 ? 'healthy' : 'degraded';

        return {
            status,
            responseTime,
            details: {
                connected: true,
            },
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        // Dynamic import to avoid issues if Redis is not available
        const Redis = (await import('ioredis')).default;
        const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', {
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
        });

        // Ping Redis
        const result = await redis.ping();
        const responseTime = Date.now() - startTime;

        await redis.quit();

        if (result !== 'PONG') {
            return {
                status: 'unhealthy',
                responseTime,
                error: 'Redis ping failed',
            };
        }

        const status = responseTime < 50 ? 'healthy' : 'degraded';

        return {
            status,
            responseTime,
            details: {
                connected: true,
            },
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Redis unavailable',
        };
    }
}

/**
 * Check WebSocket server health
 */
async function checkWebSocket(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        const wsUrl = env.NEXT_PUBLIC_WS_URL;

        // Skip check if WebSocket is not configured
        if (!wsUrl) {
            return {
                status: 'degraded',
                responseTime: 0,
                error: 'WebSocket URL not configured',
            };
        }

        const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');

        // Try to fetch WebSocket server health endpoint
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${httpUrl}/health`, {
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            return {
                status: 'unhealthy',
                responseTime,
                error: `HTTP ${response.status}`,
            };
        }

        const status = responseTime < 200 ? 'healthy' : 'degraded';

        return {
            status,
            responseTime,
            details: {
                connected: true,
            },
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'WebSocket server unavailable',
        };
    }
}

/**
 * Check Spotify API health
 */
async function checkSpotify(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        // Check if Spotify credentials are configured
        if (!process.env['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] || !process.env['SPOTIFY_CLIENT_SECRET']) {
            return {
                status: 'degraded',
                responseTime: 0,
                error: 'Spotify credentials not configured',
            };
        }

        // Try to get client credentials token (doesn't require user auth)
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(
                    `${process.env['NEXT_PUBLIC_SPOTIFY_CLIENT_ID']}:${process.env['SPOTIFY_CLIENT_SECRET']}`
                ).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });

        const responseTime = Date.now() - startTime;

        if (!tokenResponse.ok) {
            return {
                status: 'unhealthy',
                responseTime,
                error: `Spotify API returned ${tokenResponse.status}`,
            };
        }

        const status = responseTime < 500 ? 'healthy' : 'degraded';

        return {
            status,
            responseTime,
            details: {
                apiReachable: true,
            },
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Spotify API unavailable',
        };
    }
}

/**
 * Main health check handler
 */
export async function GET(request: NextRequest) {
    // Apply rate limiting
    const rateLimitResult = await redisHealthCheckLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    const startTime = Date.now();

    try {
        // Run all health checks in parallel
        const [database, redis, websocket, spotify] = await Promise.all([
            checkDatabase(),
            checkRedis(),
            checkWebSocket(),
            checkSpotify(),
        ]);

        // Determine overall system health
        const checks = { database, redis, websocket, spotify };
        const statuses = Object.values(checks).map(check => check.status);

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (statuses.includes('unhealthy')) {
            // Critical services down
            if (database.status === 'unhealthy' || redis.status === 'unhealthy') {
                overallStatus = 'unhealthy';
            } else {
                overallStatus = 'degraded';
            }
        } else if (statuses.includes('degraded')) {
            overallStatus = 'degraded';
        }

        const response: SystemHealth = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env['NEXT_PUBLIC_APP_VERSION'] || '1.0.0',
            environment: env.NODE_ENV,
            checks,
        };

        // Return appropriate status code
        const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

        return NextResponse.json(response, {
            status: httpStatus,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'X-Response-Time': `${Date.now() - startTime}ms`,
            },
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Health check failed',
        }, {
            status: 503,
        });
    }
}
