import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

/**
 * Database client module using Prisma.
 *
 * Implements:
 * - Singleton PrismaClient to prevent connection exhaustion in development
 * - Safe connection checking (SELECT 1) without unhandled exceptions
 * - Clean disconnect for graceful process shutdown
 */

declare global {
  // eslint-disable-next-line no-var
  var __peralagae_prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });
}

export const prisma: PrismaClient = globalThis.__peralagae_prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__peralagae_prisma = prisma;
}

export interface DatabaseStatus {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Performs an honest, active health check against the configured PostgreSQL database.
 * Does NOT throw unhandled exceptions if the database is unreachable or unconfigured.
 */
export async function checkDatabaseConnection(): Promise<DatabaseStatus> {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl || dbUrl.trim() === "") {
    return {
      connected: false,
      error: "DATABASE_URL is not configured",
    };
  }

  const startTime = Date.now();
  try {
    // Run a lightweight connection verification query with a 10-second timeout
    await Promise.race([
      prisma.$queryRawUnsafe("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out after 10000ms")), 10000),
      ),
    ]);

    const latencyMs = Date.now() - startTime;
    return {
      connected: true,
      latencyMs,
    };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Unknown database connection error";
    // Sanitize any potential connection credentials from error message
    const sanitized = rawMessage.replace(/:\/\/.*@/, "://***:***@");
    logger.warn({ err: sanitized }, "Database connection check failed");
    return {
      connected: false,
      error: sanitized,
    };
  }
}

/**
 * Disconnects the Prisma client cleanly during application shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Prisma client disconnected successfully.");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Prisma client");
  }
}
