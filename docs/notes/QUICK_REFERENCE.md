# FAM MUSIC V.3 - Quick Reference Guide

## 🚀 Quick Start

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 2. Start all services
docker-compose up -d

# 3. Initialize database
docker exec -i fam-music-db psql -U fammusic_app -d fam_music < database/schema.sql

# 4. Verify health
curl http://localhost:3000/api/health/advanced
```

## 📋 Essential Commands

### Docker Operations
```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart a service
docker-compose restart frontend

# View logs
docker-compose logs -f [service-name]

# Rebuild after code changes
docker-compose up -d --build

# Start with monitoring
docker-compose --profile monitoring up -d
```

### Database Operations
```bash
# Run migrations
psql -U fammusic_app -d fam_music -f database/schema.sql

# Create partitions
bash database/create-partitions.sh

# Backup database
pg_dump -U fammusic_app fam_music > backup_$(date +%Y%m%d).sql

# Restore database
psql -U fammusic_app -d fam_music < backup_YYYYMMDD.sql

# Check database size
psql -U fammusic_app -d fam_music -c "\l+"
```

### Frontend Operations
```bash
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check test coverage
npm run test:coverage

# Lint code
npm run lint

# Analyze bundle
npm run analyze
```

### Health Checks
```bash
# Basic health
curl http://localhost:3000/api/health

# Advanced health (all services)
curl http://localhost:3000/api/health/advanced

# WebSocket health
curl http://localhost:8081/health

# Prometheus
curl http://localhost:9090/-/healthy

# Database connection
psql -U fammusic_app -d fam_music -c "SELECT 1;"

# Redis connection
redis-cli ping
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (DO NOT COMMIT) |
| `.env.example` | Template for environment variables |
| `docker-compose.yml` | Service orchestration |
| `frontend/next.config.ts` | Next.js configuration |
| `database/schema.sql` | Database schema |
| `deploy/prometheus.yml` | Monitoring configuration |

## 🌐 Service URLs

| Service | Development | Production |
|---------|------------|------------|
| Frontend | http://localhost:3000 | https://yourdomain.com |
| WebSocket | ws://localhost:8080 | wss://ws.yourdomain.com |
| Health Check | http://localhost:8081 | N/A (internal) |
| Prometheus | http://localhost:9090 | http://your-server:9090 |
| Grafana | http://localhost:3001 | http://your-server:3001 |
| n8n | http://localhost:5678 | http://n8n.yourdomain.com |

## 📊 Key Metrics

### Application Performance
```bash
# Request rate (last 5 minutes)
curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total[5m])' | jq

# Error rate
curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq

# Active WebSocket connections
curl -s 'http://localhost:9090/api/v1/query?query=websocket_connections_active' | jq
```

### Database Performance
```bash
# Connection count
psql -U fammusic_app -d fam_music -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -U fammusic_app -d fam_music -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Database size
psql -U fammusic_app -d fam_music -c "SELECT pg_size_pretty(pg_database_size('fam_music'));"

# Table sizes
psql -U fammusic_app -d fam_music -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Redis Performance
```bash
# Memory usage
redis-cli INFO memory | grep used_memory_human

# Hit rate
redis-cli INFO stats | grep keyspace

# Connected clients
redis-cli INFO clients | grep connected_clients
```

## 🔑 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/fam_music

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8080
JWT_SECRET=your-64-char-secret

# Redis
REDIS_URL=redis://localhost:6379

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback/spotify
```

### Optional Variables
```bash
# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
GRAFANA_PASSWORD=your-grafana-password

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

## 🐛 Troubleshooting

### Frontend Won't Start
```bash
# Check node version (need 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules .next
npm install

# Check environment variables
cat .env | grep NEXT_PUBLIC
```

### WebSocket Connection Fails
```bash
# Check if server is running
curl http://localhost:8081/health

# Check Redis connection
redis-cli ping

# Check JWT secret is set
echo $JWT_SECRET

# View WebSocket logs
docker logs -f fam-music-websocket
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -U fammusic_app -d fam_music -c "SELECT 1;"

# Check connection pool
psql -U fammusic_app -d fam_music -c "SELECT count(*) FROM pg_stat_activity;"

# View database logs
docker logs -f fam-music-db
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Check Redis logs
docker logs -f fam-music-redis
```

### Monitoring Not Working
```bash
# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# Check Grafana data source
curl http://localhost:3001/api/datasources

# Restart monitoring stack
docker-compose --profile monitoring restart
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure allowed origins
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure Sentry
- [ ] Set up automated backups
- [ ] Enable audit logging
- [ ] Review RLS policies

## 📱 API Endpoints

### Health & Status
- `GET /api/health` - Basic health check
- `GET /api/health/advanced` - Detailed health status
- `GET /health` (WebSocket) - WebSocket server health
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Authentication
- `GET /auth/callback/spotify` - Spotify OAuth callback
- `POST /api/auth/logout` - Logout endpoint

### Spotify Integration
- `GET /api/spotify/playlists` - User playlists
- `GET /api/spotify/search` - Search tracks
- `GET /api/spotify/playlists/[id]/tracks` - Playlist tracks

## 🎯 Performance Tips

### Frontend
1. Use `next/image` for all images
2. Implement code splitting
3. Use server components where possible
4. Enable compression
5. Cache static assets
6. Use CDN for global distribution

### Backend
1. Use connection pooling (PgBouncer)
2. Implement caching (Redis)
3. Use database indexes
4. Enable query optimization
5. Use partitioned tables
6. Implement rate limiting

### Database
1. Regular VACUUM and ANALYZE
2. Use prepared statements
3. Monitor slow queries
4. Optimize indexes
5. Use materialized views
6. Archive old data

## 📚 Documentation

- **Quick Start**: `README.md`
- **Security**: `SECURITY.md`
- **Monitoring**: `MONITORING_SETUP.md`
- **Migrations**: `database/MIGRATION_GUIDE.md`
- **Rate Limiting**: `RATE_LIMITING.md`
- **Redis Migration**: `REDIS_RATE_LIMIT_MIGRATION.md`
- **Improvements**: `IMPROVEMENT_SUMMARY.md`

## 🆘 Getting Help

1. Check relevant documentation in the list above
2. View logs: `docker-compose logs -f`
3. Check health endpoints
4. Review error messages in Sentry
5. Consult Grafana dashboards
6. Review this quick reference guide

---

**Last Updated**: December 2024
**Version**: 3.0.0
**Status**: Production Ready ✅
