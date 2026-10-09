# Infrastructure

This directory contains infrastructure configuration for the Gold Commerce Platform.

## Contents

| File / Directory         | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `docker-compose.dev.yml` | Local PostgreSQL database for development |

## Local Database Setup

### Option 1: Docker Compose (Recommended when Docker is available)

```bash
# Start PostgreSQL
docker compose -f infrastructure/docker-compose.dev.yml up -d

# Verify it is running
docker compose -f infrastructure/docker-compose.dev.yml ps

# Stop
docker compose -f infrastructure/docker-compose.dev.yml down
```

### Option 2: Local PostgreSQL installation

1. Install PostgreSQL 16+ from https://www.postgresql.org/download/
2. Create a database:
   ```sql
   CREATE DATABASE gold_commerce_dev;
   ```
3. Update `DATABASE_URL` in `apps/backend/.env`

## Production Infrastructure

Production infrastructure (cloud databases, CDN, reverse proxy, CI/CD pipelines)
is provisioned separately per company deployment.

See `docs/deployment.md` (to be written during infrastructure planning).
