import "dotenv/config";
import { prisma } from "../database/prisma.js";

async function check() {
  try {
    const [
      categories, products, materials, materialCards, materialSectionSettings,
      heroSettings, heroHistory, navbarSettings, navbarHistory,
      instagramSettings, instagramImages, instagramHistory,
      storeDetails, customers, customerSessions, orders, orderItems,
      heroMedia, categoryMedia, productMedia, materialMedia, instagramMedia
    ] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.material.count(),
      prisma.materialCard.count(),
      prisma.materialSectionSetting.count(),
      prisma.heroSetting.count(),
      prisma.heroHistory.count(),
      prisma.navbarSetting.count(),
      prisma.navbarHistory.count(),
      prisma.instagramSectionSetting.count(),
      prisma.instagramImage.count(),
      prisma.instagramSectionHistory.count(),
      prisma.storeDetails.count(),
      prisma.customer.count(),
      prisma.customerSession.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.heroMediaAsset.count(),
      prisma.categoryMediaAsset.count(),
      prisma.productMediaAsset.count(),
      prisma.materialMediaAsset.count(),
      prisma.instagramMediaAsset.count()
    ]);

    console.log("POSTGRES_INVENTORY_RESULT:", JSON.stringify({
      categories, products, materials, materialCards, materialSectionSettings,
      heroSettings, heroHistory, navbarSettings, navbarHistory,
      instagramSettings, instagramImages, instagramHistory,
      storeDetails, customers, customerSessions, orders, orderItems,
      heroMedia, categoryMedia, productMedia, materialMedia, instagramMedia
    }, null, 2));
  } catch (err: any) {
    console.error("POSTGRES_INVENTORY_ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
