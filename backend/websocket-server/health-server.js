/**
 * Health Check HTTP Server for WebSocket Service
 * Provides health status endpoint for monitoring
 */

const http = require('http');

const HEALTH_PORT = process.env.HEALTH_PORT || 8081;

// Health status
let healthStatus = {
    status: 'healthy',
    uptime: 0,
    connections: 0,
    messagesProcessed: 0,
    lastCheck: new Date().toISOString(),
};

/**
 * Update health status
 */
function updateHealthStatus(stats) {
    healthStatus = {
        ...healthStatus,
        ...stats,
        uptime: Math.floor(process.uptime()),
        lastCheck: new Date().toISOString(),
    };
}

/**
 * Health check HTTP server
 */
const healthServer = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/health' && req.method === 'GET') {
        // Return health status
        const status = healthStatus.status === 'healthy' ? 200 : 503;

        res.writeHead(status);
        res.end(JSON.stringify({
            status: healthStatus.status,
            uptime: healthStatus.uptime,
            timestamp: new Date().toISOString(),
            connections: healthStatus.connections,
            messagesProcessed: healthStatus.messagesProcessed,
            lastCheck: healthStatus.lastCheck,
            version: '1.0.0',
            node: process.version,
        }));
    } else if (req.url === '/ready' && req.method === 'GET') {
        // Readiness check - is service ready to accept traffic?
        const isReady = healthStatus.status === 'healthy';
        const status = isReady ? 200 : 503;

        res.writeHead(status);
        res.end(JSON.stringify({
            ready: isReady,
            timestamp: new Date().toISOString(),
        }));
    } else if (req.url === '/live' && req.method === 'GET') {
        // Liveness check - is service alive?
        res.writeHead(200);
        res.end(JSON.stringify({
            alive: true,
            timestamp: new Date().toISOString(),
        }));
    } else {
        // Not found
        res.writeHead(404);
        res.end(JSON.stringify({
            error: 'Not found',
        }));
    }
});

/**
 * Start health check server
 */
function startHealthServer() {
    healthServer.listen(HEALTH_PORT, () => {
        console.log(`✅ Health check server listening on port ${HEALTH_PORT}`);
        console.log(`   Health: http://localhost:${HEALTH_PORT}/health`);
        console.log(`   Ready:  http://localhost:${HEALTH_PORT}/ready`);
        console.log(`   Live:   http://localhost:${HEALTH_PORT}/live`);
    });
}

/**
 * Graceful shutdown
 */
function stopHealthServer() {
    return new Promise((resolve) => {
        healthServer.close(() => {
            console.log('Health check server stopped');
            resolve();
        });
    });
}

module.exports = {
    startHealthServer,
    stopHealthServer,
    updateHealthStatus,
};
