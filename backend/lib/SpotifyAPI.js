/**
 * Spotify API Wrapper with Rate Limiting and Multi-Tier Caching
 * Implements: Exponential backoff, request queuing, Redis caching
 */

const Redis = require('ioredis');

class SpotifyAPI {
    constructor(accessToken, options = {}) {
        this.accessToken = accessToken;
        this.requestQueue = [];
        this.isProcessing = false;
        this.requestsPerSecond = options.requestsPerSecond || 20; // Conservative limit
        this.redis = options.redis || new Redis(process.env.REDIS_URL);
        this.cacheTTL = options.cacheTTL || 86400; // 24 hours default
    }

    /**
     * Main request method with rate limiting and caching
     */
    async request(endpoint, options = {}) {
        // Check cache first
        if (options.cache !== false) {
            const cached = await this.getFromCache(endpoint, options);
            if (cached) {
                return cached;
            }
        }

        return new Promise((resolve, reject) => {
            this.requestQueue.push({ endpoint, options, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process request queue with rate limiting
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;

        this.isProcessing = true;
        const { endpoint, options, resolve, reject } = this.requestQueue.shift();

        try {
            const response = await this.makeRequest(endpoint, options);

            // Cache successful responses
            if (options.cache !== false && response) {
                await this.saveToCache(endpoint, options, response);
            }

            resolve(response);

        } catch (error) {
            reject(error);
        } finally {
            // Rate limit: wait between requests
            await new Promise(r => setTimeout(r, 1000 / this.requestsPerSecond));
            this.isProcessing = false;
            this.processQueue(); // Process next in queue
        }
    }

    /**
     * Make HTTP request with retry logic and exponential backoff
     */
    async makeRequest(endpoint, options = {}, attempt = 0) {
        const maxRetries = options.maxRetries || 5;

        try {
            const url = `https://api.spotify.com/v1${endpoint}`;
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            // Handle rate limiting (429)
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                console.log(`Rate limited. Retrying after ${retryAfter}s`);

                // Wait for retry-after duration
                await new Promise(r => setTimeout(r, retryAfter * 1000));

                // Retry the request
                return this.makeRequest(endpoint, options, attempt);
            }

            // Handle other errors
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`Spotify API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();

        } catch (error) {
            // Retry with exponential backoff for network errors
            if (attempt < maxRetries && this.isRetryableError(error)) {
                const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
                console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

                await new Promise(r => setTimeout(r, delay));
                return this.makeRequest(endpoint, options, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED'
        ];

        return retryableErrors.some(code => error.code === code || error.message.includes(code));
    }

    /**
     * Get data from cache
     */
    async getFromCache(endpoint, options) {
        const cacheKey = this.getCacheKey(endpoint, options);

        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Cache read error:', error);
        }

        return null;
    }

    /**
     * Save data to cache
     */
    async saveToCache(endpoint, options, data) {
        const cacheKey = this.getCacheKey(endpoint, options);
        const ttl = options.cacheTTL || this.cacheTTL;

        try {
            await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    /**
     * Generate cache key
     */
    getCacheKey(endpoint, options) {
        const params = options.params ? JSON.stringify(options.params) : '';
        return `spotify:${endpoint}:${params}`;
    }

    // ============================================================================
    // CONVENIENCE METHODS
    // ============================================================================

    /**
     * Get currently playing track
     */
    async getCurrentlyPlaying() {
        return this.request('/me/player/currently-playing', {
            cache: false // Don't cache real-time data
        });
    }

    /**
     * Get recently played tracks
     */
    async getRecentlyPlayed(limit = 50) {
        return this.request(`/me/player/recently-played?limit=${limit}`, {
            cacheTTL: 300 // Cache for 5 minutes
        });
    }

    /**
     * Get track details (heavily cached)
     */
    async getTrack(trackId) {
        return this.request(`/tracks/${trackId}`, {
            cacheTTL: 86400 // Cache for 24 hours
        });
    }

    /**
     * Get multiple tracks (batch request)
     */
    async getTracks(trackIds) {
        const ids = trackIds.join(',');
        return this.request(`/tracks?ids=${ids}`, {
            cacheTTL: 86400
        });
    }

    /**
     * Get audio features for track
     */
    async getAudioFeatures(trackId) {
        return this.request(`/audio-features/${trackId}`, {
            cacheTTL: 604800 // Cache for 7 days (rarely changes)
        });
    }

    /**
     * Get user's top tracks
     */
    async getTopTracks(timeRange = 'medium_term', limit = 50) {
        return this.request(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
            cacheTTL: 3600 // Cache for 1 hour
        });
    }

    /**
     * Get user's top artists
     */
    async getTopArtists(timeRange = 'medium_term', limit = 50) {
        return this.request(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
            cacheTTL: 3600
        });
    }

    /**
     * Search for tracks
     */
    async searchTracks(query, limit = 20) {
        const encodedQuery = encodeURIComponent(query);
        return this.request(`/search?q=${encodedQuery}&type=track&limit=${limit}`, {
            cacheTTL: 3600
        });
    }

    /**
     * Get user profile
     */
    async getUserProfile() {
        return this.request('/me', {
            cacheTTL: 3600
        });
    }

    /**
     * Start/Resume playback
     */
    async play(options = {}) {
        return this.request('/me/player/play', {
            method: 'PUT',
            body: options,
            cache: false
        });
    }

    /**
     * Pause playback
     */
    async pause() {
        return this.request('/me/player/pause', {
            method: 'PUT',
            cache: false
        });
    }

    /**
     * Seek to position
     */
    async seek(positionMs) {
        return this.request(`/me/player/seek?position_ms=${positionMs}`, {
            method: 'PUT',
            cache: false
        });
    }

    /**
     * Get playback state
     */
    async getPlaybackState() {
        return this.request('/me/player', {
            cache: false
        });
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken, clientId, clientSecret) {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            throw new Error('Failed to refresh access token');
        }

        const data = await response.json();
        this.accessToken = data.access_token;

        return data;
    }

    /**
     * Clear cache for specific endpoint
     */
    async clearCache(endpoint, options = {}) {
        const cacheKey = this.getCacheKey(endpoint, options);
        await this.redis.del(cacheKey);
    }

    /**
     * Clear all Spotify cache
     */
    async clearAllCache() {
        const keys = await this.redis.keys('spotify:*');
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
}

module.exports = SpotifyAPI;
