# Database Migration Guide

## Overview

This guide explains how to set up and migrate the FAM Music database. The main schema file contains the complete, production-ready database structure.

## Current Status

- **Main Schema**: `schema.sql` (600+ lines, production-ready)
- **Legacy Migrations**: Multiple individual migration files (DEPRECATED)
- **Migration System**: `migrations/` folder with versioning

## Fresh Installation

For a fresh database installation:

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE fam_music;"

# 2. Create user
psql -U postgres -c "CREATE USER fammusic_app WITH PASSWORD 'your-secure-password';"

# 3. Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fam_music TO fammusic_app;"

# 4. Run main schema
psql -U fammusic_app -d fam_music -f schema.sql

# 5. Create initial partitions
bash create-partitions.sh
```

## Existing Database Migration

If you already have data and need to migrate:

### Step 1: Backup

```bash
# Create backup
pg_dump -U fammusic_app fam_music > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### Step 2: Run Migrations

```bash
# Navigate to migrations folder
cd migrations

# Install migration tool
npm install

# Run migrations
npm run migrate
```

### Step 3: Verify

```bash
# Check schema version
psql -U fammusic_app -d fam_music -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# Verify tables exist
psql -U fammusic_app -d fam_music -c "\dt"

# Check partitions
psql -U fammusic_app -d fam_music -c "SELECT tablename FROM pg_tables WHERE tablename LIKE 'listening_activity_%' ORDER BY tablename;"
```

## Migration Files Status

### Active Files:
- ✅ `schema.sql` - **USE THIS** for fresh installs
- ✅ `create-partitions.sh` - Creates time-based partitions
- ✅ `migrations/` - Version-controlled migrations

### Deprecated Files (DO NOT USE):
These files were created during development and are now consolidated into `schema.sql`:

```
DEPRECATED:
- add_display_name_column.sql
- add_listener_count_function.sql
- add_missing_*.sql (all variants)
- fix_*.sql (all variants)
- bare_minimum.sql
- consolidated/ (old attempts)
- And 20+ other individual migration files
```

## Creating New Migrations

When you need to add new features:

```bash
cd migrations

# Create new migration
npm run migrate:create add_new_feature

# Edit the generated file
# File will be: migrations/YYYYMMDDHHMMSS_add_new_feature.sql
```

Example migration file:

```sql
-- migrations/20240101120000_add_badges.sql

-- UP
CREATE TABLE user_badges (
    badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);

-- DOWN
DROP TABLE IF EXISTS user_badges;
```

## Partition Management

### Automatic Partition Creation

Partitions are automatically created monthly. Check cron job:

```bash
# View cron jobs
crontab -l | grep partition

# Expected:
# 0 0 1 * * /path/to/create-partitions.sh
```

### Manual Partition Creation

```bash
# Create partitions for next 6 months
bash create-partitions.sh

# Verify partitions
psql -U fammusic_app -d fam_music -c "
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'listening_activity_%'
ORDER BY tablename;
"
```

### Partition Cleanup

Remove old partitions (> 12 months):

```sql
-- List old partitions
SELECT tablename
FROM pg_tables
WHERE tablename LIKE 'listening_activity_%'
  AND tablename < 'listening_activity_' || TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY_MM');

-- Drop old partition (example)
DROP TABLE IF EXISTS listening_activity_2023_01;
```

## Troubleshooting

### Migration Failed Mid-Way

```bash
# 1. Check current version
psql -U fammusic_app -d fam_music -c "SELECT * FROM schema_migrations;"

# 2. Rollback to known good state
psql -U fammusic_app -d fam_music < backup_YYYYMMDD_HHMMSS.sql

# 3. Try migration again
cd migrations && npm run migrate
```

### Missing Tables

If tables are missing:

```bash
# Check what exists
psql -U fammusic_app -d fam_music -c "\dt"

# Run main schema again (safe, will skip existing tables)
psql -U fammusic_app -d fam_music -f schema.sql
```

### Permission Issues

```bash
# Grant all permissions
psql -U postgres -d fam_music -c "
GRANT ALL ON ALL TABLES IN SCHEMA public TO fammusic_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO fammusic_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO fammusic_app;
"
```

## Database Cleanup

### Archive Old Data

```sql
-- Archive listening activity older than 2 years
CREATE TABLE listening_activity_archive AS
SELECT * FROM listening_activity
WHERE played_at < CURRENT_DATE - INTERVAL '2 years';

-- Verify
SELECT COUNT(*) FROM listening_activity_archive;

-- Delete from main table
DELETE FROM listening_activity
WHERE played_at < CURRENT_DATE - INTERVAL '2 years';
```

### Vacuum and Analyze

```bash
# Run vacuum to reclaim space
psql -U fammusic_app -d fam_music -c "VACUUM ANALYZE;"

# Check database size
psql -U fammusic_app -d fam_music -c "
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'fam_music';
"
```

## Best Practices

1. **Always backup before migrations**
2. **Test migrations on staging first**
3. **Use transactions for complex migrations**
4. **Document breaking changes**
5. **Keep migrations small and focused**
6. **Never edit old migration files**
7. **Use DOWN migrations for rollback**

## Schema Version Control

Current schema version: `1.0.0`
Last updated: 2024-11-24

### Version History

- `1.0.0` (2024-11-24) - Initial production schema with partitioning
- Future versions will be tracked here

## Next Steps

1. ✅ Run fresh installation or migrate existing database
2. ✅ Verify all tables and indexes
3. ✅ Set up automated partitioning
4. ✅ Configure backup cron jobs
5. ✅ Test RLS policies
6. ✅ Monitor query performance

## Support

If you encounter issues:
1. Check logs: `/var/log/postgresql/`
2. Check migration status: `schema_migrations` table
3. Restore from backup if needed
4. Consult schema.sql for complete structure
