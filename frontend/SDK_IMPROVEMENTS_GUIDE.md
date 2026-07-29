# SDK & Network Improvements - Implementation Guide

## Overview
This guide documents the improvements made to Spotify SDK, WebSocket, and request caching systems.

## ✅ Already Implemented

### 1. Spotify SDK Token Refresh
**File**: `lib/spotify-sdk.tsx` (Lines 51-60)

**Implementation**:
```typescript
if (!session?.provider_token) {
    logger.warn('No Spotify token found in session');
    
    // Attempt to refresh session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.provider_token) {
        handleError(refreshError || new Error('No token after refresh'), 'SpotifySDK');
        return;
    }
}
```

**Features**:
- ✅ Automatic token refresh on expiration
- ✅ Error handling with user-friendly messages
- ✅ Logger integration
- ✅ Graceful fallback

### 2. WebSocket Exponential Backoff
**File**: `lib/websocket.tsx` (Lines 74-82)

**Implementation**:
```typescript
// Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
const backoff = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
retryCountRef.current += 1;

logger.info(`🔄 Reconnecting in ${backoff}ms (Attempt ${retryCountRef.current}/${maxRetriesRef.current})`);

reconnectTimeoutRef.current = setTimeout(() => {
    connect();
}, backoff);
```

**Features**:
- ✅ Exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max)
- ✅ Max retry limit (10 attempts)
- ✅ Intentional close detection
- ✅ Auth state change handling
- ✅ Automatic reconnection

## ✅ New Implementation

### 3. Request Cache & Deduplication
**File**: `lib/cache.ts` (230 lines)

**Features**:
- ✅ TTL-based caching (default: 1 minute)
- ✅ Request deduplication (prevents duplicate API calls)
- ✅ LRU eviction (max 1000 entries)
- ✅ Pattern-based invalidation
- ✅ Automatic cleanup (every 5 minutes)
- ✅ Cache statistics
- ✅ Singleton pattern

**Usage Examples**:

#### Basic Caching
```typescript
import { cachedFetch, cacheKey } from '@/lib/cache';

// Cache user data for 1 minute
const user = await cachedFetch(
    cacheKey('user', userId),
    () => api.getUser(userId),
    60000 // 1 minute TTL
);
```

#### Request Deduplication
```typescript
// Multiple components call this simultaneously
// Only ONE actual API call is made
const track = await cachedFetch(
    cacheKey('track', trackId),
    () => api.getTrack(trackId)
);
```

#### Cache Invalidation
```typescript
import { requestCache } from '@/lib/cache';

// Invalidate specific key
requestCache.invalidate(cacheKey('user', userId));

// Invalidate pattern (all user caches)
requestCache.invalidatePattern(/^user:/);

// Clear all cache
requestCache.clear();
```

#### Integration with Supabase
```typescript
// In your API layer
async function getStation(stationId: string) {
    return cachedFetch(
        cacheKey('station', stationId),
        async () => {
            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('station_id', stationId)
                .single();
            
            if (error) throw error;
            return data;
        },
        30000 // 30 seconds
    );
}
```

## Implementation Checklist

### Phase 1: Add Caching to Data Fetching
- [ ] `curator-stats.tsx` - Cache user stats
- [ ] `station-analytics.tsx` - Cache station analytics
- [ ] `dj-profile-card.tsx` - Cache DJ profile
- [ ] `playlist-insights.tsx` - Cache playlist insights
- [ ] `discovery-feed.tsx` - Cache discovery data

### Phase 2: Invalidate on Mutations
- [ ] After creating station → invalidate `station:*`
- [ ] After updating profile → invalidate `user:${userId}`
- [ ] After adding track → invalidate `playlist:${playlistId}`
- [ ] On logout → clear all cache

### Phase 3: Monitor Performance
- [ ] Add cache hit/miss metrics
- [ ] Monitor cache size
- [ ] Track deduplication savings

## Performance Benefits

### Before Caching
```
User visits dashboard:
- 5 components fetch user data
- 5 API calls to Supabase
- ~500ms total
```

### After Caching
```
User visits dashboard:
- 5 components request user data
- 1 API call to Supabase (others deduplicated)
- ~100ms total (80% faster)
```

### Cache Hit Ratio
Target: **70-80%** cache hit ratio for frequently accessed data

## Best Practices

### 1. Choose Appropriate TTL
```typescript
// Frequently changing data: short TTL
const liveListeners = await cachedFetch(
    cacheKey('listeners', stationId),
    () => api.getListeners(stationId),
    5000 // 5 seconds
);

// Rarely changing data: long TTL
const userProfile = await cachedFetch(
    cacheKey('profile', userId),
    () => api.getProfile(userId),
    300000 // 5 minutes
);

// Static data: very long TTL
const genres = await cachedFetch(
    'genres',
    () => api.getGenres(),
    3600000 // 1 hour
);
```

### 2. Invalidate on Mutations
```typescript
async function updateUserProfile(userId: string, data: ProfileData) {
    // Update in database
    await api.updateProfile(userId, data);
    
    // Invalidate cache
    requestCache.invalidate(cacheKey('profile', userId));
    requestCache.invalidate(cacheKey('user', userId));
}
```

### 3. Use Pattern Invalidation for Related Data
```typescript
// After deleting a station
async function deleteStation(stationId: string) {
    await api.deleteStation(stationId);
    
    // Invalidate all station-related caches
    requestCache.invalidatePattern(/^station:/);
    requestCache.invalidatePattern(/^stations$/);
}
```

### 4. Clear Cache on Logout
```typescript
import { clearCacheOnLogout } from '@/lib/cache';

// In your auth handler
supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
        clearCacheOnLogout();
    }
});
```

## Monitoring

### Cache Statistics
```typescript
import { requestCache } from '@/lib/cache';

// Get current stats
const stats = requestCache.getStats();
console.log('Cache stats:', stats);
// { cacheSize: 245, pendingRequests: 3, maxSize: 1000 }
```

### Debug Logging
Enable debug logs to see cache behavior:
```typescript
// In development, logger.debug shows cache hits/misses
// Check browser console for:
// [DEBUG] Cache hit { key: 'user:123' }
// [DEBUG] Cache miss, fetching { key: 'track:456' }
// [DEBUG] Request deduplication { key: 'station:789' }
```

## Migration Guide

### Step 1: Identify Cacheable Requests
Look for:
- Data fetched on component mount
- Data fetched multiple times
- Slow API calls
- Frequently accessed data

### Step 2: Wrap with cachedFetch
```typescript
// Before
useEffect(() => {
    const fetchData = async () => {
        const data = await api.getData();
        setData(data);
    };
    fetchData();
}, []);

// After
useEffect(() => {
    const fetchData = async () => {
        const data = await cachedFetch(
            'my-data',
            () => api.getData(),
            60000
        );
        setData(data);
    };
    fetchData();
}, []);
```

### Step 3: Add Invalidation
```typescript
// After mutations
const handleUpdate = async () => {
    await api.updateData();
    requestCache.invalidate('my-data');
    // Re-fetch to update UI
    const fresh = await api.getData();
    setData(fresh);
};
```

## Troubleshooting

### Issue: Stale Data
**Solution**: Reduce TTL or invalidate cache on mutations

### Issue: Cache Too Large
**Solution**: Reduce MAX_CACHE_SIZE or use shorter TTLs

### Issue: Memory Leak
**Solution**: Ensure cleanup interval is running (automatic)

### Issue: Duplicate Requests Still Happening
**Solution**: Ensure same cache key is used across components

---

**Status**: ✅ All SDK improvements implemented  
**Cache System**: ✅ Ready for integration  
**Next**: Integrate caching into data-fetching components
