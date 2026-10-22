import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MongoClient, Binary } from "mongodb";
import { prisma } from "../database/prisma.js";

async function bulkUpsert(collection: any, items: any[], transformFn: (item: any) => any) {
  if (!items || items.length === 0) return;
  // Ensure target collection is clean before importing exact source backup
  await collection.deleteMany({});
  const ops = items.map((item) => {
    const doc = transformFn(item);
    return {
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    };
  });
  // Execute in batches of 100
  for (let i = 0; i < ops.length; i += 100) {
    const batch = ops.slice(i, i + 100);
    await collection.bulkWrite(batch, { ordered: true });
  }
}

async function migrateData() {
  const backupDir = path.resolve(process.cwd(), "data", "postgres-backup");
  const dataBackupFile = path.join(backupDir, "data-backup.json");
  const mediaBackupFile = path.join(backupDir, "media-backup.json");

  if (!fs.existsSync(dataBackupFile)) {
    console.error("Backup file not found:", dataBackupFile);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataBackupFile, "utf8");
  const data = JSON.parse(rawData);

  console.log("Connecting directly to MongoDB Atlas for high-throughput migration...");
  const client = new MongoClient(process.env["MONGODB_URI"]!, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  await client.connect();
  const db = client.db("ecom");

  console.log("Connected. Migrating structured application records...");

  // 1. Navbar Settings
  await bulkUpsert(db.collection("navbar_settings"), data.navbarSettings, (item) => ({
    _id: item.id,
    topBarText: item.topBarText,
    topBarBgColor: item.topBarBgColor,
    topBarTextColor: item.topBarTextColor,
    topBarVisible: item.topBarVisible,
    topBarDismissible: item.topBarDismissible,
    secondPhone: item.secondPhone,
    secondPhoneHref: item.secondPhoneHref,
    secondPromoText: item.secondPromoText,
    secondCtaText: item.secondCtaText,
    secondCtaHref: item.secondCtaHref,
    secondLinks: item.secondLinks,
    secondPhoneVisible: item.secondPhoneVisible,
    secondPromoVisible: item.secondPromoVisible,
    secondLinksVisible: item.secondLinksVisible,
    version: item.version,
    topBarVersion: item.topBarVersion,
    secondNavbarVersion: item.secondNavbarVersion,
    updatedAt: new Date(item.updatedAt),
    updatedBy: item.updatedBy,
  }));
  console.log("✓ NavbarSettings migrated");

  // 2. Navbar History
  await bulkUpsert(db.collection("navbar_history"), data.navbarHistory, (item) => ({
    _id: item.id,
    section: item.section,
    snapshot: item.snapshot,
    description: item.description,
    version: item.version,
    createdAt: new Date(item.createdAt),
    createdBy: item.createdBy,
  }));
  console.log("✓ NavbarHistory migrated");

  // 3. Hero Settings
  await bulkUpsert(db.collection("hero_settings"), data.heroSettings, (item) => ({
    _id: item.id,
    heroImage1: item.heroImage1,
    heroImage2: item.heroImage2,
    heroImage3: item.heroImage3,
    heroImage1Version: item.heroImage1Version,
    heroImage2Version: item.heroImage2Version,
    heroImage3Version: item.heroImage3Version,
    version: item.version,
    updatedAt: new Date(item.updatedAt),
    updatedBy: item.updatedBy,
  }));
  console.log("✓ HeroSettings migrated");

  // 4. Hero History
  await bulkUpsert(db.collection("hero_history"), data.heroHistory, (item) => ({
    _id: item.id,
    slotId: item.slotId,
    snapshot: item.snapshot,
    version: item.version,
    imageUrl: item.imageUrl,
    normalHeadline: item.normalHeadline,
    boldHeadline: item.boldHeadline,
    description: item.description,
    createdAt: new Date(item.createdAt),
    createdBy: item.createdBy,
  }));
  console.log("✓ HeroHistory migrated");

  // 5. Store Details
  await bulkUpsert(db.collection("store_details"), data.storeDetails, (item) => ({
    _id: item.id,
    phone: item.phone,
    address: item.address,
    email: item.email,
    updatedAt: new Date(item.updatedAt),
    updatedBy: item.updatedBy,
  }));
  console.log("✓ StoreDetails migrated");

  // 6. Materials
  await bulkUpsert(db.collection("materials"), data.materials, (item) => ({
    _id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    order: item.order,
    isActive: item.isActive,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ Materials migrated");

  // 7. Material Section Settings
  await bulkUpsert(db.collection("material_section_settings"), data.materialSectionSettings, (item) => ({
    _id: item.id,
    heading: item.heading,
    version: item.version,
    updatedAt: new Date(item.updatedAt),
    updatedBy: item.updatedBy,
  }));
  console.log("✓ MaterialSectionSettings migrated");

  // 8. Material Section History
  await bulkUpsert(db.collection("material_section_history"), data.materialSectionHistory, (item) => ({
    _id: item.id,
    version: item.version,
    heading: item.heading,
    cards: item.cards,
    description: item.description,
    createdAt: new Date(item.createdAt),
    createdBy: item.createdBy,
  }));
  console.log("✓ MaterialSectionHistory migrated");

  // 9. Material Cards
  await bulkUpsert(db.collection("material_cards"), data.materialCards, (item) => ({
    _id: item.id,
    sectionId: item.sectionId,
    title: item.title,
    description: item.description,
    ctaText: item.ctaText,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    materialId: item.materialId,
    order: item.order,
    isActive: item.isActive,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ MaterialCards migrated");

  // 10. Instagram Section Settings
  await bulkUpsert(db.collection("instagram_section_settings"), data.instagramSectionSettings, (item) => ({
    _id: item.id,
    heading: item.heading,
    handle: item.handle,
    profileUrl: item.profileUrl,
    isActive: item.isActive,
    version: item.version,
    updatedAt: new Date(item.updatedAt),
    updatedBy: item.updatedBy,
  }));
  console.log("✓ InstagramSectionSettings migrated");

  // 11. Instagram Images
  await bulkUpsert(db.collection("instagram_images"), data.instagramImages, (item) => ({
    _id: item.id,
    sectionId: item.sectionId,
    imageUrl: item.imageUrl,
    altText: item.altText,
    postUrl: item.postUrl,
    order: item.order,
    isActive: item.isActive,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ InstagramImages migrated");

  // 12. Instagram Section History
  await bulkUpsert(db.collection("instagram_section_history"), data.instagramSectionHistory, (item) => ({
    _id: item.id,
    version: item.version,
    heading: item.heading,
    handle: item.handle,
    profileUrl: item.profileUrl,
    isActive: item.isActive,
    images: item.images,
    description: item.description,
    createdAt: new Date(item.createdAt),
    createdBy: item.createdBy,
  }));
  console.log("✓ InstagramSectionHistory migrated");

  // 13. Categories
  await bulkUpsert(db.collection("categories"), data.categories, (item) => ({
    _id: item.id,
    name: item.name,
    slug: item.slug,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    description: item.description,
    order: item.order,
    isActive: item.isActive,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ Categories migrated");

  // 14. Products
  await bulkUpsert(db.collection("products"), data.products, (item) => ({
    _id: item.id,
    slug: item.slug,
    name: item.name,
    categoryId: item.categoryId,
    categoryKey: item.categoryKey,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    priceInr: item.priceInr,
    compareAtPriceInr: item.compareAtPriceInr,
    isHot: item.isHot,
    isNew: item.isNew,
    isAvailable: item.isAvailable,
    inStock: item.inStock,
    stockCount: item.stockCount,
    materialId: item.materialId,
    material: item.material,
    materials: item.materials,
    sizes: item.sizes,
    images: item.images,
    description: item.description,
    productOverview: item.productOverview,
    productDetails: item.productDetails,
    descriptionParagraph1: item.descriptionParagraph1,
    descriptionParagraph2: item.descriptionParagraph2,
    specs: item.specs,
    careInstructions: item.careInstructions,
    additionalInfo: item.additionalInfo,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ Products migrated");

  // 15. Customers
  try {
    await db.collection("customers").dropIndex("customers_googleId_key");
  } catch {
    // index may not exist yet
  }
  await db.collection("customers").createIndex(
    { googleId: 1 },
    {
      name: "customers_googleId_key",
      unique: true,
      partialFilterExpression: { googleId: { $type: "string" } },
    }
  );

  await bulkUpsert(db.collection("customers"), data.customers, (item) => {
    const doc: any = {
      _id: item.id,
      email: item.email,
      fullName: item.fullName,
      passwordHash: item.passwordHash,
      isEmailVerified: item.isEmailVerified,
      role: item.role,
      resetPasswordToken: item.resetPasswordToken,
      resetPasswordExpires: item.resetPasswordExpires ? new Date(item.resetPasswordExpires) : null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
    if (item.googleId) {
      doc.googleId = item.googleId;
    }
    return doc;
  });
  console.log("✓ Customers migrated");

  // 16. Customer Sessions
  await bulkUpsert(db.collection("customer_sessions"), data.customerSessions, (item) => ({
    _id: item.id,
    customerId: item.customerId,
    token: item.token,
    expiresAt: new Date(item.expiresAt),
    userAgent: item.userAgent,
    ipAddress: item.ipAddress,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ CustomerSessions migrated");

  // 17. Orders
  await bulkUpsert(db.collection("orders"), data.orders, (item) => ({
    _id: item.id,
    orderNumber: item.orderNumber,
    customerId: item.customerId,
    status: item.status,
    subtotalInr: item.subtotalInr,
    discountInr: item.discountInr,
    shippingInr: item.shippingInr,
    taxInr: item.taxInr,
    totalInr: item.totalInr,
    shippingAddress: item.shippingAddress,
    paymentMethod: item.paymentMethod,
    paymentStatus: item.paymentStatus,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ Orders migrated");

  // 18. Order Items
  await bulkUpsert(db.collection("order_items"), data.orderItems, (item) => ({
    _id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    productImageUrl: item.productImageUrl,
    unitPriceInr: item.unitPriceInr,
    quantity: item.quantity,
    totalPriceInr: item.totalPriceInr,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  console.log("✓ OrderItems migrated");

  // 19. Binary Media Assets
  if (fs.existsSync(mediaBackupFile)) {
    console.log("Migrating Binary Media Assets...");
    const mediaData = JSON.parse(fs.readFileSync(mediaBackupFile, "utf8"));

    await bulkUpsert(db.collection("hero_media_assets"), mediaData.heroMediaAssets, (item) => ({
      _id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      data: new Binary(Buffer.from(item.dataBase64, "base64")),
      createdAt: new Date(item.createdAt),
    }));
    console.log("✓ HeroMediaAssets migrated");

    await bulkUpsert(db.collection("category_media_assets"), mediaData.categoryMediaAssets, (item) => ({
      _id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      data: new Binary(Buffer.from(item.dataBase64, "base64")),
      createdAt: new Date(item.createdAt),
    }));
    console.log("✓ CategoryMediaAssets migrated");

    await bulkUpsert(db.collection("product_media_assets"), mediaData.productMediaAssets, (item) => ({
      _id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      data: new Binary(Buffer.from(item.dataBase64, "base64")),
      createdAt: new Date(item.createdAt),
    }));
    console.log("✓ ProductMediaAssets migrated");

    await bulkUpsert(db.collection("material_media_assets"), mediaData.materialMediaAssets, (item) => ({
      _id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      data: new Binary(Buffer.from(item.dataBase64, "base64")),
      createdAt: new Date(item.createdAt),
    }));
    console.log("✓ MaterialMediaAssets migrated");

    await bulkUpsert(db.collection("instagram_media_assets"), mediaData.instagramMediaAssets, (item) => ({
      _id: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      data: new Binary(Buffer.from(item.dataBase64, "base64")),
      createdAt: new Date(item.createdAt),
    }));
    console.log("✓ InstagramMediaAssets migrated");
  }

  await client.close();

  // 20. Verify with Prisma Client
  console.log("Verifying complete migrated data with Prisma client against MongoDB Atlas...");
  const [
    mongoCategories,
    mongoProducts,
    mongoMaterials,
    mongoMaterialCards,
    mongoMaterialSectionSettings,
    mongoMaterialSectionHistory,
    mongoHeroSettings,
    mongoHeroHistory,
    mongoNavbarSettings,
    mongoNavbarHistory,
    mongoInstagramSectionSettings,
    mongoInstagramImages,
    mongoInstagramSectionHistory,
    mongoStoreDetails,
    mongoCustomers,
    mongoCustomerSessions,
    mongoOrders,
    mongoOrderItems,
    mongoHeroMediaAssets,
    mongoCategoryMediaAssets,
    mongoProductMediaAssets,
    mongoMaterialMediaAssets,
    mongoInstagramMediaAssets,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.material.count(),
    prisma.materialCard.count(),
    prisma.materialSectionSetting.count(),
    prisma.materialSectionHistory.count(),
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
    prisma.instagramMediaAsset.count(),
  ]);

  const mongoCounts = {
    categories: mongoCategories,
    products: mongoProducts,
    materials: mongoMaterials,
    materialCards: mongoMaterialCards,
    materialSectionSettings: mongoMaterialSectionSettings,
    materialSectionHistory: mongoMaterialSectionHistory,
    heroSettings: mongoHeroSettings,
    heroHistory: mongoHeroHistory,
    navbarSettings: mongoNavbarSettings,
    navbarHistory: mongoNavbarHistory,
    instagramSectionSettings: mongoInstagramSectionSettings,
    instagramImages: mongoInstagramImages,
    instagramSectionHistory: mongoInstagramSectionHistory,
    storeDetails: mongoStoreDetails,
    customers: mongoCustomers,
    customerSessions: mongoCustomerSessions,
    orders: mongoOrders,
    orderItems: mongoOrderItems,
    heroMediaAssets: mongoHeroMediaAssets,
    categoryMediaAssets: mongoCategoryMediaAssets,
    productMediaAssets: mongoProductMediaAssets,
    materialMediaAssets: mongoMaterialMediaAssets,
    instagramMediaAssets: mongoInstagramMediaAssets,
  };

  console.log("FINAL_MONGODB_VERIFIED_COUNTS:", JSON.stringify(mongoCounts, null, 2));

  let allMatched = true;
  for (const [key, expected] of Object.entries(data.counts)) {
    const actual = (mongoCounts as any)[key];
    if (actual !== expected) {
      console.error(`Count mismatch for ${key}: expected ${expected}, got ${actual}`);
      allMatched = false;
    }
  }

  if (allMatched) {
    console.log("MIGRATION_SUCCESS: 100% of PostgreSQL records and binary media migrated to MongoDB Atlas with perfect count parity!");
  } else {
    throw new Error("One or more record counts did not match expected source totals.");
  }
}

migrateData()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Migration failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
