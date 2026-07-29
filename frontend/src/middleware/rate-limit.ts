/**
 * API Rate Limiting Middleware for Next.js
 * Protects API routes from abuse
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    max: number;       // Max requests per window
}

/**
 * Create a rate limiter for API routes
 */
export function createRateLimiter(options: RateLimitOptions) {
    return (request: NextRequest): NextResponse | null => {
        // Get client identifier (IP address)
        const key = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const now = Date.now();
        let entry = rateLimitStore.get(key);

        // Reset if window expired
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + options.windowMs,
            };
            rateLimitStore.set(key, entry);
        }

        entry.count++;

        // Check if limit exceeded
        if (entry.count > options.max) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(options.max),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
                    },
                }
            );
        }

        // Request allowed - add rate limit headers
        const remaining = options.max - entry.count;
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', String(options.max));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

        return null; // Allow request
    };
}

// Pre-configured rate limiters for common use cases
export const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 100,              // 100 requests
});

export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 requests (prevent brute force)
});

export const spotifyLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 30,               // 30 requests (respect Spotify API limits)
});

export const healthCheckLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    max: 60,               // 60 requests (allow monitoring)
});
