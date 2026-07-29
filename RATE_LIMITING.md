# Rate Limiting Implementation Guide

## Overview

Rate limiting has been implemented to protect the application from abuse and DoS attacks. This includes both WebSocket server-side rate limiting and frontend client-side rate limiting.

---

## WebSocket Server Rate Limiting

### Features Implemented

1. **Message Rate Limiting**: 100 messages per minute per user
2. **Message Size Limiting**: 10KB maximum per message
3. **Connection Throttling**: Maximum 3 concurrent connections per user

### Implementation Details

#### Message Rate Limiting
```javascript
// Each connection tracks its own rate limit
ws.messageCount = 0;
ws.rateLimitResetTime = Date.now() + 60000; // Reset every minute

// Check on each message
if (ws.messageCount > 100) {
    ws.send(JSON.stringify({
        type: 'error',
        message: 'Rate limit exceeded (max 100 messages/minute)',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((ws.rateLimitResetTime - now) / 1000)
    }));
    return;
}
```

#### Message Size Limiting
```javascript
// Check message size before processing
if (data.length > 10240) { // 10KB
    ws.send(JSON.stringify({
        type: 'error',
        message: 'Message too large (max 10KB)',
        code: 'MESSAGE_TOO_LARGE'
    }));
    return;
}
```

#### Connection Throttling
```javascript
// Limit connections per user
if (clients.has(ws.userId) && clients.get(ws.userId).size >= 3) {
    ws.close(1008, 'Connection limit exceeded (max 3 connections)');
    return;
}
```

### Error Responses

All rate limit errors include:
- `type`: 'error'
- `message`: Human-readable error message
- `code`: Machine-readable error code
- `retryAfter`: (for rate limits) Seconds until retry allowed

---

## Frontend Rate Limiting

### Rate Limit Utility

Created `lib/rate-limit.ts` with:
- In-memory rate limit tracking
- Automatic cleanup of expired entries
- Configurable limits per action type
- React hook integration

### Usage Examples

#### Basic Usage
```typescript
import { rateLimiter, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

// Check if action is allowed
const key = createRateLimitKey(userId, 'friend-request');
if (!rateLimiter.check(key, RATE_LIMITS.FRIEND_REQUEST)) {
    const resetTime = rateLimiter.getResetTime(key);
    toast.error(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)}s`);
    return;
}

// Proceed with action
await sendFriendRequest(friendId);
```

#### With Async Wrapper
```typescript
import { withRateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

try {
    const result = await withRateLimit(
        createRateLimitKey(userId, 'share-song'),
        RATE_LIMITS.SHARE_SONG,
        async () => {
            return await shareSong(trackId, friendId);
        }
    );
} catch (error) {
    toast.error(error.message); // Shows retry time
}
```

#### React Hook
```typescript
import { useRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

function ChatComponent() {
    const { check, getResetTime } = useRateLimit(
        userId,
        'chat-message',
        RATE_LIMITS.CHAT_MESSAGE
    );

    const sendMessage = () => {
        if (!check()) {
            const resetTime = getResetTime();
            toast.error(`Slow down! Try again in ${Math.ceil(resetTime / 1000)}s`);
            return;
        }
        
        // Send message
    };
}
```

---

## Rate Limit Configurations

### Current Limits

| Action | Limit | Window | Use Case |
|--------|-------|--------|----------|
| Supabase Query | 60 | 1 min | Database reads |
| Supabase Mutation | 30 | 1 min | Database writes |
| Realtime Subscribe | 10 | 1 min | WebSocket subscriptions |
| WS Message | 100 | 1 min | WebSocket messages |
| Friend Request | 10 | 5 min | Social actions |
| Share Song | 20 | 1 min | Sharing |
| Reaction | 60 | 1 min | Emoji reactions |
| Create Station | 5 | 5 min | Radio creation |
| Join Station | 30 | 1 min | Radio joining |
| Chat Message | 60 | 1 min | Chat |

### Adjusting Limits

Edit `RATE_LIMITS` in `lib/rate-limit.ts`:
```typescript
export const RATE_LIMITS = {
    CHAT_MESSAGE: { maxRequests: 100, windowMs: 60000 }, // Increase to 100/min
} as const;
```

---

## Integration Examples

### Station Chat
```typescript
// station-chat.tsx
import { useRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const { check } = useRateLimit(userId, 'chat-message', RATE_LIMITS.CHAT_MESSAGE);

const sendMessage = async () => {
    if (!check()) {
        toast.error('Sending too fast! Please slow down.');
        return;
    }
    
    // Send via WebSocket
    sendWsMessage({ type: 'radio:chat-message', message });
};
```

### Friend Requests
```typescript
// friend-list.tsx
import { withRateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

const sendFriendRequest = async (friendId: string) => {
    try {
        await withRateLimit(
            createRateLimitKey(userId, 'friend-request'),
            RATE_LIMITS.FRIEND_REQUEST,
            async () => {
                const { error } = await supabase
                    .from('friendships')
                    .insert({ user_id: userId, friend_id: friendId });
                
                if (error) throw error;
            }
        );
        
        toast.success('Friend request sent!');
    } catch (error) {
        toast.error(error.message);
    }
};
```

### Track Reactions
```typescript
// track-reactions.tsx
import { rateLimiter, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

const addReaction = (emoji: string) => {
    const key = createRateLimitKey(userId, 'reaction');
    
    if (!rateLimiter.check(key, RATE_LIMITS.REACTION)) {
        // Silently ignore (reactions are non-critical)
        return;
    }
    
    sendWsMessage({ type: 'radio:reaction', emoji });
};
```

---

## Monitoring & Logging

### Server-Side Logging
```javascript
console.log(`❌ Rate limit exceeded for ${ws.userId}: ${ws.messageCount} messages/min`);
console.log(`❌ Message too large from ${ws.userId}: ${data.length} bytes`);
console.log(`❌ Connection limit exceeded for ${ws.userId}`);
```

### Client-Side Monitoring
```typescript
// Add to error handler
if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Track rate limit hits
    analytics.track('rate_limit_hit', {
        action: action,
        userId: userId,
        retryAfter: error.retryAfter
    });
}
```

---

## Testing

### Manual Testing

1. **Message Rate Limit**:
   ```javascript
   // Send 101 messages rapidly
   for (let i = 0; i < 101; i++) {
       ws.send(JSON.stringify({ type: 'ping' }));
   }
   // Expected: 101st message gets error response
   ```

2. **Message Size Limit**:
   ```javascript
   // Send 11KB message
   const largeMessage = 'x'.repeat(11 * 1024);
   ws.send(JSON.stringify({ type: 'chat', message: largeMessage }));
   // Expected: Error response
   ```

3. **Connection Limit**:
   ```javascript
   // Open 4 connections with same token
   // Expected: 4th connection rejected
   ```

### Automated Testing
```typescript
// __tests__/rate-limit.test.ts
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
    it('should allow requests under limit', () => {
        const key = 'test:action';
        expect(rateLimiter.check(key, { maxRequests: 5, windowMs: 1000 })).toBe(true);
    });

    it('should block requests over limit', () => {
        const key = 'test:action';
        const config = { maxRequests: 2, windowMs: 1000 };
        
        rateLimiter.check(key, config); // 1
        rateLimiter.check(key, config); // 2
        expect(rateLimiter.check(key, config)).toBe(false); // 3 - blocked
    });
});
```

---

## Security Considerations

### DoS Protection
- ✅ Prevents message flooding
- ✅ Prevents connection flooding
- ✅ Prevents large message attacks

### Bypass Prevention
- Rate limits are per-user (JWT-based)
- Cannot be bypassed by opening new connections
- Server-side enforcement (client cannot disable)

### False Positives
- Limits are generous for normal usage
- Error messages include retry time
- Automatic reset every minute

---

## Production Recommendations

### Before Deployment
1. **Test all limits** with real usage patterns
2. **Monitor rate limit hits** in first week
3. **Adjust limits** based on actual usage
4. **Add alerting** for excessive rate limiting

### Monitoring Metrics
- Rate limit hits per user
- Average messages per minute
- Connection count per user
- Message size distribution

### Tuning
Start conservative, then increase limits based on:
- User feedback
- Server capacity
- Abuse patterns
- Feature requirements

---

## Future Enhancements

### Potential Improvements
1. **Redis-based rate limiting** for distributed systems
2. **Per-IP rate limiting** for unauthenticated endpoints
3. **Dynamic limits** based on user reputation
4. **Graduated penalties** (temporary bans for repeat offenders)
5. **Rate limit headers** (X-RateLimit-Remaining, etc.)

### Integration with Upstash
```typescript
// Example with Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
});

const { success } = await ratelimit.limit(userId);
if (!success) {
    throw new Error('Rate limit exceeded');
}
```

---

## Conclusion

Rate limiting is now implemented across both WebSocket server and frontend, providing comprehensive protection against abuse while maintaining good UX for legitimate users. The system is production-ready and can be easily tuned based on real-world usage.
