/**
 * Health Check Service
 * Monitors all system components
 */

const express = require('express');
const { Client } = require('pg');
const Redis = require('ioredis');
const app = express();

const PORT = process.env.HEALTH_PORT || 9000;

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

async function checkDatabase() {
    const start = Date.now();
    try {
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        await client.query('SELECT 1');
        await client.end();

        return {
            status: 'ok',
            latency: `${Date.now() - start}ms`,
            message: 'Database connection successful'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

async function checkRedis() {
    const start = Date.now();
    try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        await redis.quit();

        return {
            status: 'ok',
            latency: `${Date.now() - start}ms`,
            message: 'Redis connection successful'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

async function checkWebSocket() {
    try {
        const response = await fetch(`http://localhost:${process.env.WS_PORT + 1}/health`);
        const data = await response.json();

        return {
            status: data.status === 'healthy' ? 'ok' : 'degraded',
            connections: data.connections,
            uptime: data.uptime,
            message: 'WebSocket server responding'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

async function checkN8N() {
    try {
        const response = await fetch(`${process.env.N8N_URL}/healthz`);

        return {
            status: response.ok ? 'ok' : 'error',
            message: response.ok ? 'n8n responding' : 'n8n not responding'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

async function checkDiskSpace() {
    const { execSync } = require('child_process');
    try {
        const output = execSync('df -h /').toString();
        const lines = output.split('\n');
        const data = lines[1].split(/\s+/);
        const usedPercent = parseInt(data[4]);

        return {
            status: usedPercent < 90 ? 'ok' : 'warning',
            used: data[2],
            available: data[3],
            usedPercent: `${usedPercent}%`,
            message: usedPercent < 90 ? 'Disk space healthy' : 'Disk space running low'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

function checkMemory() {
    const used = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(2);

    return {
        status: usedPercent < 90 ? 'ok' : 'warning',
        process: {
            rss: `${(used.rss / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        system: {
            total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
            free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
            usedPercent: `${usedPercent}%`
        },
        message: usedPercent < 90 ? 'Memory healthy' : 'Memory usage high'
    };
}

// ============================================================================
// ENDPOINTS
// ============================================================================

app.get('/health', async (req, res) => {
    const checks = {
        database: await checkDatabase(),
        redis: await checkRedis(),
        websocket: await checkWebSocket(),
        n8n: await checkN8N(),
        disk: await checkDiskSpace(),
        memory: checkMemory()
    };

    const isHealthy = Object.values(checks).every(c => c.status === 'ok' || c.status === 'warning');
    const hasWarnings = Object.values(checks).some(c => c.status === 'warning');

    const status = isHealthy ? (hasWarnings ? 'degraded' : 'healthy') : 'unhealthy';

    res.status(isHealthy ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks
    });
});

app.get('/health/live', (req, res) => {
    // Kubernetes liveness probe
    res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
    // Kubernetes readiness probe
    const dbCheck = await checkDatabase();
    const redisCheck = await checkRedis();

    const isReady = dbCheck.status === 'ok' && redisCheck.status === 'ok';

    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not ready',
        database: dbCheck.status,
        redis: redisCheck.status
    });
});

app.get('/metrics', async (req, res) => {
    // Prometheus-compatible metrics
    const checks = {
        database: await checkDatabase(),
        redis: await checkRedis(),
        websocket: await checkWebSocket()
    };

    const metrics = `
# HELP fam_music_health_status Health status of components (1=ok, 0=error)
# TYPE fam_music_health_status gauge
fam_music_health_status{component="database"} ${checks.database.status === 'ok' ? 1 : 0}
fam_music_health_status{component="redis"} ${checks.redis.status === 'ok' ? 1 : 0}
fam_music_health_status{component="websocket"} ${checks.websocket.status === 'ok' ? 1 : 0}

# HELP fam_music_uptime_seconds Uptime in seconds
# TYPE fam_music_uptime_seconds counter
fam_music_uptime_seconds ${process.uptime()}

# HELP fam_music_memory_usage_bytes Memory usage in bytes
# TYPE fam_music_memory_usage_bytes gauge
fam_music_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
fam_music_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
fam_music_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}

# HELP fam_music_websocket_connections Active WebSocket connections
# TYPE fam_music_websocket_connections gauge
fam_music_websocket_connections ${checks.websocket.connections || 0}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`✅ Health check service running on port ${PORT}`);
    console.log(`   GET /health - Full health check`);
    console.log(`   GET /health/live - Liveness probe`);
    console.log(`   GET /health/ready - Readiness probe`);
    console.log(`   GET /metrics - Prometheus metrics`);
});

module.exports = app;
