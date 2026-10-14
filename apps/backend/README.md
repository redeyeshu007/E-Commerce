# PERALAGAE Jewellery E-commerce — Backend Foundation

> **Status:** Backend Infrastructure Foundation Only  
> **Notice:** Business APIs, domain models, and purchase workflows are intentionally deferred and have NOT yet been implemented.

This package provides the modular, production-ready backend foundation for the PERALAGAE jewellery e-commerce platform.

---

## 1. System Requirements & Node.js Version

- **Node.js:** LTS `>= 20.0.0` (tested on Node.js 20+)
- **npm:** `>= 10.0.0`
- **Database:** PostgreSQL (externally hosted or local container)
- **TypeScript:** `5.7+` with strict type checking enabled

---

## 2. Dependency Installation

From the monorepo root:

```bash
# Install all dependencies across workspaces
npm install
```

Or target the backend workspace specifically:

```bash
npm install --workspace=apps/backend
```

---

## 3. Environment Configuration

Copy the example environment template into `.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### Environment Variables

| Variable       | Description                                                                                  | Default / Example                                   | Required in Production              |
| -------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `NODE_ENV`     | Runtime environment (`development`, `test`, `production`)                                    | `development`                                       | Yes                                 |
| `PORT`         | HTTP port for the Express listener                                                           | `4000`                                              | No (defaults to 4000)               |
| `DATABASE_URL` | PostgreSQL connection string                                                                 | `postgresql://user:pass@host:5432/db?schema=public` | **Yes** (Strictly validated by Zod) |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated, no wildcard in prod)                              | `http://localhost:3000`                             | Yes                                 |
| `LOG_LEVEL`    | Pino structured logging level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`) | `info`                                              | No                                  |

> [!IMPORTANT]
> Never commit real credentials, database passwords, or cloud secrets to version control. The `.env` file is excluded in `.gitignore`.

---

## 4. How to Configure an External PostgreSQL Database

The backend is built to connect to an externally hosted PostgreSQL database (such as AWS RDS, Neon, Supabase, Railway, Render, or a custom cluster). It does **not** assume PostgreSQL must run locally.

### Connection String Format

```dotenv
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public&sslmode=require"
```

1. Create a PostgreSQL database on your chosen provider.
2. Ensure network access / firewall rules allow connections from your application environment.
3. If SSL is required by your provider (standard on AWS RDS / Neon / Supabase), append `&sslmode=require` or your provider's specific SSL parameters to `DATABASE_URL`.
4. Place the connection URL in `.env` (or in your host environment secrets).
5. Verify connectivity using the readiness probe:
   ```bash
   curl http://localhost:4000/api/health/ready
   ```

---

## 5. How to Generate the Prisma Client

Whenever the Prisma schema (`prisma/schema.prisma`) is updated:

```bash
npm run prisma:generate --workspace=apps/backend
```

This compiles type-safe TypeScript query bindings into `node_modules/@prisma/client`.

---

## 6. How to Run the Backend in Development

Start the development server with live TypeScript reloading via `tsx`:

```bash
npm run dev --workspace=apps/backend
```

Alternatively, from the monorepo root:

```bash
npm run dev:backend
```

The server will listen at `http://localhost:4000`.

### Health Endpoints

- **Liveness Probe:** `GET http://localhost:4000/api/health`
  Returns HTTP 200 indicating the Express server process is up.
- **Database Readiness Probe:** `GET http://localhost:4000/api/health/ready`
  Executes an honest connection query (`SELECT 1`) via Prisma. Returns HTTP 200 if connected, or HTTP 503 if disconnected.
- **API Documentation (Swagger):** `http://localhost:4000/api/docs`

---

## 7. How to Run Quality Checks & Tests

All foundation tests run completely offline and do **not** require a paid service or external database.

```bash
# Type checking (strict mode)
npm run typecheck --workspace=apps/backend

# Linting (ESLint)
npm run lint --workspace=apps/backend

# Format checking (Prettier)
npm run format:check --workspace=apps/backend

# Automatic formatting fix
npm run format --workspace=apps/backend

# Unit and integration test suite (Vitest + Supertest)
npm run test --workspace=apps/backend

# Test suite with code coverage
npm run test:coverage --workspace=apps/backend
```

---

## 8. How to Build and Start the Production Server

Compile TypeScript to production CommonJS output in `dist/`:

```bash
# Compile TypeScript build
npm run build --workspace=apps/backend

# Start the compiled production server
npm run start --workspace=apps/backend
```

---

## 9. How to Apply Future Prisma Migrations

When business models are defined in future tasks:

1. **Development Migrations:**

   ```bash
   npm run prisma:migrate:dev --workspace=apps/backend
   ```

   Generates a new SQL migration file in `prisma/migrations/` and applies it to your development database.

2. **Production Migrations:**

   ```bash
   npm run prisma:migrate:deploy --workspace=apps/backend
   ```

   Applies pending migrations to the production database in deployment pipelines.

3. **Prisma Studio (Data GUI):**
   ```bash
   npm run prisma:studio --workspace=apps/backend
   ```

---

## 10. Architecture Decisions Intentionally Deferred

In strict alignment with the foundation setup scope, the following decisions are intentionally deferred and will be reviewed in dedicated subsequent tasks:

1. **Authentication & Authorisation:** JWT vs session-based auth, refresh token rotation, OAuth/social login, multi-factor authentication (MFA).
2. **Customer & Administrator Roles:** RBAC, permission hierarchy, admin access control, and staff activity audits.
3. **Product & Inventory Data Models:** Precious metals pricing structure, making charges, hallmark tracking, stone weight, diamond grading attributes, stock reservations.
4. **Cart & Wishlist Persistence:** Redis cache vs PostgreSQL session tables vs client-side sync.
5. **Checkout & Payment Gateway Integration:** Razorpay / Stripe / PhonePe integrations, webhook verification, payment idempotency, and currency handling.
6. **Order Lifecycle & Tracking:** Order state machine, shipment fulfillment, tracking numbers, invoice generation.
7. **Asset & Image Storage:** S3 / Cloudflare R2 / Cloudinary pipelines, responsive CDN delivery, image compression.
8. **Email & Notification Providers:** Resend / SendGrid / AWS SES for transactional notifications, SMS OTP providers.
9. **API Versioning & Documentation Strategy:** Evolution of `/api/v1` routers, OpenAPI 3.0 specification auto-generation.
10. **Deployment Infrastructure:** Containerization (Docker), Kubernetes vs ECS vs PaaS (Render / Railway / Fly.io).
11. **Caching & Background Jobs:** BullMQ / Redis for asynchronous jobs (e.g. daily gold rate updates, catalog indexing).
12. **Audit Logs & Compliance:** Financial transaction logs, GST invoicing, administrative action audit trails.
