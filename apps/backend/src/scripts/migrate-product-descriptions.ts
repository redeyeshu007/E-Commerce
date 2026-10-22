import "dotenv/config";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

async function migrate() {
  logger.info("Migrating products table for 6-section description structure...");

  logger.info("MongoDB schema supports flexible fields natively.");

  // 4. For products with specs containing 'Jewellery Care Guide', populate careInstructions if null
  const products = await prisma.product.findMany();
  for (const p of products) {
    let careVal = p.careInstructions;
    if (!careVal && Array.isArray(p.specs)) {
      const careSpec = (p.specs as any[]).find(
        (s) => (s.label || s.name || "").toLowerCase().includes("care")
      );
      if (careSpec && careSpec.value) {
        careVal = careSpec.value;
      }
    }

    // If product has no overview yet, derive from description without fabricating facts
    const overview = p.productOverview || p.descriptionParagraph1 || undefined;
    const details = p.productDetails || p.descriptionParagraph2 || undefined;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        productOverview: overview || null,
        productDetails: details || null,
        careInstructions: careVal || null,
      },
    });
  }

  logger.info("Product descriptions migration completed successfully.");
}

migrate()
  .catch((err) => {
    logger.error({ err }, "Migration failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
