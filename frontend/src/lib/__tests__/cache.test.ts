/**
 * Cache Utility Tests
 */

import { cachedFetch, cacheKey, invalidateCache, clearCache } from '@/lib/cache';

// Mock fetch
global.fetch = jest.fn();

describe('Cache Utility', () => {
    beforeEach(() => {
        clearCache();
        jest.clearAllMocks();
    });

    describe('cacheKey', () => {
        it('should create cache key from parts', () => {
            const key = cacheKey('user', '123', 'profile');
            expect(key).toBe('user:123:profile');
        });

        it('should handle single part', () => {
            const key = cacheKey('global');
            expect(key).toBe('global');
        });

        it('should handle empty parts', () => {
            const key = cacheKey('user', '', 'profile');
            expect(key).toBe('user::profile');
        });
    });

    describe('cachedFetch', () => {
        it('should fetch and cache data', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetchFn = jest.fn().mockResolvedValue(mockData);

            const result = await cachedFetch(
                'test-key',
                fetchFn,
                1000
            );

            expect(result).toEqual(mockData);
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        it('should return cached data on second call', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetchFn = jest.fn().mockResolvedValue(mockData);

            // First call
            await cachedFetch('test-key', fetchFn, 1000);

            // Second call (should use cache)
            const result = await cachedFetch('test-key', fetchFn, 1000);

            expect(result).toEqual(mockData);
            expect(fetchFn).toHaveBeenCalledTimes(1); // Only called once
        });

        it('should refetch after TTL expires', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetchFn = jest.fn().mockResolvedValue(mockData);

            // First call
            await cachedFetch('test-key', fetchFn, 100); // 100ms TTL

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Second call (should refetch)
            await cachedFetch('test-key', fetchFn, 100);

            expect(fetchFn).toHaveBeenCalledTimes(2);
        });

        it('should handle fetch errors', async () => {
            const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'));

            await expect(
                cachedFetch('test-key', fetchFn, 1000)
            ).rejects.toThrow('Fetch failed');
        });

        it('should not cache errors', async () => {
            const fetchFn = jest.fn()
                .mockRejectedValueOnce(new Error('First fail'))
                .mockResolvedValueOnce({ success: true });

            // First call fails
            await expect(
                cachedFetch('test-key', fetchFn, 1000)
            ).rejects.toThrow('First fail');

            // Second call should retry (not use cached error)
            const result = await cachedFetch('test-key', fetchFn, 1000);
            expect(result).toEqual({ success: true });
            expect(fetchFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('invalidateCache', () => {
        it('should invalidate specific cache key', async () => {
            const mockData = { id: 1 };
            const fetchFn = jest.fn().mockResolvedValue(mockData);

            // Cache data
            await cachedFetch('test-key', fetchFn, 1000);

            // Invalidate
            invalidateCache('test-key');

            // Should refetch
            await cachedFetch('test-key', fetchFn, 1000);
            expect(fetchFn).toHaveBeenCalledTimes(2);
        });

        it('should invalidate by pattern', async () => {
            const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

            // Cache multiple keys
            await cachedFetch('user:123:profile', fetchFn, 1000);
            await cachedFetch('user:123:settings', fetchFn, 1000);
            await cachedFetch('user:456:profile', fetchFn, 1000);

            // Invalidate pattern
            invalidateCache(/^user:123:/);

            // Should refetch user:123 keys
            await cachedFetch('user:123:profile', fetchFn, 1000);
            await cachedFetch('user:123:settings', fetchFn, 1000);

            // Should use cache for user:456
            await cachedFetch('user:456:profile', fetchFn, 1000);

            expect(fetchFn).toHaveBeenCalledTimes(5); // 3 initial + 2 refetch
        });
    });

    describe('clearCache', () => {
        it('should clear all cached data', async () => {
            const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

            // Cache multiple keys
            await cachedFetch('key1', fetchFn, 1000);
            await cachedFetch('key2', fetchFn, 1000);

            // Clear all
            clearCache();

            // Should refetch all
            await cachedFetch('key1', fetchFn, 1000);
            await cachedFetch('key2', fetchFn, 1000);

            expect(fetchFn).toHaveBeenCalledTimes(4); // 2 initial + 2 refetch
        });
    });

    describe('LRU Eviction', () => {
        it('should evict least recently used items when cache is full', async () => {
            const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

            // Fill cache beyond limit (limit is 1000)
            for (let i = 0; i < 1050; i++) {
                await cachedFetch(`key-${i}`, fetchFn, 10000);
            }

            // First keys should be evicted
            await cachedFetch('key-0', fetchFn, 10000);

            // Should have refetched (was evicted)
            expect(fetchFn).toHaveBeenCalledTimes(1051);
        });
    });
});
