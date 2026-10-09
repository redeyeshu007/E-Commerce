/**
 * Database connection — Prisma Client singleton.
 *
 * In development, reuse the global PrismaClient instance to prevent
 * exhausting the connection pool during hot reloads (Next.js / tsx watch).
 *
 * See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 *
 * NOTE: DATABASE_URL must be set in the environment before importing this module.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
