# Monitoring Setup Guide

## Overview

Comprehensive monitoring stack for FAM Music using Prometheus, Grafana, and various exporters to track application performance, system health, and user metrics.

## Architecture

```
┌─────────────┐
│   Grafana   │ ← Visualize metrics and create dashboards
└──────┬──────┘
       │
       v
┌─────────────┐
│ Prometheus  │ ← Collect and store metrics
└──────┬──────┘
       │
       ├─→ Frontend (Next.js) /api/metrics
       ├─→ WebSocket Server /metrics
       ├─→ PostgreSQL Exporter
       ├─→ Redis Exporter
       ├─→ Node Exporter (system metrics)
       └─→ n8n /metrics
```

## Quick Start

### 1. Start Monitoring Stack

```bash
# Start Prometheus and Grafana
docker-compose --profile monitoring up -d

# Verify services
docker-compose ps
```

### 2. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/your-password)

### 3. Import Grafana Dashboards

1. Login to Grafana
2. Click "+" → "Import Dashboard"
3. Import pre-built dashboards:
   - Node Exporter: Dashboard ID `1860`
   - PostgreSQL: Dashboard ID `9628`
   - Redis: Dashboard ID `11835`

## Metrics Endpoints

### Frontend (Next.js)

**Endpoint**: `http://localhost:3000/api/metrics`

Metrics exposed:
- HTTP request duration
- Request count by status code
- Active connections
- Cache hit rate
- Supabase query duration

### WebSocket Server

**Endpoint**: `http://localhost:8081/metrics`

Metrics exposed:
- Active WebSocket connections
- Messages sent/received
- Message latency
- Connection duration
- Rate limit hits

### Database (PostgreSQL)

**Exporter**: `postgres_exporter`

Metrics exposed:
- Connection pool usage
- Query performance
- Table sizes
- Replication lag
- Transaction rate

### Cache (Redis)

**Exporter**: `redis_exporter`

Metrics exposed:
- Memory usage
- Hit rate
- Key count
- Command latency
- Eviction rate

## Key Metrics to Monitor

### Application Health

1. **Request Rate**
   ```promql
   rate(http_requests_total[5m])
   ```

2. **Error Rate**
   ```promql
   rate(http_requests_total{status=~"5.."}[5m])
   ```

3. **Response Time (P95)**
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

### WebSocket Performance

1. **Active Connections**
   ```promql
   websocket_connections_active
   ```

2. **Message Throughput**
   ```promql
   rate(websocket_messages_total[5m])
   ```

3. **Connection Duration (avg)**
   ```promql
   avg(websocket_connection_duration_seconds)
   ```

### Database Performance

1. **Query Duration (P95)**
   ```promql
   histogram_quantile(0.95, rate(pg_stat_statements_mean_exec_time_seconds[5m]))
   ```

2. **Connection Pool Usage**
   ```promql
   pg_stat_database_numbackends / pg_settings_max_connections * 100
   ```

3. **Cache Hit Ratio**
   ```promql
   sum(rate(pg_stat_database_blks_hit[5m])) /
   (sum(rate(pg_stat_database_blks_hit[5m])) + sum(rate(pg_stat_database_blks_read[5m])))
   ```

### Redis Performance

1. **Memory Usage**
   ```promql
   redis_memory_used_bytes / redis_memory_max_bytes * 100
   ```

2. **Cache Hit Rate**
   ```promql
   rate(redis_keyspace_hits_total[5m]) /
   (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))
   ```

3. **Command Latency**
   ```promql
   redis_commands_duration_seconds_total / redis_commands_processed_total
   ```

## Alerts Configuration

Create `deploy/alerts/application.yml`:

```yaml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanize }} errors/sec"

      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "P95 response time is {{ $value | humanize }}s"

      # Database connection pool exhaustion
      - alert: DatabasePoolExhaustion
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Connection pool usage is {{ $value | humanizePercentage }}"

      # Redis memory usage
      - alert: RedisHighMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
          description: "Redis is using {{ $value | humanizePercentage }} of available memory"

      # WebSocket connection surge
      - alert: WebSocketConnectionSurge
        expr: rate(websocket_connections_total[5m]) > 100
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Unusual WebSocket connection activity"
          description: "Connection rate is {{ $value | humanize }} connections/sec"
```

## Grafana Dashboard Configuration

### 1. Create Data Source

1. Navigate to Configuration → Data Sources
2. Add Prometheus
3. URL: `http://prometheus:9090`
4. Click "Save & Test"

### 2. Create Custom Dashboard

Create `deploy/grafana-dashboards/fam-music.json`:

```json
{
  "dashboard": {
    "title": "FAM Music Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "websocket_connections_active"
          }
        ]
      },
      {
        "title": "Database Queries/sec",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit[5m])"
          }
        ]
      }
    ]
  }
}
```

## Alerting Integrations

### Slack Integration

1. Create Slack webhook
2. Configure in Prometheus `alertmanager.yml`:

```yaml
route:
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Email Alerts

```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@fammusic.com'
        from: 'prometheus@fammusic.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'your-app-password'
```

## Custom Metrics

### Adding Metrics to Frontend

Create `src/app/api/metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server';

let requestCount = 0;
let errorCount = 0;

export async function GET() {
    const metrics = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{status="200"} ${requestCount}
http_requests_total{status="500"} ${errorCount}

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 200
http_request_duration_seconds_bucket{le="1.0"} 250
http_request_duration_seconds_bucket{le="+Inf"} 300
http_request_duration_seconds_sum 150
http_request_duration_seconds_count 300
`;

    return new NextResponse(metrics, {
        headers: {
            'Content-Type': 'text/plain; version=0.0.4',
        },
    });
}
```

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check logs
docker logs fam-music-prometheus
```

### Metrics Not Appearing

1. Verify endpoint is accessible:
   ```bash
   curl http://localhost:3000/api/metrics
   ```

2. Check Prometheus configuration:
   ```bash
   docker exec -it fam-music-prometheus cat /etc/prometheus/prometheus.yml
   ```

3. Reload configuration:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

### Grafana Not Connecting

1. Check Prometheus is running:
   ```bash
   docker ps | grep prometheus
   ```

2. Test connection:
   ```bash
   docker exec -it fam-music-grafana curl http://prometheus:9090/-/healthy
   ```

## Production Best Practices

1. **Retention Policy**: Configure Prometheus to retain data for 30 days
2. **Remote Write**: Set up long-term storage (Thanos, Cortex, or managed service)
3. **High Availability**: Run multiple Prometheus replicas
4. **Security**: Enable authentication on Grafana and Prometheus
5. **Backup**: Regularly backup Grafana dashboards and alerts
6. **Cost Optimization**: Use recording rules for expensive queries

## Useful Queries

### Top 10 Slowest Endpoints

```promql
topk(10,
  histogram_quantile(0.95,
    sum by(endpoint, le) (rate(http_request_duration_seconds_bucket[5m]))
  )
)
```

### Active Users Over Time

```promql
sum(websocket_connections_active)
```

### Database Size Growth

```promql
pg_database_size_bytes{datname="fam_music"}
```

### Memory Usage Trend

```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
```

## Next Steps

1. ✅ Start monitoring stack
2. ✅ Access Grafana and import dashboards
3. ✅ Configure alerts
4. ✅ Set up Slack/email notifications
5. ✅ Create custom dashboards for your KPIs
6. ✅ Set up on-call rotation
7. ✅ Document runbooks for common alerts

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Dashboard Gallery](https://grafana.com/grafana/dashboards/)
