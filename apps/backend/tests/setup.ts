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
process.env["SMTP_HOST"] = process.env["SMTP_HOST"] || "smtp.test.peralagae.local";
process.env["SMTP_PORT"] = process.env["SMTP_PORT"] || "587";
process.env["SMTP_SECURE"] = process.env["SMTP_SECURE"] || "false";
process.env["SMTP_USER"] = process.env["SMTP_USER"] || "test-smtp-user";
process.env["SMTP_PASS"] = process.env["SMTP_PASS"] || "test-smtp-pass";
process.env["EMAIL_FROM"] = process.env["EMAIL_FROM"] || "notifications@peralagae.com";
process.env["EMAIL_FROM_NAME"] = process.env["EMAIL_FROM_NAME"] || "PERALAGAE Jewellery";
process.env["EMAIL_REPLY_TO"] = process.env["EMAIL_REPLY_TO"] || "support@peralagae.com";
process.env["EMAIL_ENABLED"] = process.env["EMAIL_ENABLED"] || "true";
process.env["BUSINESS_TIMEZONE"] = "Asia/Kolkata";


