import "dotenv/config";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export async function initCustomerAndOrderTables(): Promise<void> {
  logger.info("Verifying Customer and Order collections in database...");
  try {
    // In MongoDB, collections and indexes are managed via Prisma schema.
    const customerCount = await prisma.customer.count();
    const orderCount = await prisma.order.count();
    logger.info({ customerCount, orderCount }, "Customer and Order collections are ready");
  } catch (err) {
    logger.error({ err }, "Failed to verify Customer and Order collections");
    throw err;
  }
}

if (process.argv[1]?.includes("init-customer-tables")) {
  initCustomerAndOrderTables()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
