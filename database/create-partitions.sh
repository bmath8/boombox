#!/bin/bash

# FAM Music V.2 - Automated Partition Creation
# Creates new monthly partitions for listening_activity table

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

DB_NAME="${DB_NAME:-fam_music}"
DB_USER="${DB_USER:-fammusic_app}"
DB_HOST="${DB_HOST:-localhost}"

# ============================================================================
# CREATE NEXT 3 MONTHS OF PARTITIONS
# ============================================================================

echo "📅 Creating partitions for listening_activity table..."

# Get current date
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%m)

# Function to create partition
create_partition() {
  local year=$1
  local month=$2
  
  # Format month with leading zero
  month_formatted=$(printf "%02d" $month)
  
  # Calculate next month
  next_month=$((month + 1))
  next_year=$year
  
  if [ $next_month -gt 12 ]; then
    next_month=1
    next_year=$((year + 1))
  fi
  
  next_month_formatted=$(printf "%02d" $next_month)
  
  partition_name="listening_activity_${year}_${month_formatted}"
  start_date="${year}-${month_formatted}-01"
  end_date="${next_year}-${next_month_formatted}-01"
  
  echo "Creating partition: $partition_name ($start_date to $end_date)"
  
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = '$partition_name'
  ) THEN
    CREATE TABLE $partition_name PARTITION OF listening_activity
      FOR VALUES FROM ('$start_date') TO ('$end_date');
    
    RAISE NOTICE 'Created partition: $partition_name';
  ELSE
    RAISE NOTICE 'Partition already exists: $partition_name';
  END IF;
END \$\$;
EOF
}

# Create partitions for next 3 months
for i in {0..2}; do
  month=$((CURRENT_MONTH + i))
  year=$CURRENT_YEAR
  
  if [ $month -gt 12 ]; then
    month=$((month - 12))
    year=$((year + 1))
  fi
  
  create_partition $year $month
done

echo "✅ Partition creation complete!"

# ============================================================================
# CLEANUP OLD PARTITIONS (older than 12 months)
# ============================================================================

echo "🧹 Cleaning up old partitions..."

CUTOFF_DATE=$(date -d "12 months ago" +%Y-%m-01)

psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
DO \$\$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN
    SELECT tablename FROM pg_tables
    WHERE tablename LIKE 'listening_activity_%'
    AND tablename < 'listening_activity_${CUTOFF_DATE//-/_}'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
    RAISE NOTICE 'Dropped old partition: %', partition_name;
  END LOOP;
END \$\$;
EOF

echo "✅ Cleanup complete!"
