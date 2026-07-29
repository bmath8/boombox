/**
 * Rate Limiter Utility
 * Implements sliding window rate limiting for WebSocket messages
 */

class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map(); // Map<key, timestamp[]>
        this.cleanupInterval = null;
        
        // Auto-cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    
    /**
     * Check if request is allowed
     * @param {string} key - Unique identifier (userId, IP, etc.)
     * @returns {boolean} - True if allowed, false if rate limited
     */
    isAllowed(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        
        // Remove old requests outside the time window
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        // Check if limit exceeded
        if (validRequests.length >= this.maxRequests) {
            // Update with current valid requests
            this.requests.set(key, validRequests);
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }
    
    /**
     * Get remaining requests for a key
     * @param {string} key - Unique identifier
     * @returns {number} - Number of requests remaining
     */
    getRemaining(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.windowMs
        );
        return Math.max(0, this.maxRequests - validRequests.length);
    }
    
    /**
     * Get time until reset for a key
     * @param {string} key - Unique identifier
     * @returns {number} - Milliseconds until reset
     */
    getResetTime(key) {
        const userRequests = this.requests.get(key) || [];
        if (userRequests.length === 0) return 0;
        
        const oldestRequest = Math.min(...userRequests);
        const resetTime = oldestRequest + this.windowMs;
        return Math.max(0, resetTime - Date.now());
    }
    
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, requests] of this.requests.entries()) {
            const validRequests = requests.filter(
                timestamp => now - timestamp < this.windowMs
            );
            
            if (validRequests.length === 0) {
                this.requests.delete(key);
                cleanedCount++;
            } else {
                this.requests.set(key, validRequests);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Rate limiter cleanup: removed ${cleanedCount} expired entries`);
        }
    }
    
    /**
     * Reset rate limit for a specific key
     * @param {string} key - Unique identifier
     */
    reset(key) {
        this.requests.delete(key);
    }
    
    /**
     * Get statistics
     * @returns {Object} - Stats about the rate limiter
     */
    getStats() {
        return {
            trackedKeys: this.requests.size,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs,
        };
    }
    
    /**
     * Destroy the rate limiter and cleanup
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.requests.clear();
    }
}

module.exports = RateLimiter;
