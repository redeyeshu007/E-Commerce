import "dotenv/config";
import { prisma } from "../database/prisma.js";
import { CategoryService } from "../services/category-service.js";
import { HeroService } from "../services/hero-service.js";
import { HeroMediaService } from "../services/hero-media-service.js";
import { CategoryMediaService } from "../services/category-media-service.js";
import { MaterialService } from "../services/material-service.js";
import { MaterialMediaService } from "../services/material-media-service.js";
import { initCustomerAndOrderTables } from "./init-customer-tables.js";
import { logger } from "../utils/logger.js";

async function main() {
  logger.info("Starting safe idempotent database migration & seed check...");

  // Verify customer and order tables
  await initCustomerAndOrderTables();

  // Seed baseline categories and catalogue products if empty
  await CategoryService.seedInitialData();

  // Seed baseline materials and materials section settings
  await MaterialService.seedInitialData();

  // Sync hero settings and history
  await HeroService.syncLegacyData();

  // Sync disk media to MongoDB bytea/binary storage
  await HeroMediaService.syncDiskToDatabase();
  await CategoryMediaService.syncLocalDiskImagesToDb();
  await MaterialMediaService.syncDiskToDatabase();

  const [categories, products, materials, heroSettings, navbarSettings] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.material.count(),
    prisma.heroSetting.count(),
    prisma.navbarSetting.count(),
  ]);

  logger.info(
    { categories, products, materials, heroSettings, navbarSettings },
    "Database migration & seed check completed successfully"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err }, "Database seed script failed");
    await prisma.$disconnect();
    process.exit(1);
  });
