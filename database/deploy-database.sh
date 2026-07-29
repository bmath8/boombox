#!/bin/bash
# deploy-database.sh
# Automated database deployment script for FAM Music V.2

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-fammusic}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FAM Music V.2 - Database Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if database exists
check_database() {
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"
}

# Function to create database
create_database() {
    echo -e "${YELLOW}Creating database: $DB_NAME${NC}"
    createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
    echo -e "${GREEN}✓ Database created${NC}"
}

# Function to deploy schema
deploy_schema() {
    echo -e "${YELLOW}Deploying schema...${NC}"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f schema.sql
    echo -e "${GREEN}✓ Schema deployed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"
    
    # Check if key tables exist
    TABLES=("users" "listening_activity" "radio_stations" "tracks")
    for table in "${TABLES[@]}"; do
        if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='$table');" | grep -q 't'; then
            echo -e "${GREEN}  ✓ Table '$table' exists${NC}"
        else
            echo -e "${RED}  ✗ Table '$table' missing${NC}"
            exit 1
        fi
    done
    
    # Check if extensions are installed
    EXTENSIONS=("uuid-ossp" "pg_trgm" "btree_gin")
    for ext in "${EXTENSIONS[@]}"; do
        if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM pg_extension WHERE extname='$ext');" | grep -q 't'; then
            echo -e "${GREEN}  ✓ Extension '$ext' installed${NC}"
        else
            echo -e "${RED}  ✗ Extension '$ext' missing${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓ Verification complete${NC}"
}

# Main deployment flow
main() {
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    echo "Host: $DB_HOST:$DB_PORT"
    echo ""
    
    # Check if this is a new deployment or update
    if check_database; then
        echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
        read -p "Do you want to DROP and recreate? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo -e "${RED}Dropping database: $DB_NAME${NC}"
            dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
            create_database
            deploy_schema
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
    else
        create_database
        deploy_schema
    fi
    
    verify_deployment
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with database credentials"
    echo "2. Run your application"
    echo "3. Monitor logs for any issues"
}

# Run main function
main
