# Architecture Overview — Gold Commerce Platform

> **Current milestone**: Foundation scaffold only.
> No business features, real authentication, database data, or production UI have been implemented.

## System Overview

The Gold Commerce Platform is a **monorepo** housing a Next.js frontend and an Express.js backend
that are independently deployable and independently developable.

```
┌─────────────────────────────────────────────────────────────┐
│                     gold-commerce-platform                  │
│                     (npm workspaces)                        │
├────────────────────┬────────────────────┬───────────────────┤
│   apps/frontend    │   apps/backend     │   packages/       │
│   (Next.js 15)     │   (Express 4)      │   shared-types    │
│   Port 3000        │   Port 4000        │   validation      │
│                    │   /api/v1          │   eslint-config   │
│                    │                    │   typescript-cfg  │
└────────────────────┴────────────────────┴───────────────────┘
           │                    │
           └─────── REST ───────┘
                  JSON API
                /api/v1/*
```

## Multi-Company Architecture

Each jewellery company gets its **own independent deployment** sharing the same source code:

```
Source Code (this repo)
        │
        ├── Company A deployment
        │     ├── Own .env / config
        │     ├── Own PostgreSQL database
        │     └── Own domain
        │
        └── Company B deployment
              ├── Own .env / config
              ├── Own PostgreSQL database
              └── Own domain
```

There is **no runtime multi-tenancy** — isolation is achieved through separate deployments.

## Frontend Architecture (Next.js 15 App Router)

```
src/
├── app/                    Next.js App Router pages and layouts
│   ├── layout.tsx          Root layout (minimal)
│   └── page.tsx            Root page
├── components/
│   ├── ui/                 shadcn/ui primitive components
│   ├── shared/             Reusable cross-feature components
│   └── layout/             Header, footer, navigation skeletons
├── features/               Feature-scoped components and hooks
├── hooks/                  Shared React hooks
├── lib/                    Utility functions and third-party wrappers
├── providers/              React context providers
├── config/                 App-level configuration (company config, feature flags)
├── types/                  Frontend-specific TypeScript types
└── styles/                 Global CSS and Tailwind configuration
```

### Data Fetching Strategy

| Concern                  | Tool                              |
| ------------------------ | --------------------------------- |
| Server-side data (RSC)   | Next.js fetch / Server Components |
| Client-side server state | TanStack Query                    |
| Client-only UI state     | Zustand                           |
| Forms                    | React Hook Form + Zod             |

## Backend Architecture (Express.js)

```
src/
├── server.ts               HTTP server entry (starts listener, graceful shutdown)
├── app.ts                  Express app factory (middleware, routes)
├── config/
│   └── env.ts              Zod-validated environment config
├── routes/
│   └── v1/                 API v1 route registrations
├── modules/                Feature modules
│   ├── <module>/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── types/
├── middleware/             Cross-cutting concerns
├── lib/                    Shared library utilities (Prisma singleton, Swagger)
├── types/                  Backend-specific TypeScript types
└── utils/                  Helper utilities
```

### API Conventions

- All routes prefixed: `/api/v1/`
- All responses use the standard envelope: `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`
- Pagination via query params: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`

## Shared Packages

| Package                            | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `@gold-commerce/shared-types`      | TypeScript interfaces for API contracts, company config, pagination     |
| `@gold-commerce/validation`        | Reusable Zod schemas used by both frontend forms and backend validation |
| `@gold-commerce/eslint-config`     | Shared ESLint rules (base, Next.js, Node)                               |
| `@gold-commerce/typescript-config` | Shared tsconfig bases (base, nextjs, node)                              |

## Database

- **Engine**: PostgreSQL 16+
- **ORM**: Prisma 6
- **Schema location**: `apps/backend/prisma/schema.prisma`
- Each company has its own independent database instance

## Security Considerations

- Helmet.js for HTTP security headers
- CORS configured per deployment
- Rate limiting on all API routes
- JWT-based authentication (to be implemented)
- Environment variable validation at startup — app fails loudly if secrets are missing
- No credentials committed to source control
