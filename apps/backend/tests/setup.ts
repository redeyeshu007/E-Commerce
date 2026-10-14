/**
 * Backend test setup.
 *
 * Configures isolated test environment variables before tests execute.
 * Ensures tests run offline without requiring live databases or external services.
 */

process.env["NODE_ENV"] = "test";
process.env["PORT"] = "4001";
process.env["CORS_ORIGINS"] = "http://localhost:3000";
process.env["LOG_LEVEL"] = "silent";
process.env["ADMIN_EMAIL"] = "admin@peralagae.com";
process.env["ADMIN_PASSWORD"] = "PeralagaeAdmin2026!SecureKey";
process.env["ADMIN_JWT_SECRET"] =
  "peralagae_super_secure_admin_jwt_secret_at_least_32_characters_long";
