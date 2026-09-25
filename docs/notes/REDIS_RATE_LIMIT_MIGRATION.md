# Redis Rate Limiting Migration Guide

## Overview

We've migrated from in-memory rate limiting to Redis-based distributed rate limiting. This ensures rate limits work correctly across multiple server instances.

## Installation

Add `ioredis` to frontend dependencies:

```bash
cd frontend
npm install ioredis
npm install --save-dev @types/ioredis
```

## Usage in API Routes

### Before (In-Memory)
```typescript
import { healthCheckLimiter } from '@/middleware/rate-limit';

export async function GET(request: NextRequest) {
    const rateLimitResult = healthCheckLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    // Your API logic...
}
```

### After (Redis-based)
```typescript
import { redisHealthCheckLimiter } from '@/lib/redis-rate-limit';

export async function GET(request: NextRequest) {
    const rateLimitResult = await redisHealthCheckLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    // Your API logic...
}
```

## Migration Checklist

Update these files to use Redis-based rate limiting:

- [ ] `src/app/api/health/route.ts` - Use `redisHealthCheckLimiter`
- [ ] `src/app/api/spotify/playlists/route.ts` - Use `redisSpotifyLimiter`
- [ ] `src/app/api/spotify/search/route.ts` - Use `redisSpotifyLimiter`
- [ ] `src/app/api/auth/callback/spotify/route.ts` - Use `redisAuthLimiter`
- [ ] Any other API routes - Use `redisApiLimiter`

## Example Migration

```typescript
// File: src/app/api/health/route.ts

// OLD:
// import { healthCheckLimiter } from '@/middleware/rate-limit';
// const rateLimitResult = healthCheckLimiter(request);

// NEW:
import { redisHealthCheckLimiter } from '@/lib/redis-rate-limit';

export async function GET(request: NextRequest) {
    // Check rate limit
    const rateLimitResult = await redisHealthCheckLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    // Rest of your code...
}
```

## Benefits

1. **Distributed**: Works across multiple server instances
2. **Accurate**: Uses sliding window algorithm
3. **Reliable**: Falls back to in-memory if Redis is unavailable
4. **Configurable**: Easy to adjust limits per route
5. **Headers**: Automatically adds standard rate limit headers

## Configuration

Adjust rate limits in `src/lib/redis-rate-limit.ts`:

```typescript
export const redisApiLimiter = createRedisRateLimiter({
    windowMs: 60 * 1000,  // Window size
    max: 100,              // Max requests
    keyPrefix: 'ratelimit:api:', // Redis key prefix
});
```

## Redis Connection

The rate limiter automatically connects to Redis using the `REDIS_URL` environment variable:

```env
REDIS_URL=redis://localhost:6379
```

If Redis is unavailable, it automatically falls back to in-memory rate limiting with a warning.

## Testing

Test rate limiting:

```bash
# Make 101 requests rapidly
for i in {1..101}; do curl http://localhost:3000/api/health; done

# The 101st request should return 429 Too Many Requests
```

## Monitoring

Check Redis for rate limit keys:

```bash
redis-cli KEYS "ratelimit:*"
redis-cli ZCARD "ratelimit:api:127.0.0.1"
```

## Troubleshooting

If rate limiting isn't working:

1. Check Redis connection: `redis-cli ping`
2. Check environment variable: `echo $REDIS_URL`
3. Check logs for "Redis rate limiter initialized"
4. Verify ioredis is installed: `npm list ioredis`

## Next Steps

After migration, you can safely remove the old rate limiting middleware from `src/middleware/rate-limit.ts` (keep it as backup for now).
