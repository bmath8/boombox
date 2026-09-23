/**
 * Enhanced Request Cache & Deduplication System
 * Features:
 * - Memory cache with LRU eviction
 * - IndexedDB persistent cache layer
 * - Cache priorities (high/normal/low)
 * - Request deduplication
 * - TTL support with auto-cleanup
 * - Storage quota management
 */

import { logger } from './logger';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

type CachePriority = 'high' | 'normal' | 'low';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    accessCount: number; // For LRU tracking
    lastAccessed: number; // For LRU tracking
    priority: CachePriority;
}

interface PendingRequest<T> {
    promise: Promise<T>;
    timestamp: number;
}

interface CacheDB extends DBSchema {
    cache: {
        key: string;
        value: CacheEntry<any>;
        indexes: { 'by-priority': CachePriority; 'by-expiry': number };
    };
}

const DB_NAME = 'fam_music_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

class SmartCache {
    private memoryCache = new Map<string, CacheEntry<unknown>>();
    private pendingRequests = new Map<string, PendingRequest<unknown>>();
    private db: IDBPDatabase<CacheDB> | null = null;

    private readonly DEFAULT_TTL = 60000; // 1 minute
    private readonly MAX_MEMORY_SIZE = 100; // Reduced for better LRU management
    private readonly MAX_DB_SIZE = 1000;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.initDB();

        // Auto-cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Initialize IndexedDB
     */
    private async initDB() {
        try {
            this.db = await openDB<CacheDB>(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    const store = db.createObjectStore(STORE_NAME);
                    store.createIndex('by-priority', 'priority');
                    store.createIndex('by-expiry', 'expiresAt');
                },
            });
            logger.info('[Cache] IndexedDB initialized');
        } catch (error) {
            logger.error('[Cache] Failed to initialize IndexedDB:', error);
        }
    }

    /**
     * Fetch data with multi-layer caching
     */
    async fetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: {
            ttl?: number;
            priority?: CachePriority;
            persist?: boolean;
        } = {}
    ): Promise<T> {
        const { ttl = this.DEFAULT_TTL, priority = 'normal', persist = false } = options;

        // 1. Check memory cache (fastest)
        const memoryCached = this.getFromMemory<T>(key);
        if (memoryCached !== null) {
            logger.debug('[Cache] Memory hit', { key });
            return memoryCached;
        }

        // 2. Check IndexedDB (persistent)
        if (persist || this.db) {
            const dbCached = await this.getFromDB<T>(key);
            if (dbCached !== null) {
                logger.debug('[Cache] DB hit', { key });
                // Promote to memory cache
                this.setInMemory(key, dbCached, { ttl, priority });
                return dbCached;
            }
        }

        // 3. Check pending requests (deduplication)
        const pending = this.pendingRequests.get(key) as PendingRequest<T> | undefined;
        if (pending) {
            logger.debug('[Cache] Request deduplication', { key });
            return pending.promise;
        }

        // 4. Fetch fresh data
        logger.debug('[Cache] Cache miss, fetching', { key });
        const promise = fetcher()
            .then((data) => {
                // Store in caches
                this.setInMemory(key, data, { ttl, priority });
                if (persist || priority === 'high') {
                    this.saveToDB(key, data, { ttl, priority });
                }
                this.pendingRequests.delete(key);
                return data;
            })
            .catch((error) => {
                this.pendingRequests.delete(key);
                throw error;
            });

        this.pendingRequests.set(key, { promise, timestamp: Date.now() });
        return promise;
    }

    /**
     * Get from memory cache with LRU tracking
     */
    private getFromMemory<T>(key: string): T | null {
        const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

        if (!entry) return null;

        // Check expiry
        if (Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }

        // Update LRU tracking
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        return entry.data;
    }

    /**
     * Get from IndexedDB
     */
    private async getFromDB<T>(key: string): Promise<T | null> {
        if (!this.db) return null;

        try {
            const entry = await this.db.get(STORE_NAME, key) as CacheEntry<T> | undefined;

            if (!entry) return null;

            // Check expiry
            if (Date.now() > entry.expiresAt) {
                await this.db.delete(STORE_NAME, key);
                return null;
            }

            return entry.data;
        } catch (error) {
            logger.error('[Cache] DB read error:', error);
            return null;
        }
    }

    /**
     * Set in memory cache with true LRU eviction
     */
    private setInMemory<T>(
        key: string,
        data: T,
        options: { ttl: number; priority: CachePriority }
    ): void {
        // Enforce max size with LRU eviction
        if (this.memoryCache.size >= this.MAX_MEMORY_SIZE) {
            this.evictLRU();
        }

        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + options.ttl,
            accessCount: 1,
            lastAccessed: Date.now(),
            priority: options.priority,
        });
    }

    /**
     * Save to IndexedDB
     */
    private async saveToDB<T>(
        key: string,
        data: T,
        options: { ttl: number; priority: CachePriority }
    ): Promise<void> {
        if (!this.db) return;

        try {
            // Check DB size and evict if needed
            const count = await this.db.count(STORE_NAME);
            if (count >= this.MAX_DB_SIZE) {
                await this.evictDBEntries();
            }

            await this.db.put(STORE_NAME, {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + options.ttl,
                accessCount: 1,
                lastAccessed: Date.now(),
                priority: options.priority,
            }, key);

            logger.debug('[Cache] Saved to DB', { key, priority: options.priority });
        } catch (error) {
            logger.error('[Cache] DB write error:', error);
        }
    }

    /**
     * LRU eviction for memory cache
     * Evicts lowest priority, least recently used, or least accessed entries
     */
    private evictLRU(): void {
        if (this.memoryCache.size === 0) return;

        let evictKey: string | null = null;
        let lowestScore = Infinity;

        // Priority weights: high=1000, normal=100, low=10
        const priorityWeight = (p: CachePriority) =>
            p === 'high' ? 1000 : p === 'normal' ? 100 : 10;

        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            // Retention score (lower = more likely to evict): favours high priority,
            // frequently accessed, and recently accessed entries.
            // (Previously age was multiplied in, which evicted the NEWEST entry.)
            const ageMs = now - entry.lastAccessed;
            const score = (priorityWeight(entry.priority) * (entry.accessCount + 1)) / (ageMs + 1);

            if (score < lowestScore) {
                lowestScore = score;
                evictKey = key;
            }
        }

        if (evictKey) {
            this.memoryCache.delete(evictKey);
            logger.debug('[Cache] LRU evicted', { key: evictKey });
        }
    }

    /**
     * Evict entries from IndexedDB (remove low priority & expired)
     */
    private async evictDBEntries(): Promise<void> {
        if (!this.db) return;

        try {
            // Remove expired entries first
            let cursor = await this.db.transaction(STORE_NAME, 'readwrite')
                .objectStore(STORE_NAME)
                .openCursor();

            let evictedCount = 0;
            const now = Date.now();

            while (cursor) {
                if (now > cursor.value.expiresAt || cursor.value.priority === 'low') {
                    await cursor.delete();
                    evictedCount++;
                }
                cursor = await cursor.continue();
            }

            logger.debug('[Cache] DB eviction', { evictedCount });
        } catch (error) {
            logger.error('[Cache] DB eviction error:', error);
        }
    }

    /**
     * Invalidate cache key
     */
    invalidate(key: string): void {
        this.memoryCache.delete(key);
        if (this.db) {
            this.db.delete(STORE_NAME, key).catch(err =>
                logger.error('[Cache] DB delete error:', err)
            );
        }
        logger.debug('[Cache] Invalidated', { key });
    }

    /**
     * Invalidate pattern
     */
    invalidatePattern(pattern: string | RegExp): void {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        let count = 0;

        // Memory cache
        for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
                this.memoryCache.delete(key);
                count++;
            }
        }

        // IndexedDB (async)
        if (this.db) {
            this.db.transaction(STORE_NAME, 'readwrite')
                .objectStore(STORE_NAME)
                .openCursor()
                .then(async function deleteCursor(cursor): Promise<void> {
                    if (!cursor) return;
                    if (regex.test(cursor.key)) {
                        await cursor.delete();
                    }
                    return cursor.continue().then(deleteCursor);
                })
                .catch(err => logger.error('[Cache] Pattern invalidation error:', err));
        }

        logger.debug('[Cache] Pattern invalidated', { pattern: pattern.toString(), count });
    }

    /**
     * Clear all caches
     */
    async clear(): Promise<void> {
        this.memoryCache.clear();
        this.pendingRequests.clear();

        if (this.db) {
            await this.db.clear(STORE_NAME);
        }

        logger.info('[Cache] All caches cleared');
    }

    /**
     * Cleanup expired entries
     */
    private async cleanup(): Promise<void> {
        const now = Date.now();
        let expiredCount = 0;

        // Memory cache cleanup
        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.expiresAt) {
                this.memoryCache.delete(key);
                expiredCount++;
            }
        }

        // Pending requests cleanup
        for (const [key, pending] of this.pendingRequests.entries()) {
            if (now - pending.timestamp > 30000) {
                this.pendingRequests.delete(key);
            }
        }

        // IndexedDB cleanup
        if (this.db) {
            try {
                let cursor = await this.db.transaction(STORE_NAME, 'readwrite')
                    .objectStore(STORE_NAME)
                    .openCursor();

                while (cursor) {
                    if (now > cursor.value.expiresAt) {
                        await cursor.delete();
                        expiredCount++;
                    }
                    cursor = await cursor.continue();
                }
            } catch (error) {
                logger.error('[Cache] DB cleanup error:', error);
            }
        }

        if (expiredCount > 0) {
            logger.debug('[Cache] Cleanup complete', { expiredCount });
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        const dbSize = this.db ? await this.db.count(STORE_NAME) : 0;

        return {
            memorySize: this.memoryCache.size,
            dbSize,
            pendingRequests: this.pendingRequests.size,
            maxMemorySize: this.MAX_MEMORY_SIZE,
            maxDBSize: this.MAX_DB_SIZE,
        };
    }

    /**
     * Destroy cache
     */
    async destroy(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        await this.clear();

        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Singleton instance
export const smartCache = new SmartCache();

// Legacy compatibility with existing code
export const requestCache = {
    fetch: <T>(key: string, fetcher: () => Promise<T>, ttl?: number) =>
        smartCache.fetch(key, fetcher, (ttl !== undefined ? { ttl } : {}) as any),
    get: <T>(key: string) => null as T | null, // Memory-only, deprecated
    set: <T>(key: string, data: T, ttl?: number) => { }, // Deprecated
    invalidate: (key: string) => smartCache.invalidate(key),
    invalidatePattern: (pattern: string | RegExp) => smartCache.invalidatePattern(pattern),
    clear: () => smartCache.clear(),
    getStats: () => smartCache.getStats(),
    destroy: () => smartCache.destroy(),
};

/**
 * Helper function for cached fetch with smart caching
 * Supports both old API (number TTL) and new API (options object)
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    optionsOrTTL?: number | {
        ttl?: number;
        priority?: CachePriority;
        persist?: boolean;
    }
): Promise<T> {
    // Backward compatibility: if optionsOrTTL is a number, treat as TTL
    const options = typeof optionsOrTTL === 'number'
        ? { ttl: optionsOrTTL }
        : (optionsOrTTL || {});

    return smartCache.fetch(key, fetcher, options);
}

/**
 * Generate cache key from parameters
 */
export function cacheKey(...parts: (string | number | boolean)[]): string {
    return parts.map(p => String(p)).join(':');
}

/**
 * Clear cache on logout
 */
export async function clearCacheOnLogout(): Promise<void> {
    await smartCache.clear();
}

/**
 * Invalidate specific cache key or pattern
 */
export function invalidateCache(key: string | RegExp): void {
    if (typeof key === 'string') {
        smartCache.invalidate(key);
    } else {
        smartCache.invalidatePattern(key);
    }
}

/**
 * Clear all cache (for testing)
 */
export async function clearCache(): Promise<void> {
    await smartCache.clear();
}
