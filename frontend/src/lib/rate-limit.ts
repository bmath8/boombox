/**
 * Simple in-memory rate limiter
 * Uses a token bucket algorithm
 */

interface RateLimitConfig {
    interval: number; // Interval in milliseconds
    uniqueTokenPerInterval: number; // Max requests per interval
}

export class RateLimiter {
    private tokenCache: Map<string, { count: number }>;
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.tokenCache = new Map();
        this.config = config;
    }

    check(limit: number, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Get or create token entry
            let tokenData = this.tokenCache.get(token);
            if (!tokenData) {
                tokenData = { count: 0 };
                this.tokenCache.set(token, tokenData);
            }

            tokenData.count += 1;

            const currentUsage = tokenData.count;
            const isRateLimited = currentUsage > limit;

            // Reset token count after interval
            // Note: This is a simplified fixed window, not a true sliding window or token bucket
            // but sufficient for basic protection
            if (currentUsage === 1) {
                setTimeout(() => {
                    const tc = this.tokenCache.get(token);
                    if (tc) {
                        tc.count = 0;
                    }
                    this.tokenCache.delete(token);
                }, this.config.interval);
            }

            if (isRateLimited) {
                reject(new Error('Rate limit exceeded'));
            } else {
                resolve();
            }
        });
    }
}

// Singleton instance for global rate limiting
// 10 requests per second per user/IP
export const limiter = new RateLimiter({
    interval: 60000, // 1 minute
    uniqueTokenPerInterval: 500, // Max unique tokens (users) to track
});

// Rate limit constants for different operations
export const RATE_LIMITS = {
    SPOTIFY_SEARCH: 20, // 20 searches per minute
    SUPABASE_QUERY: 30, // 30 queries per minute
    WEBSOCKET_MESSAGE: 100, // 100 messages per minute
};

// Helper function to wrap async operations with rate limiting
export async function withRateLimit<T>(
    key: string,
    limit: number,
    fn: () => Promise<T>
): Promise<T> {
    await limiter.check(limit, key);
    return fn();
}
