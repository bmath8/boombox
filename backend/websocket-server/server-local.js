// Load .env from current directory first (priority)
require('dotenv').config();
// Optional: also try loading from root or frontend if needed, but local .env is enough now.
// require('dotenv').config({ path: '../../.env.local' });
const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'debug_log.txt');

function logDebug(msg) {
    const logLine = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(logPath, logLine);
        console.log(`[DEBUG] ${msg}`); // Also print to console
    } catch (e) { console.error('Log failed', e); }
}

const PORT = process.env.WS_PORT || 3001;
const HEARTBEAT_INTERVAL = 30000;

// Client and Station tracking
const clients = new Map(); // userId -> Set of WebSocket connections
const stations = new Map(); // stationId -> Set of userIds

// Generate unique IDs
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Heartbeat function for connection keep-alive
function heartbeat() {
    this.isAlive = true;
}

// Rate limiting
const RateLimiter = require('./utils/rate-limiter');
const chatLimiter = new RateLimiter(10, 10000);      // 10 messages per 10 seconds
const positionLimiter = new RateLimiter(5, 1000);    // 5 updates per second
const reactionLimiter = new RateLimiter(20, 60000);  // 20 reactions per minute
const generalLimiter = new RateLimiter(100, 60000);  // 100 general messages per minute

// Message size limits
const MESSAGE_LIMITS = {
    maxSize: 10 * 1024,        // 10KB
    maxChatLength: 500,        // 500 characters
};


const server = http.createServer((req, res) => {
    // Health check
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }
    res.writeHead(200);
    res.end('WebSocket Server Running');
});

const wss = new WebSocket.Server({ server });

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WebSocket Server running on port ${PORT}`);
    // Create log file immediately to prove server is up
    logDebug('Server started on 0.0.0.0');
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`❌ Terminating inactive connection: ${ws.userId}`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
    clearInterval(interval);
});

// Connection handler
wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    logDebug(`New connection attempt from ${req.socket.remoteAddress}`);

    // Extract token from query params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    logDebug(`Token received: ${token ? 'YES (Length: ' + token.length + ')' : 'NO'}`);

    if (!token) {
        console.log('❌ Connection rejected: No token provided');
        ws.close(1008, 'Token required');
        return;
    }

    // Verify token
    try {
        const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

        let decoded;

        // EMERGENCY DEV BYPASS: If we don't have the real Supabase Secret, skip verification locally
        if (process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development') {
            console.log('⚠️  DEV MODE: Skipping strict JWT verification. Using mock ID.');
            // Use a mock ID or try to decode without verify if possible, or just trust it
            // For safety, let's just use the token string itself as ID if it's short, or a random one
            ws.userId = 'dev-user-' + Math.floor(Math.random() * 10000);
            // If we can decode the sub from the token without verifying signature, even better:
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    if (payload.sub) ws.userId = payload.sub;
                }
            } catch (e) { /* ignore */ }
            decoded = { sub: ws.userId };
        } else {
            if (!secret) {
                console.error('❌ CRITICAL: No JWT secret configured!');
                ws.close(1011, 'Server configuration error');
                return;
            }
            decoded = jwt.verify(token, secret);
        }

        if (!decoded || !decoded.sub) {
            throw new Error('Invalid token structure');
        }

        ws.userId = decoded.sub;
        ws.id = uuidv4();

        // Connection throttling (max 10 connections per user in dev mode)
        if (clients.has(ws.userId) && clients.get(ws.userId).size >= 10) {
            console.log(`❌ Connection limit exceeded for ${ws.userId}`);
            ws.close(1008, 'Connection limit exceeded (max 10 connections)');
            return;
        }

        // Store client connection
        if (!clients.has(ws.userId)) {
            clients.set(ws.userId, new Set());
        }
        clients.get(ws.userId).add(ws);

        console.log(`✅ Client connected: ${ws.userId} (${clients.get(ws.userId).size} connections)`);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            userId: ws.userId,
            timestamp: Date.now()
        }));
        logDebug(`Auth Success for ${ws.userId}`);

    } catch (err) {
        console.log('❌ Connection rejected: Invalid token', err.message);
        ws.close(1008, 'Invalid token');
        return;
    }

    // Message handler with rate limiting and size validation
    ws.on('message', (data) => {
        try {
            // Message size limit
            if (data.length > MESSAGE_LIMITS.maxSize) {
                console.log(`❌ Message too large from ${ws.userId}: ${data.length} bytes`);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Message too large (max ${MESSAGE_LIMITS.maxSize / 1024}KB)`,
                    code: 'MESSAGE_TOO_LARGE'
                }));
                return;
            }

            const message = JSON.parse(data);

            // Select appropriate rate limiter based on message type
            let limiter;
            let limitDescription;

            switch (message.type) {
                case 'radio:chat':
                case 'radio:chat-message':
                    limiter = chatLimiter;
                    limitDescription = '10 messages per 10 seconds';

                    // Additional chat message length validation
                    if (message.content && message.content.length > MESSAGE_LIMITS.maxChatLength) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: `Chat message too long (max ${MESSAGE_LIMITS.maxChatLength} characters)`,
                            code: 'MESSAGE_TOO_LONG'
                        }));
                        return;
                    }
                    break;

                case 'radio:position-update':
                case 'radio:request-position':
                    limiter = positionLimiter;
                    limitDescription = '5 updates per second';
                    break;

                case 'radio:reaction':
                    limiter = reactionLimiter;
                    limitDescription = '20 reactions per minute';
                    break;

                default:
                    limiter = generalLimiter;
                    limitDescription = '100 messages per minute';
            }

            // Check rate limit
            if (!limiter.isAllowed(ws.userId)) {
                console.log(`❌ Rate limit exceeded for ${ws.userId} on ${message.type}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Rate limit exceeded (${limitDescription})`,
                    code: 'RATE_LIMIT_EXCEEDED',
                    messageType: message.type
                }));
                return;
            }

            handleMessage(ws, message);
        } catch (err) {
            console.error('❌ Invalid message format:', err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                code: 'INVALID_MESSAGE'
            }));
        }
    });

    // Disconnection handler
    ws.on('close', () => {
        console.log(`❌ Client disconnected: ${ws.userId}`);

        // Remove from clients map
        if (clients.has(ws.userId)) {
            clients.get(ws.userId).delete(ws);
            if (clients.get(ws.userId).size === 0) {
                clients.delete(ws.userId);
            }
        }

        // Remove from all stations
        stations.forEach((listeners, stationId) => {
            if (listeners.has(ws.userId)) {
                listeners.delete(ws.userId);
                broadcastToStation(stationId, {
                    type: 'radio:listener-left',
                    stationId,
                    userId: ws.userId,
                    listenerCount: listeners.size
                });
            }
        });
    });
});

// Message routing
function handleMessage(ws, message) {
    const { type, ...data } = message;

    switch (type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'radio:join':
            handleRadioJoin(ws, data);
            break;

        case 'radio:leave':
            handleRadioLeave(ws, data);
            break;

        case 'radio:chat-message':
            handleRadioChat(ws, data);
            break;

        case 'radio:reaction':
            handleRadioReaction(ws, data);
            break;

        case 'radio:song-request':
            handleSongRequest(ws, data);
            break;

        case 'radio:sync-data':
            handleSyncData(ws, data);
            break;

        case 'playlist:update':
            handlePlaylistUpdate(ws, data);
            break;

        case 'vote:update':
            handleVoteUpdate(ws, data);
            break;

        case 'presence:update':
            handlePresenceUpdate(ws, data);
            break;

        case 'voice:join':
            handleVoiceJoin(ws, data);
            break;

        case 'voice:leave':
            handleVoiceLeave(ws, data);
            break;

        case 'voice:speaking':
            handleVoiceSpeaking(ws, data);
            break;

        case 'voice:signal':
            handleVoiceSignal(ws, data);
            break;

        default:
            console.log(`⚠️  Unknown message type: ${type}`);
    }
}

// Radio: Join station
function handleRadioJoin(ws, data) {
    const { stationId } = data;

    if (!stations.has(stationId)) {
        stations.set(stationId, new Set());
    }

    stations.get(stationId).add(ws.userId);

    console.log(`📻 ${ws.userId} joined station ${stationId}`);

    // Broadcast to all listeners INCLUDING the one who just joined
    broadcastToStation(stationId, {
        type: 'radio:listener-joined',
        stationId,
        userId: ws.userId,
        listenerCount: stations.get(stationId).size
    }, null, true); // Include sender
}

// Radio: Leave station
function handleRadioLeave(ws, data) {
    const { stationId } = data;

    if (stations.has(stationId)) {
        stations.get(stationId).delete(ws.userId);

        console.log(`📻 ${ws.userId} left station ${stationId}`);

        broadcastToStation(stationId, {
            type: 'radio:listener-left',
            stationId,
            userId: ws.userId,
            listenerCount: stations.get(stationId).size
        });
    }
}

// Radio: Chat message
function handleRadioChat(ws, data) {
    const { stationId, message } = data;

    console.log(`💬 Chat in ${stationId}: ${message}`);

    broadcastToStation(stationId, {
        type: 'radio:chat-message',
        stationId,
        userId: ws.userId,
        message,
        timestamp: Date.now()
    }, null, true); // Include sender
}

// Radio: Reaction
function handleRadioReaction(ws, data) {
    const { stationId, emoji } = data;

    console.log(`❤️  Reaction in ${stationId}: ${emoji}`);

    broadcastToStation(stationId, {
        type: 'radio:reaction',
        stationId,
        userId: ws.userId,
        emoji,
        timestamp: Date.now()
    }, null, true); // Include sender
}

// Radio: Song request
function handleSongRequest(ws, data) {
    const { stationId, track } = data;

    console.log(`🎵 Song request in ${stationId}: ${track.name}`);

    broadcastToStation(stationId, {
        type: 'radio:song-request',
        stationId,
        requesterId: ws.userId,
        track,
        timestamp: Date.now()
    }, null, true); // Include sender
}

// Radio: Sync data (broadcaster -> listeners)
function handleSyncData(ws, data) {
    const { stationId, trackId, positionMs } = data;

    broadcastToStation(stationId, {
        type: 'radio:sync-data',
        stationId,
        trackId,
        positionMs,
        timestamp: Date.now()
    }, ws.userId); // Exclude broadcaster
}

// Broadcast to all listeners in a station
function broadcastToStation(stationId, message, excludeUserId = null, includeSender = false) {
    if (!stations.has(stationId)) return;

    stations.get(stationId).forEach(userId => {
        if (!includeSender && userId === excludeUserId) return;

        if (clients.has(userId)) {
            clients.get(userId).forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            });
        }
    });
}

// Graceful shutdown


// Playlist: Update (add/remove/move track)
function handlePlaylistUpdate(ws, data) {
    const { stationId, action, track, queueId } = data;

    console.log(`🎵 Playlist update in ${stationId}: ${action}`);

    broadcastToStation(stationId, {
        type: 'playlist:update',
        stationId,
        action,
        track,
        queueId,
        userId: ws.userId,
        timestamp: Date.now()
    }, ws.userId); // Exclude sender (optimistic UI)
}

// Vote: Update
function handleVoteUpdate(ws, data) {
    const { stationId, trackId, voteType } = data;

    console.log(`🗳️ Vote in ${stationId}: ${voteType} for ${trackId}`);

    broadcastToStation(stationId, {
        type: 'vote:update',
        stationId,
        trackId,
        voteType,
        userId: ws.userId,
        timestamp: Date.now()
    }, null, true); // Include sender to confirm vote registered
}

// Presence: Update (typing, status)
function handlePresenceUpdate(ws, data) {
    const { stationId, status, isTyping } = data;

    // Only broadcast typing if it changes
    broadcastToStation(stationId, {
        type: 'presence:update',
        stationId,
        userId: ws.userId,
        status,
        isTyping,
        timestamp: Date.now()
    }, ws.userId);
}

// Voice: Join
function handleVoiceJoin(ws, data) {
    const { stationId, userName, avatar } = data;
    broadcastToStation(stationId, {
        type: 'voice:join',
        stationId,
        userId: ws.userId,
        userName,
        avatar,
        timestamp: Date.now()
    }, ws.userId, false);
}

// Voice: Leave
function handleVoiceLeave(ws, data) {
    const { stationId } = data;
    broadcastToStation(stationId, {
        type: 'voice:leave',
        stationId,
        userId: ws.userId,
        timestamp: Date.now()
    }, ws.userId);
}

// Voice: Speaking
function handleVoiceSpeaking(ws, data) {
    const { stationId, speaking } = data;
    broadcastToStation(stationId, {
        type: 'voice:speaking',
        stationId,
        userId: ws.userId,
        speaking,
        timestamp: Date.now()
    }, ws.userId);
}

// Voice: Signal (WebRTC)
function handleVoiceSignal(ws, data) {
    const { targetUserId, signal, stationId } = data;
    sendToUser(targetUserId, {
        type: 'voice:signal',
        stationId,
        signal,
        senderId: ws.userId,
        targetUserId,
        timestamp: Date.now()
    });
}

// Send to specific user
function sendToUser(targetUserId, message) {
    if (clients.has(targetUserId)) {
        clients.get(targetUserId).forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}
