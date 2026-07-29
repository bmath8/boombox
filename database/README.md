# FAM MUSIC V.2 - Database Setup Guide

## Quick Start (Fresh Deployment)

For a **fresh database deployment**, use `schema.sql` as the single source of truth:

```bash
# Using Supabase CLI
supabase db reset

# Or using psql
psql -U postgres -d fammusic -f schema.sql
```

## Migration Strategy

### Current State
This directory contains **44 SQL files** from iterative development. For production, we use:

**Primary File**: `schema.sql` (638 lines)
- Complete database schema
- All tables, indexes, functions, triggers
- RLS policies
- Materialized views

### File Organization

```
database/
├── schema.sql              ← USE THIS for fresh deployments
├── migrations/             ← Future incremental changes
│   └── (empty - to be populated)
├── deprecated/             ← Old migration files (reference only)
│   ├── master_migration.sql
│   ├── simplified_migration.sql
│   └── ... (42 other files)
└── README.md              ← This file
```

### For Existing Databases

If you have an existing database, **DO NOT** run `schema.sql`. Instead:

1. Check current schema version
2. Apply only missing changes
3. Use incremental migration files (coming soon)

## Schema Overview

### Core Tables
- `users` - User accounts and profiles
- `listening_activity` - **Partitioned** by month (time-series data)
- `tracks` - Cached track metadata with full-text search
- `friendships` - Social connections

### Radio Features
- `radio_stations` - Live broadcasting stations
- `radio_listeners` - Active listeners (real-time)
- `radio_chat_messages` - Station chat
- `song_requests` - Queue management

### Playlist Features
- `collaborative_playlists` - Shared playlists
- `playlist_tracks` - Track membership
- `playlist_track_votes` - Democratic curation
- `track_reactions` - Emoji reactions

### Analytics
- `daily_top_tracks` - Materialized view (refresh daily)
- `user_listening_stats` - Materialized view (refresh hourly)

## Key Features

### 1. Partitioning
`listening_activity` is partitioned by month for scalability:
```sql
CREATE TABLE listening_activity (...) PARTITION BY RANGE (played_at);
```

**Important**: New partitions must be created monthly. Add to cron:
```sql
-- Run on 1st of each month
CREATE TABLE listening_activity_YYYY_MM PARTITION OF listening_activity
    FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01');
```

### 2. Row Level Security (RLS)
All user-facing tables have RLS enabled. Policies enforce:
- Users can only see their own data
- Friends can see shared content
- Public data is accessible to all

### 3. Indexes
Optimized for common query patterns:
- Composite indexes for multi-column queries
- BRIN indexes for time-series (90% smaller)
- GIN indexes for full-text search

### 4. Functions & Triggers
- `cleanup_stale_listeners()` - Remove inactive radio listeners
- `cleanup_expired_cache()` - Clear old cached data
- `update_listener_count()` - Real-time station stats

## Maintenance

### Daily Tasks
```sql
-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_top_tracks;

-- Clean up expired cache
SELECT cleanup_expired_cache();
```

### Hourly Tasks
```sql
-- Refresh user stats
REFRESH MATERIALIZED VIEW CONCURRENTLY user_listening_stats;
```

### Every Minute
```sql
-- Remove stale listeners (inactive > 2 minutes)
SELECT cleanup_stale_listeners();
```

## Troubleshooting

### Missing Partitions
If you see errors about missing partitions:
```sql
-- Check existing partitions
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'listening_activity_%';

-- Create missing partition
CREATE TABLE listening_activity_2025_12 PARTITION OF listening_activity
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

### RLS Policy Errors
If queries fail with permission errors:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Performance Issues
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public' AND n_distinct > 100
ORDER BY abs(correlation) DESC;

-- Analyze tables
ANALYZE listening_activity;
ANALYZE tracks;
```

## Security Checklist

Before production deployment:
- [ ] All RLS policies tested
- [ ] No public access to sensitive tables
- [ ] API credentials encrypted
- [ ] Backup strategy configured
- [ ] Monitoring alerts set up

## Next Steps

1. **Test fresh deployment** on staging environment
2. **Verify all RLS policies** are working
3. **Set up automated partition creation**
4. **Configure backup schedule**
5. **Set up monitoring** for query performance

## Support

For issues or questions:
1. Check this README
2. Review `schema.sql` comments
3. Check deprecated files for historical context
4. Consult team documentation
