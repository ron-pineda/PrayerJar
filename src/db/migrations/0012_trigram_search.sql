CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayers_title_trgm ON prayers USING GIN (title gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayers_content_trgm ON prayers USING GIN (content gin_trgm_ops);
