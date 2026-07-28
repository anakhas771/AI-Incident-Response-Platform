-- PostgreSQL Initialization Script for AI Incident Response Platform
-- Enables necessary extensions for vector search (pgvector) and UUID generation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Optional pgvector extension for future vector storage in Postgres (if installed in image)
-- CREATE EXTENSION IF NOT EXISTS vector;
