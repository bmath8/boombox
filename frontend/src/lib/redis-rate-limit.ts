/**
 * Redis-based Distributed Rate Limiter
 * Works across multiple server instances
 * Uses sliding window algorithm for accurate rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';

// Redis client types (will be imported from ioredis if available)
interface RedisClient {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    del(key: string): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    zcard(key: string): Promise<number>;
}

export interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    max: number;       // Max requests per window
    keyPrefix?: string; // Prefix for Redis keys
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Distributed Rate Limiter using Redis
 * Uses sorted sets for sliding window rate limiting
 */
export class RedisRateLimiter {
    private redis: RedisClient | null = null;
    private options: Required<RateLimitOptions>;

    constructor(options: RateLimitOptions) {
        this.options = {
            ...options,
            keyPrefix: options.keyPrefix || 'ratelimit:',
        };

        // Initialize Redis client
        this.initRedis();
    }

    private async initRedis() {
        try {
            // Dynamic import to avoid issues if Redis is not available
            const Redis = (await import('ioredis')).default;
            const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

            this.redis = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false, // Fail immediately if not connected
                commandTimeout: 1000,      // Timeout commands after 1s
            }) as unknown as RedisClient;

            console.log('✅ Redis rate limiter initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Redis for rate limiting:', error);
            console.warn('⚠️ Falling back to in-memory rate limiting (not distributed)');
            this.redis = null;
        }
    }

    /**
     * Check if request is within rate limit
     * @param identifier - Unique identifier (user ID, IP, etc.)
     * @returns RateLimitResult
     */
    async check(identifier: string): Promise<RateLimitResult> {
        // Fallback to in-memory if Redis is not available
        if (!this.redis) {
            return this.checkInMemory(identifier);
        }

        const key = `${this.options.keyPrefix}${identifier}`;
        const now = Date.now();
        const windowStart = now - this.options.windowMs;

        try {
            // Remove old entries outside the window
            await this.redis.zremrangebyscore(key, 0, windowStart);

            // Count current requests in window
            const count = await this.redis.zcard(key);

            // Calculate remaining and reset time
            const remaining = Math.max(0, this.options.max - count);
            const resetTime = now + this.options.windowMs;

            // Check if limit exceeded
            if (count >= this.options.max) {
                return {
                    success: false,
                    limit: this.options.max,
                    remaining: 0,
                    reset: Math.ceil(resetTime / 1000),
                };
            }

            // Add current request
            await this.redis.zadd(key, now, `${now}`);

            // Set expiry on key
            await this.redis.expire(key, Math.ceil(this.options.windowMs / 1000));

            return {
                success: true,
                limit: this.options.max,
                remaining: remaining - 1, // Subtract current request
                reset: Math.ceil(resetTime / 1000),
            };
        } catch (error) {
            console.error('Redis rate limit error:', error);
            // Fail open - allow request if Redis fails
            return {
                success: true,
                limit: this.options.max,
                remaining: this.options.max,
                reset: Math.ceil((now + this.options.windowMs) / 1000),
            };
        }
    }

    /**
     * In-memory fallback rate limiter
     * Used when Redis is not available
     */
    private inMemoryStore = new Map<string, Array<number>>();

    private checkInMemory(identifier: string): RateLimitResult {
        const key = `${this.options.keyPrefix}${identifier}`;
        const now = Date.now();
        const windowStart = now - this.options.windowMs;

        // Get or create entry
        let timestamps = this.inMemoryStore.get(key) || [];

        // Remove old timestamps
        timestamps = timestamps.filter(t => t > windowStart);

        // Update store
        this.inMemoryStore.set(key, timestamps);

        const count = timestamps.length;
        const remaining = Math.max(0, this.options.max - count);
        const resetTime = now + this.options.windowMs;

        // Check if limit exceeded
        if (count >= this.options.max) {
            return {
                success: false,
                limit: this.options.max,
                remaining: 0,
                reset: Math.ceil(resetTime / 1000),
            };
        }

        // Add current request
        timestamps.push(now);

        return {
            success: true,
            limit: this.options.max,
            remaining: remaining - 1,
            reset: Math.ceil(resetTime / 1000),
        };
    }

    /**
     * Reset rate limit for an identifier
     * @param identifier - Unique identifier to reset
     */
    async reset(identifier: string): Promise<void> {
        if (this.redis) {
            const key = `${this.options.keyPrefix}${identifier}`;
            await this.redis.del(key);
        } else {
            const key = `${this.options.keyPrefix}${identifier}`;
            this.inMemoryStore.delete(key);
        }
    }
}

/**
 * Create a rate limiter middleware for Next.js API routes
 */
export function createRedisRateLimiter(options: RateLimitOptions) {
    const limiter = new RedisRateLimiter(options);

    return async (request: NextRequest): Promise<NextResponse | null> => {
        // Get client identifier (IP address or user ID)
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        const result = await limiter.check(ip);

        // Add rate limit headers
        const headers = {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
        };

        // If limit exceeded, return error response
        if (!result.success) {
            const retryAfter = result.reset - Math.floor(Date.now() / 1000);

            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        ...headers,
                        'Retry-After': String(retryAfter),
                    },
                }
            );
        }

        return null; // Allow request
    };
}

// Pre-configured Redis rate limiters
export const redisApiLimiter = createRedisRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 100,              // 100 requests
    keyPrefix: 'ratelimit:api:',
});

export const redisAuthLimiter = createRedisRateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 requests
    keyPrefix: 'ratelimit:auth:',
});

export const redisSpotifyLimiter = createRedisRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 30,               // 30 requests
    keyPrefix: 'ratelimit:spotify:',
});

export const redisHealthCheckLimiter = createRedisRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 60,               // 60 requests
    keyPrefix: 'ratelimit:health:',
});
