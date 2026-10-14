import pino from "pino";

/**
 * Structured logger powered by Pino.
 *
 * Configured with:
 * - Redaction of sensitive fields (passwords, tokens, authorization headers, secrets, database URLs)
 * - Safe log level based on environment
 * - ISO timestamp format
 */

const isTest = process.env["NODE_ENV"] === "test";
const logLevel = process.env["LOG_LEVEL"] || (isTest ? "silent" : "info");

export const logger = pino({
  level: logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "authorization",
      "cookie",
      "password",
      "token",
      "secret",
      "DATABASE_URL",
      "*.password",
      "*.token",
      "*.secret",
      "*.DATABASE_URL",
      "*.authorization",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "peralagae-backend",
    env: process.env["NODE_ENV"] || "development",
  },
});

export type Logger = typeof logger;
