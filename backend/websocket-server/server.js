/**
 * FAM Music WebSocket Server
 * Production-ready with Redis Pub/Sub for horizontal scaling
 * Includes: Heartbeat monitoring, connection health, rate limiting
 */

require('dotenv').config();
const WebSocket = require('ws');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { startHealthServer, updateHealthStatus } = require('./health-server');
const db = require('./db');
const RedisRateLimiter = require('./utils/redis-rate-limiter');

// ============================================================================
// CONFIGURATION & VALIDATION
// ============================================================================

// Validate required environment variables on startup
function validateEnv() {
    const required = ['JWT_SECRET', 'REDIS_URL'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('Please set these in your .env file');
        process.exit(1);
    }

    // Validate JWT secret strength in production
    if (process.env.NODE_ENV === 'production') {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret.length < 32) {
            console.error('❌ JWT_SECRET must be at least 32 characters in production');
            process.exit(1);
        }
        if (jwtSecret.includes('change') || jwtSecret.includes('secret-key')) {
            console.error('❌ JWT_SECRET appears to be a default value. Use a strong random secret.');
            process.exit(1);
        }
    }

    console.log('✅ Environment variables validated');
}

validateEnv();

const PORT = process.env.WS_PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET; // No fallback - validated above
const REDIS_URL = process.env.REDIS_URL;

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 35000;  // 35 seconds
const MESSAGE_RATE_LIMIT = 100;   // messages per minute per user
const MAX_MESSAGE_SIZE = 10240;   // 10KB max message size


// ============================================================================
// REDIS SETUP (Pub/Sub for horizontal scaling)
// ============================================================================

// Separate Redis clients for pub/sub (best practice)
const publisher = new Redis(REDIS_URL, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

const subscriber = new Redis(REDIS_URL, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Subscribe to channels
subscriber.subscribe('radio-updates', 'feed-updates', 'notifications');

subscriber.on('error', (err) => {
    console.error('Redis Subscriber Error:', err);
});

publisher.on('error', (err) => {
    console.error('Redis Publisher Error:', err);
});

// ============================================================================
// WEBSOCKET SERVER SETUP
// ============================================================================

const wss = new WebSocket.Server({
    port: PORT,
    // Enable per-message compression (60-80% bandwidth reduction)
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024 // Only compress messages > 1KB
    },
    // Verify origin to prevent CSRF attacks
    verifyClient: (info, callback) => {
        const origin = info.origin;
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

        // In development, allow localhost
        if (process.env.NODE_ENV !== 'production') {
            const isLocalhost = origin && (
                origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1')
            );

            if (isLocalhost) {
                return callback(true);
            }
        }

        // Check if origin is in allowed list
        if (origin && allowedOrigins.includes(origin)) {
            callback(true);
        } else {
            console.warn(`❌ Rejected WebSocket connection from unauthorized origin: ${origin}`);
            callback(false, 403, 'Origin not allowed');
        }
    }
});

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

// Map of userId -> WebSocket connection
const clients = new Map();

// Redis Rate Limiter
// Reuse publisher connection for rate limiting commands
const rateLimiter = new RedisRateLimiter(publisher, MESSAGE_RATE_LIMIT, 60000);

// ============================================================================
// AUTHENTICATION
// ============================================================================

function authenticateUser(req) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            throw new Error('No token provided');
        }

        // Supabase signs access tokens with the project's JWT secret and puts the
        // user id in the STANDARD `sub` claim -- there is no `userId` claim. Prefer
        // SUPABASE_JWT_SECRET (server-local.js:110 already did this correctly); keep
        // JWT_SECRET as the fallback so existing deployments don't break.
        const secret = process.env.SUPABASE_JWT_SECRET || JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        // Fail CLOSED. Previously this returned `decoded.userId`, which is always
        // undefined for a Supabase token. That silently keyed every connection in the
        // `clients` map under the same `undefined` bucket, so one user received other
        // users' private messages and everyone shared a single rate-limit bucket.
        // An unidentifiable token must be rejected, never mapped to a shared identity.
        if (!decoded || !decoded.sub) {
            throw new Error('Invalid token structure (no sub claim)');
        }
        return decoded.sub;
    } catch (error) {
        throw new Error('Authentication failed: ' + error.message);
    }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(userId) {
    return await rateLimiter.isAllowed(userId);
}

// ============================================================================
// HEARTBEAT / PING-PONG (Connection Health Monitoring)
// ============================================================================

function heartbeat() {
    this.isAlive = true;
}

// Ping all clients every 30 seconds
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`Terminating dead connection for user: ${ws.userId}`);
            clients.delete(ws.userId);
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, HEARTBEAT_INTERVAL);

// ============================================================================
// REDIS MESSAGE HANDLER (Receive from other server instances)
// ============================================================================

subscriber.on('message', (channel, message) => {
    try {
        const data = JSON.parse(message);

        switch (channel) {
            case 'radio-updates':
                broadcastToUsers(data.targetUsers, data.payload);
                break;

            case 'feed-updates':
                broadcastToUsers(data.targetUsers, data.payload);
                break;

            case 'notifications':
                broadcastToUsers([data.userId], data.payload);
                break;

            default:
                console.warn(`Unknown channel: ${channel}`);
        }
    } catch (error) {
        console.error('Error processing Redis message:', error);
    }
});

// ============================================================================
// BROADCAST FUNCTIONS
// ============================================================================

function broadcastToUsers(userIds, payload) {
    if (!Array.isArray(userIds)) {
        userIds = [userIds];
    }

    const message = JSON.stringify(payload);

    userIds.forEach(userId => {
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function broadcastToStation(stationId, payload, excludeUserId = null) {
    const message = JSON.stringify(payload);

    clients.forEach((client, userId) => {
        if (client.currentStation === stationId && userId !== excludeUserId) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });
}

function broadcastToAll(payload) {
    const message = JSON.stringify(payload);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

const messageHandlers = {
    // Join a radio station
    'radio:join': async (ws, data) => {
        ws.currentStation = data.stationId;

        // Publish to Redis (reaches all server instances)
        await publisher.publish('radio-updates', JSON.stringify({
            targetUsers: [ws.userId],
            payload: {
                type: 'radio:joined',
                stationId: data.stationId,
                timestamp: Date.now()
            }
        }));

        // Notify other listeners in the station
        broadcastToStation(data.stationId, {
            type: 'radio:listener-joined',
            userId: ws.userId,
            listenerCount: getStationListenerCount(data.stationId)
        }, ws.userId);
    },

    // Leave a radio station
    'radio:leave': async (ws, data) => {
        const stationId = ws.currentStation;
        ws.currentStation = null;

        if (stationId) {
            broadcastToStation(stationId, {
                type: 'radio:listener-left',
                userId: ws.userId,
                listenerCount: getStationListenerCount(stationId)
            });
        }
    },

    // Broadcast track change (from broadcaster)
    'radio:track-change': async (ws, data) => {
        if (!(await assertIsBroadcaster(ws, data.stationId, 'radio:track-change'))) return;
        await publisher.publish('radio-updates', JSON.stringify({
            targetUsers: getStationListeners(data.stationId),
            payload: {
                type: 'radio:track-change',
                stationId: data.stationId,
                track: data.track,
                timestamp: Date.now()
            }
        }));
    },

    // Broadcast playback position update
    'radio:position-update': async (ws, data) => {
        if (!(await assertIsBroadcaster(ws, data.stationId, 'radio:position-update'))) return;
        await publisher.publish('radio-updates', JSON.stringify({
            targetUsers: getStationListeners(data.stationId),
            payload: {
                type: 'radio:position-update',
                stationId: data.stationId,
                positionMs: data.positionMs,
                timestamp: Date.now()
            }
        }));
    },

    // Send chat message
    'radio:chat': async (ws, data) => {
        const { validateChatMessage, sanitizeChatMessage } = require('./sanitize');

        // Validate message
        const validation = validateChatMessage(data.message, 500);
        if (!validation.valid) {
            return ws.send(JSON.stringify({
                type: 'error',
                message: validation.error
            }));
        }

        // Sanitize message to prevent XSS
        const sanitizedMessage = sanitizeChatMessage(data.message);

        // Log potential security issue if sanitization changed content significantly
        if (sanitizedMessage !== data.message) {
            console.warn('Chat message sanitized', {
                userId: ws.userId,
                original: data.message.substring(0, 100),
                sanitized: sanitizedMessage.substring(0, 100),
            });
        }

        await publisher.publish('radio-updates', JSON.stringify({
            targetUsers: getStationListeners(data.stationId),
            payload: {
                type: 'radio:chat',
                stationId: data.stationId,
                userId: ws.userId,
                message: sanitizedMessage, // Use sanitized message
                timestamp: Date.now()
            }
        }));
    },

    // Request a song
    'radio:song-request': async (ws, data) => {
        // Publish to broadcaster only
        const broadcaster = getStationBroadcaster(data.stationId);

        await publisher.publish('radio-updates', JSON.stringify({
            targetUsers: [broadcaster],
            payload: {
                type: 'radio:song-request',
                stationId: data.stationId,
                requesterId: ws.userId,
                track: data.track,
                timestamp: Date.now()
            }
        }));
    },

    // Update feed (new listening activity)
    'feed:update': async (ws, data) => {
        // Get user's friends
        const friends = await getUserFriends(ws.userId);

        await publisher.publish('feed-updates', JSON.stringify({
            targetUsers: friends,
            payload: {
                type: 'feed:new-activity',
                userId: ws.userId,
                activity: data.activity,
                timestamp: Date.now()
            }
        }));
    },

    // Heartbeat from client
    'ping': (ws, data) => {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStationListenerCount(stationId) {
    let count = 0;
    clients.forEach((client) => {
        if (client.currentStation === stationId) {
            count++;
        }
    });
    return count;
}

function getStationListeners(stationId) {
    const listeners = [];
    clients.forEach((client, userId) => {
        if (client.currentStation === stationId) {
            listeners.push(userId);
        }
    });
    return listeners;
}

async function getStationBroadcaster(stationId) {
    try {
        const result = await db.query(
            'SELECT broadcaster_id FROM radio_stations WHERE station_id = $1',
            [stationId]
        );
        return result.rows.length > 0 ? result.rows[0].broadcaster_id : null;
    } catch (error) {
        console.error('Error fetching station broadcaster:', error);
        return null;
    }
}

/**
 * Authorization gate for station-control messages.
 *
 * `data.stationId` arrives straight from the client, and until 2026-07-28 the
 * radio:track-change / radio:position-update handlers trusted it outright. Any
 * authenticated user could therefore force every listener of ANY station onto a
 * track of their choosing, or scrub the whole audience's playhead. It was only
 * unexploitable because authenticateUser() was broken and nobody could connect --
 * fixing that bug is exactly what would have armed this one, so the two ship together.
 *
 * Fails CLOSED: getStationBroadcaster() returns null both for "no such station" and
 * for a DB error, and neither is a licence to broadcast.
 */
async function assertIsBroadcaster(ws, stationId, action) {
    if (!stationId || typeof stationId !== 'string') {
        ws.send(JSON.stringify({ type: 'error', message: `${action}: stationId is required` }));
        return false;
    }
    const broadcasterId = await getStationBroadcaster(stationId);
    if (!broadcasterId || broadcasterId !== ws.userId) {
        console.warn(`Rejected ${action} from ${ws.userId} for station ${stationId} (not the broadcaster)`);
        ws.send(JSON.stringify({ type: 'error', message: `${action}: not authorized for this station` }));
        return false;
    }
    return true;
}

async function getUserFriends(userId) {
    try {
        const result = await db.query(
            `SELECT friend_id FROM friendships 
             WHERE user_id = $1 AND status = 'accepted'
             UNION
             SELECT user_id FROM friendships 
             WHERE friend_id = $1 AND status = 'accepted'`,
            [userId]
        );
        return result.rows.map(row => row.friend_id || row.user_id);
    } catch (error) {
        console.error('Error fetching user friends:', error);
        return [];
    }
}

// ============================================================================
// CONNECTION HANDLER
// ============================================================================

wss.on('connection', (ws, req) => {
    let userId;

    try {
        // Authenticate user
        userId = authenticateUser(req);
        ws.userId = userId;
        ws.isAlive = true;
        ws.currentStation = null;

        // Store connection
        clients.set(userId, ws);

        console.log(`User connected: ${userId} (Total: ${clients.size})`);

        // Set up pong handler
        ws.on('pong', heartbeat);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            userId: userId,
            timestamp: Date.now()
        }));

    } catch (error) {
        console.error('Authentication error:', error.message);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication failed'
        }));
        ws.close(1008, 'Authentication failed');
        return;
    }

    // ============================================================================
    // MESSAGE HANDLER
    // ============================================================================

    ws.on('message', async (message) => {
        try {
            // Check message size
            if (message.length > MAX_MESSAGE_SIZE) {
                return ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Message too large'
                }));
            }

            // Check rate limit
            const isAllowed = await checkRateLimit(userId);
            if (!isAllowed) {
                return ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Rate limit exceeded. Please slow down.'
                }));
            }

            // Parse message
            const data = JSON.parse(message);

            // Route to handler
            const handler = messageHandlers[data.type];
            if (handler) {
                await handler(ws, data);
            } else {
                console.warn(`Unknown message type: ${data.type}`);
            }

        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    // ============================================================================
    // CLOSE HANDLER
    // ============================================================================

    ws.on('close', () => {
        console.log(`User disconnected: ${userId} (Total: ${clients.size - 1})`);

        // Leave current station if any
        if (ws.currentStation) {
            broadcastToStation(ws.currentStation, {
                type: 'radio:listener-left',
                userId: userId,
                listenerCount: getStationListenerCount(ws.currentStation) - 1
            });
        }

        // Remove from clients map
        clients.delete(userId);

        // Rate limit data is handled by Redis with TTL, no manual cleanup needed here
    });

    // ============================================================================
    // ERROR HANDLER
    // ============================================================================

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });
});

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

wss.on('listening', () => {
    console.log(`✅ WebSocket server listening on port ${PORT}`);
    console.log(`✅ Redis connected: ${REDIS_URL}`);
    console.log(`✅ Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);
    console.log(`✅ Message compression enabled`);

    // Start health check server
    startHealthServer();

    // Update health status periodically
    setInterval(() => {
        updateHealthStatus({
            status: 'healthy',
            connections: clients.size,
        });
    }, 10000); // Update every 10 seconds
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');

    clearInterval(heartbeatInterval);

    wss.close(() => {
        console.log('WebSocket server closed');
        publisher.quit();
        subscriber.quit();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');

    clearInterval(heartbeatInterval);

    wss.close(() => {
        console.log('WebSocket server closed');
        publisher.quit();
        subscriber.quit();
        process.exit(0);
    });
});

// Health check server is now handled by health-server.js module
// See health-server.js for implementation

// ============================================================================
// EXPORTS (for testing)
// ============================================================================

module.exports = {
    wss,
    clients,
    broadcastToUsers,
    broadcastToStation,
    broadcastToAll
};
