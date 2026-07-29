import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        jest.useFakeTimers();
        limiter = new RateLimiter({
            interval: 1000, // 1 second
            uniqueTokenPerInterval: 10
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should allow requests within limit', async () => {
        const token = 'user-1';
        await expect(limiter.check(2, token)).resolves.toBeUndefined();
        await expect(limiter.check(2, token)).resolves.toBeUndefined();
    });

    it('should block requests exceeding limit', async () => {
        const token = 'user-2';
        await expect(limiter.check(1, token)).resolves.toBeUndefined();
        await expect(limiter.check(1, token)).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset limit after interval', async () => {
        const token = 'user-3';
        await expect(limiter.check(1, token)).resolves.toBeUndefined();
        await expect(limiter.check(1, token)).rejects.toThrow('Rate limit exceeded');

        // Advance time by 1 second + buffer
        jest.advanceTimersByTime(1100);

        // Should be allowed again
        await expect(limiter.check(1, token)).resolves.toBeUndefined();
    });

    it('should track multiple tokens independently', async () => {
        await expect(limiter.check(1, 'user-A')).resolves.toBeUndefined();
        await expect(limiter.check(1, 'user-B')).resolves.toBeUndefined();

        await expect(limiter.check(1, 'user-A')).rejects.toThrow('Rate limit exceeded');
        // User B should still be allowed if limit was > 1, but here limit is 1 per call check
        // Let's test with limit 1
    });
});
