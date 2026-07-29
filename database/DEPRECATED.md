# Deprecated Database Files

**⚠️ WARNING: DO NOT USE THESE FILES FOR NEW DEPLOYMENTS**

These files are kept for historical reference only. They have been consolidated into `schema.sql`.

## Why These Files Are Deprecated

1. **Schema Fragmentation**: 39+ separate files caused confusion
2. **Duplicate Definitions**: Same tables/functions defined multiple times
3. **Inconsistent State**: Running files in wrong order caused errors
4. **No Single Source of Truth**: Unclear which file was authoritative

## Deprecated Files List

### Setup Files (Replaced by `schema.sql`)
- `bare_minimum.sql` - Incomplete minimal schema
- `minimal_setup.sql` - Another incomplete minimal schema
- `supabase_setup.sql` - Supabase-specific setup
- `step_by_step_setup.sql` - Step-by-step guide (outdated)

### Add/Fix Files (Integrated into `schema.sql`)
- `add_display_name_column.sql`
- `add_listener_count_function.sql`
- `add_missing_function.sql`
- `add_missing_indexes.sql`
- `add_missing_tables.sql`
- `add_missing_tables_complete.sql`
- `add_missing_tables_final.sql`
- `add_missing_tables_fixed.sql`
- `add_remaining_tables.sql`
- `add_song_requests.sql`
- `fix_display_names.sql`
- `fix_friendships_fkeys.sql`
- `fix_playlist_creation.sql`
- `fix_rls_policies.sql`
- `fix_schema_and_add_discovery.sql`
- `fix_users_table.sql`
- `fix_users_table_final.sql`
- `sync_users_fix.sql`
- `update_listener_counts.sql`

### Feature Files (Integrated into `schema.sql`)
- `badge_system.sql` - Badge/achievement system
- `challenge_tracking.sql` - Challenge tracking system
- `discovery_features.sql` - Music discovery features
- `sprint1_radio_enhancements.sql` - Radio features
- `sprint2_collaborative_playlists.sql` - Playlist features

### Debug/Check Files (No longer needed)
- `check_auth_providers.sql`
- `check_foreign_keys.sql`
- `check_friendships_fk.sql`
- `check_spotify_user.sql`
- `debug_playlist_creation.sql`
- `test_discovery_function.sql`

### Alternative Schemas (Superseded)
- `master_migration.sql` - Older consolidated attempt
- `simplified_migration.sql` - Another consolidation attempt
- `reload_schema.sql` - Schema reload script

## What to Use Instead

### For New Deployments
```bash
psql -U postgres -d fammusic -f schema.sql
```

### For Existing Deployments
Create a new migration file in `migrations/` directory:
```bash
migrations/2025-11-29_add_new_feature.sql
```

## Migration Path

If you have an existing database using these old files:

1. **Backup your database**:
   ```bash
   pg_dump -U postgres fammusic > backup_$(date +%Y%m%d).sql
   ```

2. **Export your data**:
   ```bash
   pg_dump -U postgres -d fammusic --data-only > data_backup.sql
   ```

3. **Drop and recreate** (CAUTION):
   ```bash
   dropdb fammusic
   createdb fammusic
   psql -U postgres -d fammusic -f schema.sql
   psql -U postgres -d fammusic -f data_backup.sql
   ```

4. **Or use migrations** (safer):
   - Compare your current schema with `schema.sql`
   - Create migration files for differences
   - Apply migrations incrementally

## File Retention Policy

These files will be:
- ✅ Kept in repository for historical reference
- ✅ Clearly marked as deprecated
- ❌ Not used in any deployment scripts
- ❌ Not maintained or updated
- ❌ Not referenced in documentation

## Questions?

If you need to understand what a deprecated file did:
1. Check `schema.sql` for the equivalent functionality
2. Review git history for context
3. Consult the team lead

---

**Deprecated Date**: 2025-11-29  
**Replacement**: `schema.sql` + `consolidated/` directory  
**Status**: ARCHIVED - DO NOT USE
