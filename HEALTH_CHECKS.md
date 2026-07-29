# Health Check Endpoints

## Overview

Health check endpoints for monitoring system status and uptime.

---

## Endpoints

### Frontend Health Check

**URL**: `GET /api/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T19:59:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": "45ms",
      "error": null
    },
    "application": {
      "status": "up",
      "version": "1.0.0",
      "environment": "production"
    }
  },
  "uptime": 3600.5
}
```

**Response** (503 Service Unavailable):
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-29T19:59:00.000Z",
  "checks": {
    "database": {
      "status": "down",
      "responseTime": "5000ms",
      "error": "Connection timeout"
    }
  }
}
```

### WebSocket Server Health Check

**URL**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T19:59:00.000Z",
  "uptime": 3600.5,
  "connections": 42,
  "activeStations": 5,
  "version": "1.0.0"
}
```

---

## Usage

### Manual Testing

```bash
# Frontend
curl https://your-app.vercel.app/api/health

# WebSocket Server
curl https://your-ws-server.railway.app/health
```

### Monitoring Integration

**UptimeRobot**:
1. Add new monitor
2. Monitor Type: HTTP(s)
3. URL: `https://your-app.vercel.app/api/health`
4. Monitoring Interval: 5 minutes

**Better Uptime**:
1. Create new monitor
2. URL: `https://your-app.vercel.app/api/health`
3. Expected status: 200
4. Check interval: 1 minute

**Vercel Monitoring** (built-in):
- Automatically monitors all deployments
- View in Dashboard → Monitoring

---

## Alerts

Set up alerts for:
- ❌ Status code != 200
- ❌ Response time > 5 seconds
- ❌ Database status = "down"
- ❌ Uptime < 60 seconds (recent restart)

---

## Next Steps

1. ✅ Health endpoints created
2. ⏳ Set up monitoring service
3. ⏳ Configure alerts
4. ⏳ Add to status page
