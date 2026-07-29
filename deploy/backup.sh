#!/bin/bash

# FAM Music V.2 - Automated Backup Script
# Backs up PostgreSQL database and n8n workflows to S3/Backblaze B2

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/fam-music/backups"
DB_NAME="${DB_NAME:-fam_music}"
DB_USER="${DB_USER:-fammusic_app}"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-fam-music-backups}"
N8N_API_KEY="${N8N_API_KEY}"
N8N_URL="${N8N_URL:-http://localhost:5678}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# ============================================================================
# DATABASE BACKUP
# ============================================================================

echo "📦 Starting database backup..."

# Backup database with compression
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

echo "✅ Database backup created: db_backup_$DATE.sql.gz"

# Upload to S3/B2
if command -v aws &> /dev/null; then
  echo "☁️  Uploading to S3..."
  aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz \
    s3://$S3_BUCKET/database/ \
    --storage-class STANDARD_IA
  echo "✅ Uploaded to S3"
fi

# ============================================================================
# N8N WORKFLOWS BACKUP
# ============================================================================

echo "📦 Starting n8n workflows backup..."

# Backup all workflows
curl -s -X GET "$N8N_URL/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | \
  gzip > $BACKUP_DIR/n8n_workflows_$DATE.json.gz

echo "✅ n8n workflows backup created: n8n_workflows_$DATE.json.gz"

# Upload to S3/B2
if command -v aws &> /dev/null; then
  echo "☁️  Uploading to S3..."
  aws s3 cp $BACKUP_DIR/n8n_workflows_$DATE.json.gz \
    s3://$S3_BUCKET/n8n/ \
    --storage-class STANDARD_IA
  echo "✅ Uploaded to S3"
fi

# ============================================================================
# CLEANUP OLD LOCAL BACKUPS
# ============================================================================

echo "🧹 Cleaning up old local backups..."

# Keep only last 7 days locally
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "n8n_workflows_*.json.gz" -mtime +7 -delete

echo "✅ Cleanup complete"

# ============================================================================
# BACKUP VERIFICATION
# ============================================================================

echo "🔍 Verifying backups..."

# Check if files exist and are not empty
if [ -s "$BACKUP_DIR/db_backup_$DATE.sql.gz" ]; then
  DB_SIZE=$(du -h "$BACKUP_DIR/db_backup_$DATE.sql.gz" | cut -f1)
  echo "✅ Database backup verified: $DB_SIZE"
else
  echo "❌ Database backup failed!"
  exit 1
fi

if [ -s "$BACKUP_DIR/n8n_workflows_$DATE.json.gz" ]; then
  N8N_SIZE=$(du -h "$BACKUP_DIR/n8n_workflows_$DATE.json.gz" | cut -f1)
  echo "✅ n8n backup verified: $N8N_SIZE"
else
  echo "❌ n8n backup failed!"
  exit 1
fi

# ============================================================================
# SEND NOTIFICATION (optional)
# ============================================================================

# Uncomment to send Slack notification
# curl -X POST $SLACK_WEBHOOK_URL \
#   -H 'Content-Type: application/json' \
#   -d "{\"text\":\"✅ FAM Music backup completed: DB ($DB_SIZE), n8n ($N8N_SIZE)\"}"

echo "✅ Backup completed successfully!"
echo "📊 Database: $DB_SIZE"
echo "📊 n8n: $N8N_SIZE"
echo "📅 Date: $DATE"
