# Gold Jewellery E-commerce Platform

> **Current milestone: Foundation scaffold only.**
> This repository contains project scaffolding, dependency configuration, folder structure, and tooling setup.
> No business features, production UI, real authentication, database data, or completed e-commerce functionality has been implemented.

---

## Project Overview

A production-oriented, reusable Gold Jewellery E-commerce Platform built as a monorepo.

The platform is designed to be deployed independently for multiple jewellery companies, with each company having its own environment configuration, database, and domain — while sharing the same source code.

## Architecture Overview

```
gold-commerce-platform/
├── apps/
│   ├── frontend/        Next.js 15 (App Router) — Port 3000
│   └── backend/         Express.js — Port 4000, /api/v1
├── packages/
│   ├── shared-types/    Shared TypeScript interfaces and API contracts
│   ├── validation/      Shared Zod validation schemas
│   ├── eslint-config/   Shared ESLint configuration
│   └── typescript-config/ Shared TypeScript configuration
├── infrastructure/      Docker Compose and infrastructure config
├── docs/                Architecture and setup documentation
├── scripts/             Developer utility scripts
└── tests/               Root-level cross-cutting tests
```

See [docs/architecture.md](docs/architecture.md) for a detailed architecture overview.

## Technology Stack

### Frontend (`apps/frontend`)

| Tool                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| Next.js 15 (App Router) | React framework with SSR/SSG        |
| React 19                | UI library                          |
| TypeScript (strict)     | Type safety                         |
| Tailwind CSS            | Utility-first styling               |
| shadcn/ui               | Accessible component library        |
| Radix UI                | Headless primitives                 |
| Lucide React            | Icon library                        |
| Motion for React        | Animations                          |
| React Hook Form         | Form state management               |
| Zod                     | Schema validation                   |
| TanStack Query          | Client-side server-state management |
| Zustand                 | Lightweight client state            |
| Vitest + RTL            | Unit and component testing          |
| Playwright              | End-to-end testing                  |

### Backend (`apps/backend`)

| Tool                | Purpose                 |
| ------------------- | ----------------------- |
| Node.js LTS         | JavaScript runtime      |
| TypeScript (strict) | Type safety             |
| Express.js          | HTTP framework          |
| Zod                 | Schema validation       |
| PostgreSQL 16       | Primary database        |
| Prisma 6            | Database ORM            |
| Vitest              | Unit testing            |
| Supertest           | API integration testing |
| Swagger/OpenAPI     | API documentation       |

## Prerequisites

- **Node.js** 20 LTS or 22 LTS — [nodejs.org](https://nodejs.org)
- **npm** 10+ (bundled with Node.js)
- **PostgreSQL** 16+ — [postgresql.org](https://www.postgresql.org) or via Docker
- **Git** 2.x+
- **Docker** (optional) — for local database via Docker Compose

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd gold-commerce-platform

# 2. Install all workspace dependencies
npm install

# 3. Set up environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# 4. Edit apps/backend/.env
#    Set DATABASE_URL and generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Environment Configuration

| File                        | Purpose                        |
| --------------------------- | ------------------------------ |
| `.env.example`              | Root template — copy to `.env` |
| `apps/backend/.env.example` | Backend secrets template       |

**Key variables:**

| Variable              | Location              | Purpose                               |
| --------------------- | --------------------- | ------------------------------------- |
| `DATABASE_URL`        | backend `.env`        | PostgreSQL connection string          |
| `JWT_SECRET`          | backend `.env`        | Token signing secret (min 32 chars)   |
| `NEXT_PUBLIC_API_URL` | frontend `.env.local` | Backend API URL for client-side calls |
| `COMPANY_ID`          | backend `.env`        | Unique company identifier             |
| `NODE_ENV`            | both                  | `development` / `test` / `production` |

Never commit `.env` files containing real credentials.

## Frontend Development

```bash
# Start frontend dev server
npm run dev:frontend

# Build for production
npm run build:frontend

# TypeScript check
npm run typecheck

# Unit tests
npm run test:frontend

# End-to-end tests
npm run test:e2e

# Linting
npm run lint

# Format
npm run format
```

The frontend dev server runs on **http://localhost:3000**.

> **Frontend-only developers:** You do not need a running backend during early UI development.
> Use mock data or MSW to stub API responses.

## Backend Development

```bash
# Set up database (see Database Setup below first)
npm run prisma:generate --workspace=apps/backend
npm run prisma:migrate:dev --workspace=apps/backend

# Start backend dev server
npm run dev:backend

# Build for production
npm run build:backend

# TypeScript check
npm run typecheck

# Unit + integration tests
npm run test:backend

# Linting
npm run lint
```

The backend API runs on **http://localhost:4000**.  
API documentation: **http://localhost:4000/api/docs**  
Health check: **http://localhost:4000/api/v1/health**

## Database Setup

### Option A: Docker Compose (when Docker is available)

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

### Option B: Local PostgreSQL

1. Install PostgreSQL 16+ from https://www.postgresql.org/download/
2. Create database: `CREATE DATABASE gold_commerce_dev;`
3. Update `DATABASE_URL` in `apps/backend/.env`

### Run migrations

```bash
npm run prisma:migrate:dev --workspace=apps/backend
```

> **Note:** Migrations require a live PostgreSQL instance.
> The initial scaffold schema is minimal and does not contain production business tables.

## Testing

```bash
npm test                 # All tests
npm run test:frontend    # Frontend unit tests
npm run test:backend     # Backend unit + integration tests
npm run test:e2e         # Playwright end-to-end tests
```

> **Note:** Backend integration tests (`health.test.ts`) use Supertest with the in-memory app factory
> and do **not** require a live PostgreSQL database.
> Tests that exercise database queries will require a test database.

## Shared Package Responsibilities

### `@gold-commerce/shared-types`

TypeScript interfaces that define the API contract between frontend and backend.
Add types here when implementing new API endpoints so both sides stay in sync.

### `@gold-commerce/validation`

Zod schemas that can be imported by both frontend forms and backend route validators.
Ensures validation logic stays in one place.

### `@gold-commerce/eslint-config`

Shared ESLint rules applied consistently across all workspaces.

### `@gold-commerce/typescript-config`

Shared `tsconfig.json` bases extended by each application.

## Future API Contract Workflow

When adding a new API endpoint:

1. Define request/response types in `packages/shared-types/src/`
2. Define validation schemas in `packages/validation/src/`
3. Implement the backend route in `apps/backend/src/modules/<module>/`
4. Add Swagger JSDoc annotations to the route handler
5. The frontend imports the types from `@gold-commerce/shared-types` when building the API client

## Adding a New Jewellery Company Deployment

Each company gets its own independent deployment:

1. Clone the repository or use a CI/CD pipeline pointing to this repository
2. Create a new `.env` file for the company (do not commit it)
3. Set company-specific values: `COMPANY_ID`, `COMPANY_NAME`, `COMPANY_DOMAIN`, etc.
4. Provision a new PostgreSQL database
5. Set `DATABASE_URL` to the new company's database
6. Run `prisma migrate deploy` to initialise the schema
7. Deploy the frontend and backend independently to the company's hosting environment

No code changes are required to support a new company. All customisation is done through environment variables.

## Backend Developer Joining Later

1. Read [docs/architecture.md](docs/architecture.md)
2. Follow [docs/development-setup.md](docs/development-setup.md)
3. Run `npm install` from the root
4. Set up `apps/backend/.env`
5. Run `npm run dev:backend`
6. The API docs are at `http://localhost:4000/api/docs`
7. Start implementing modules in `apps/backend/src/modules/`
8. The frontend team has agreed on the API contracts in `packages/shared-types`

## Known Limitations of This Scaffold

- No actual business features have been implemented
- The Prisma schema contains only a placeholder model — production schema is not designed yet
- shadcn/ui must be initialized with `npx shadcn@latest init` after the full install (see below)
- End-to-end tests require a running frontend instance
- Backend integration tests that use the database require a PostgreSQL instance
- Docker is not currently available in this environment — Docker Compose config is provided for future use
- No CI/CD pipeline has been configured
- No production deployment configuration has been set up
- No authentication is implemented — JWT_SECRET is validated but auth middleware is a stub

## Folder Structure Reference

```
gold-commerce-platform/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── app/             Next.js App Router
│   │       ├── components/
│   │       │   ├── ui/          shadcn/ui components
│   │       │   ├── shared/      Cross-feature components
│   │       │   └── layout/      Layout components
│   │       ├── features/        Feature-scoped code
│   │       ├── hooks/           Shared React hooks
│   │       ├── lib/             Utilities
│   │       ├── providers/       React providers
│   │       ├── config/          Company config
│   │       ├── types/           Frontend types
│   │       └── styles/          Global styles
│   └── backend/
│       ├── src/
│       │   ├── app.ts           Express app factory
│       │   ├── server.ts        HTTP server entry
│       │   ├── config/          Env validation
│       │   ├── routes/v1/       API v1 route registrations
│       │   ├── modules/         Feature modules
│       │   │   ├── auth/
│       │   │   ├── products/
│       │   │   ├── categories/
│       │   │   ├── gold-rates/
│       │   │   ├── inventory/
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   ├── orders/
│       │   │   ├── payments/
│       │   │   ├── shipments/
│       │   │   ├── customers/
│       │   │   ├── admin/
│       │   │   ├── content/
│       │   │   └── offers/
│       │   ├── middleware/      Cross-cutting middleware
│       │   ├── lib/             Prisma client, Swagger
│       │   ├── types/           Error classes, shared types
│       │   └── utils/           Helper utilities
│       ├── prisma/
│       │   └── schema.prisma
│       └── tests/
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── eslint-config/
│   └── typescript-config/
├── infrastructure/
│   └── docker-compose.dev.yml
├── docs/
│   ├── architecture.md
│   └── development-setup.md
├── scripts/
│   ├── check-env.js
│   └── check-circular-deps.js
├── .env.example
├── .gitignore
├── .editorconfig
├── .npmrc
├── .prettierrc.json
└── package.json
```
