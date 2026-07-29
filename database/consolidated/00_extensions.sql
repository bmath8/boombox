-- 00_extensions.sql
-- PostgreSQL Extensions Required for FAM Music V.2

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fuzzy text search (for track/artist search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Composite GIN indexes (for better query performance)
CREATE EXTENSION IF NOT EXISTS "btree_gin";
