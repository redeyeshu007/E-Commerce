# Monorepo Testing & E2E Test Gating

This directory and respective workspace test directories house the automated test suites for the Gold Commerce Platform.

## Structure

- **Frontend Unit & Component Tests**: `apps/frontend/tests/*.test.{ts,tsx}` (Vitest + React Testing Library)
- **Backend Unit & Integration Tests**: `apps/backend/tests/*.test.ts` (Vitest + Supertest)
- **Frontend End-to-End Browser Tests**: `apps/frontend/tests/e2e/*.spec.ts` (Playwright)
- **Continuous Integration & Test Gating**: `.github/workflows/ci.yml` (GitHub Actions)

## Running E2E Tests Locally

### 1. Browser Installation

Before running Playwright for the first time, install the Chromium browser binary:

```bash
npx playwright install chromium
# Or on Linux/CI:
npx playwright install --with-deps chromium
```

### 2. Execution Commands

```bash
# Run all E2E tests from workspace root (Playwright auto-starts dev server if not already running)
npm run test:e2e

# Run with interactive UI mode
npx playwright test --ui --config=apps/frontend/playwright.config.ts

# Run headed in a visible browser window
npx playwright test --headed --config=apps/frontend/playwright.config.ts

# View HTML test report
npx playwright show-report apps/frontend/playwright-report
```

## Environment Variables

- `PLAYWRIGHT_BASE_URL`: Base URL for the running frontend (defaults to `http://localhost:3000`).
- `CI`: When set to `"true"`, enforces headless execution, single worker, and retries.

## Continuous Integration (CI) Test Gating

All pull requests and pushes to `main`/`master` run through `.github/workflows/ci.yml`. A pull request cannot merge if any E2E, unit, typecheck, or lint check fails. Test failure produces a non-zero exit code (`1`) causing CI gating rejection.
