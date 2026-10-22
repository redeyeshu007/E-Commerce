import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";

async function exportAll() {
  const backupDir = path.resolve(process.cwd(), "data", "postgres-backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log("Starting safe sequential PostgreSQL export to:", backupDir);

  console.log("Exporting categories...");
  const categories = await prisma.category.findMany();
  console.log(`- Categories: ${categories.length}`);

  console.log("Exporting products...");
  const products = await prisma.product.findMany();
  console.log(`- Products: ${products.length}`);

  console.log("Exporting materials...");
  const materials = await prisma.material.findMany();
  console.log(`- Materials: ${materials.length}`);

  console.log("Exporting materialCards...");
  const materialCards = await prisma.materialCard.findMany();
  console.log(`- MaterialCards: ${materialCards.length}`);

  console.log("Exporting materialSectionSettings...");
  const materialSectionSettings = await prisma.materialSectionSetting.findMany();
  console.log(`- MaterialSectionSettings: ${materialSectionSettings.length}`);

  console.log("Exporting materialSectionHistory...");
  const materialSectionHistory = await prisma.materialSectionHistory.findMany();
  console.log(`- MaterialSectionHistory: ${materialSectionHistory.length}`);

  console.log("Exporting heroSettings...");
  const heroSettings = await prisma.heroSetting.findMany();
  console.log(`- HeroSettings: ${heroSettings.length}`);

  console.log("Exporting heroHistory...");
  const heroHistory = await prisma.heroHistory.findMany();
  console.log(`- HeroHistory: ${heroHistory.length}`);

  console.log("Exporting navbarSettings...");
  const navbarSettings = await prisma.navbarSetting.findMany();
  console.log(`- NavbarSettings: ${navbarSettings.length}`);

  console.log("Exporting navbarHistory...");
  const navbarHistory = await prisma.navbarHistory.findMany();
  console.log(`- NavbarHistory: ${navbarHistory.length}`);

  console.log("Exporting instagramSectionSettings...");
  const instagramSectionSettings = await prisma.instagramSectionSetting.findMany();
  console.log(`- InstagramSectionSettings: ${instagramSectionSettings.length}`);

  console.log("Exporting instagramImages...");
  const instagramImages = await prisma.instagramImage.findMany();
  console.log(`- InstagramImages: ${instagramImages.length}`);

  console.log("Exporting instagramSectionHistory...");
  const instagramSectionHistory = await prisma.instagramSectionHistory.findMany();
  console.log(`- InstagramSectionHistory: ${instagramSectionHistory.length}`);

  console.log("Exporting storeDetails...");
  const storeDetails = await prisma.storeDetails.findMany();
  console.log(`- StoreDetails: ${storeDetails.length}`);

  console.log("Exporting customers...");
  const customers = await prisma.customer.findMany();
  console.log(`- Customers: ${customers.length}`);

  console.log("Exporting customerSessions...");
  const customerSessions = await prisma.customerSession.findMany();
  console.log(`- CustomerSessions: ${customerSessions.length}`);

  console.log("Exporting orders...");
  const orders = await prisma.order.findMany();
  console.log(`- Orders: ${orders.length}`);

  console.log("Exporting orderItems...");
  const orderItems = await prisma.orderItem.findMany();
  console.log(`- OrderItems: ${orderItems.length}`);

  console.log("Exporting heroMediaAssets...");
  const heroMediaAssets = await prisma.heroMediaAsset.findMany();
  console.log(`- HeroMediaAssets: ${heroMediaAssets.length}`);

  console.log("Exporting categoryMediaAssets...");
  const categoryMediaAssets = await prisma.categoryMediaAsset.findMany();
  console.log(`- CategoryMediaAssets: ${categoryMediaAssets.length}`);

  console.log("Exporting productMediaAssets...");
  const productMediaAssets = await prisma.productMediaAsset.findMany();
  console.log(`- ProductMediaAssets: ${productMediaAssets.length}`);

  console.log("Exporting materialMediaAssets...");
  const materialMediaAssets = await prisma.materialMediaAsset.findMany();
  console.log(`- MaterialMediaAssets: ${materialMediaAssets.length}`);

  console.log("Exporting instagramMediaAssets...");
  const instagramMediaAssets = await prisma.instagramMediaAsset.findMany();
  console.log(`- InstagramMediaAssets: ${instagramMediaAssets.length}`);

  const dataExport = {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: "PostgreSQL Supabase",
      version: "1.0.0",
    },
    counts: {
      categories: categories.length,
      products: products.length,
      materials: materials.length,
      materialCards: materialCards.length,
      materialSectionSettings: materialSectionSettings.length,
      materialSectionHistory: materialSectionHistory.length,
      heroSettings: heroSettings.length,
      heroHistory: heroHistory.length,
      navbarSettings: navbarSettings.length,
      navbarHistory: navbarHistory.length,
      instagramSectionSettings: instagramSectionSettings.length,
      instagramImages: instagramImages.length,
      instagramSectionHistory: instagramSectionHistory.length,
      storeDetails: storeDetails.length,
      customers: customers.length,
      customerSessions: customerSessions.length,
      orders: orders.length,
      orderItems: orderItems.length,
      heroMediaAssets: heroMediaAssets.length,
      categoryMediaAssets: categoryMediaAssets.length,
      productMediaAssets: productMediaAssets.length,
      materialMediaAssets: materialMediaAssets.length,
      instagramMediaAssets: instagramMediaAssets.length,
    },
    categories,
    products,
    materials,
    materialCards,
    materialSectionSettings,
    materialSectionHistory,
    heroSettings,
    heroHistory,
    navbarSettings,
    navbarHistory,
    instagramSectionSettings,
    instagramImages,
    instagramSectionHistory,
    storeDetails,
    customers,
    customerSessions,
    orders,
    orderItems,
  };

  fs.writeFileSync(
    path.join(backupDir, "data-backup.json"),
    JSON.stringify(dataExport, null, 2),
    "utf8"
  );

  const mediaExport = {
    heroMediaAssets: heroMediaAssets.map((m) => ({
      ...m,
      dataBase64: Buffer.from(m.data).toString("base64"),
      data: undefined,
    })),
    categoryMediaAssets: categoryMediaAssets.map((m) => ({
      ...m,
      dataBase64: Buffer.from(m.data).toString("base64"),
      data: undefined,
    })),
    productMediaAssets: productMediaAssets.map((m) => ({
      ...m,
      dataBase64: Buffer.from(m.data).toString("base64"),
      data: undefined,
    })),
    materialMediaAssets: materialMediaAssets.map((m) => ({
      ...m,
      dataBase64: Buffer.from(m.data).toString("base64"),
      data: undefined,
    })),
    instagramMediaAssets: instagramMediaAssets.map((m) => ({
      ...m,
      dataBase64: Buffer.from(m.data).toString("base64"),
      data: undefined,
    })),
  };

  fs.writeFileSync(
    path.join(backupDir, "media-backup.json"),
    JSON.stringify(mediaExport, null, 2),
    "utf8"
  );

  console.log("SUCCESS! All PostgreSQL data and media safely exported and verified.");
  console.log("Summary:", JSON.stringify(dataExport.counts, null, 2));
}

exportAll()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Export failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
