# Development Setup Guide

> **Current milestone**: Foundation scaffold only.
> Follow this guide to get the development environment running.

## Prerequisites

| Tool              | Required Version | Notes                                                                                                 |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| Node.js           | 20 LTS or 22 LTS | Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| npm               | 10+              | Bundled with Node.js                                                                                  |
| PostgreSQL        | 16+              | Local install or Docker                                                                               |
| Git               | 2.x+             |                                                                                                       |
| Docker (optional) | Latest           | Only for `docker compose` local DB                                                                    |

## Initial Setup

```bash
# 1. Clone the repository
git clone <repo-url> gold-commerce-platform
cd gold-commerce-platform

# 2. Install all workspace dependencies
npm install

# 3. Copy environment files and configure them
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# 4. Edit apps/backend/.env and set:
#    - DATABASE_URL  (your local PostgreSQL connection string)
#    - JWT_SECRET    (generate a random 64-char hex string)
```

## Database Setup

### Option A: Docker Compose (when Docker is available)

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

### Option B: Local PostgreSQL

1. Install PostgreSQL 16+ from https://www.postgresql.org/download/
2. Connect and create a database:
   ```sql
   CREATE DATABASE gold_commerce_dev;
   ```
3. Update `DATABASE_URL` in `apps/backend/.env`

### Run Prisma Migrations (after database is ready)

```bash
npm run prisma:migrate:dev --workspace=apps/backend
npm run prisma:generate --workspace=apps/backend
```

## Running the Applications

```bash
# Frontend only (port 3000)
npm run dev:frontend

# Backend only (port 4000)
npm run dev:backend

# Both at once (open two terminals)
npm run dev:frontend   # Terminal 1
npm run dev:backend    # Terminal 2
```

## Running Tests

```bash
# All tests
npm test

# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# End-to-end tests (requires running frontend)
npm run test:e2e
```

## Code Quality

```bash
# TypeScript type check
npm run typecheck

# ESLint
npm run lint

# Prettier check
npm run format:check

# Prettier fix
npm run format
```

## Building for Production

```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

## Verify Backend Health

```bash
# After starting the backend:
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## API Documentation (Swagger)

The Swagger UI is available at:

```
http://localhost:4000/api/docs
```

## Environment Variables

See `.env.example` and `apps/backend/.env.example` for the full list.
All variables are documented with their purpose.

### Generating a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Frontend Developer Notes

- You do **not** need a running backend to develop the frontend.
- Use mock data / MSW for API-dependent UI during early frontend development.
- Environment variable `NEXT_PUBLIC_API_URL` controls which backend the frontend calls.
- All `NEXT_PUBLIC_` variables are embedded in the browser bundle — **never put secrets there**.

## Backend Developer Notes

- The frontend and backend are **completely independent workspaces**.
- You can run only `npm run dev:backend` without starting the frontend.
- The application entry point is `apps/backend/src/server.ts`.
- The Express app factory is `apps/backend/src/app.ts` — import this in tests.
- API contracts (request/response shapes) live in `packages/shared-types`.
- When adding a new module, follow the pattern in `apps/backend/src/modules/`.
