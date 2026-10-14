/**
 * Re-export database client from canonical database module.
 * Preserved for backwards compatibility with any early imports.
 */
export { prisma, checkDatabaseConnection, disconnectPrisma } from "../database/prisma.js";
export type { DatabaseStatus } from "../database/prisma.js";
