/**
 * Backend test setup.
 *
 * Configures isolated test environment variables before tests execute.
 * Ensures tests run offline without requiring live databases or external services.
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables from apps/backend/.env if present
dotenv.config({ path: path.resolve(__dirname, "../.env") });

process.env["NODE_ENV"] = "test";
process.env["PORT"] = "4001";
process.env["CORS_ORIGINS"] = "http://localhost:3000";
process.env["LOG_LEVEL"] = "silent";
process.env["ADMIN_EMAIL"] = process.env["ADMIN_EMAIL"] || "javixtech@gmail.com";
process.env["ADMIN_PASSWORD"] = process.env["ADMIN_PASSWORD"] || "javix@2026";
process.env["ADMIN_JWT_SECRET"] =
  process.env["ADMIN_JWT_SECRET"] || "peralagae_super_secure_admin_jwt_secret_at_least_32_characters_long";
process.env["CUSTOMER_JWT_SECRET"] =
  process.env["CUSTOMER_JWT_SECRET"] || "peralagae_super_secure_customer_jwt_secret_at_least_32_characters_long";

