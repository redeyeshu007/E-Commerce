import { checkDatabaseConnection, prisma } from "../database/prisma.js";

async function main() {
  console.log("=== 1. Active MongoDB Connection Health Check ===");
  const health = await checkDatabaseConnection();
  console.log("Database status:", health);
  if (!health.connected) {
    throw new Error(`Health check failed: ${health.error}`);
  }

  console.log("\n=== 2. Category Model Check ===");
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  console.log(`Found ${categories.length} categories:`, categories.map((c) => c.name));

  console.log("\n=== 3. Product Model Check ===");
  const products = await prisma.product.findMany({
    take: 3,
    select: { id: true, name: true, slug: true, priceInr: true, categoryId: true },
  });
  console.log(`Found sample products:`, products);

  console.log("\n=== 4. Material Model & Relationship Check ===");
  const materials = await prisma.material.findMany({
    include: { homepageCards: true },
  });
  console.log(`Found ${materials.length} materials. Cards associated:`, materials.map((m) => ({ name: m.name, cardsCount: m.homepageCards.length })));

  console.log("\n=== 5. Hero & Navbar Settings Check ===");
  const hero = await prisma.heroSetting.findFirst();
  const navbar = await prisma.navbarSetting.findFirst();
  console.log("Hero version:", hero?.version);
  console.log("Navbar topBarText:", navbar?.topBarText);

  console.log("\n=== 6. Binary Media Asset Retrieval Check ===");
  const heroMedia = await prisma.heroMediaAsset.findFirst();
  console.log("Hero Media:", heroMedia ? { filename: heroMedia.filename, size: heroMedia.size, byteLength: heroMedia.data.length } : null);

  console.log("\n=== 7. Customer & Order Integrity Check ===");
  const customer = await prisma.customer.findFirst({
    include: { sessions: true, orders: { include: { items: true } } },
  });
  console.log("Sample Customer:", customer ? { email: customer.email, sessionsCount: customer.sessions.length, ordersCount: customer.orders.length } : null);

  console.log("\n=== 8. Store Details Check ===");
  const store = await prisma.storeDetails.findFirst();
  console.log("Store Details:", store);

  console.log("\nAll MongoDB validation checks PASSED successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Test failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
