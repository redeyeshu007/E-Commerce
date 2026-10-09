/**
 * Backend test setup.
 *
 * Configure global test utilities, mock factories, and environment stubs here.
 * This file runs before every test file.
 */

// Set test environment variables before any module imports
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "4001";
process.env["JWT_SECRET"] = "test-jwt-secret-that-is-at-least-32-chars-long";
process.env["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/gold_commerce_test";
process.env["CORS_ORIGIN"] = "http://localhost:3000";
process.env["COMPANY_ID"] = "test-company";
process.env["COMPANY_NAME"] = "Test Jewellers";
process.env["COMPANY_DOMAIN"] = "localhost";
process.env["FEATURE_GOLD_RATE_LIVE"] = "false";
process.env["FEATURE_PAYMENTS_ENABLED"] = "false";
process.env["FEATURE_SHIPPING_ENABLED"] = "false";
