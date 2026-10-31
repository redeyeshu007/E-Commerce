import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function purgeUserData() {
  console.log("Starting purge of all user accounts and history...\n");

  // 1. Order Status History
  const deletedStatusHistory = await prisma.orderStatusHistory.deleteMany({});
  console.log(`✓ Deleted ${deletedStatusHistory.count} order status history logs`);

  // 2. Order Shipping Updates
  const deletedShippingUpdates = await prisma.orderShippingUpdate.deleteMany({});
  console.log(`✓ Deleted ${deletedShippingUpdates.count} order shipping updates`);

  // 3. Order Items
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${deletedOrderItems.count} order items`);

  // 4. Orders
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} customer orders`);

  // 5. Shipping Media Assets
  const deletedShippingAssets = await prisma.shippingMediaAsset.deleteMany({});
  console.log(`✓ Deleted ${deletedShippingAssets.count} shipping media assets`);

  // 6. Razorpay Webhook Events
  const deletedWebhooks = await prisma.razorpayWebhookEvent.deleteMany({});
  console.log(`✓ Deleted ${deletedWebhooks.count} Razorpay webhook events`);

  // 7. Email Logs
  const deletedEmailLogs = await prisma.emailLog.deleteMany({});
  console.log(`✓ Deleted ${deletedEmailLogs.count} email notification logs`);

  // 8. Customer Carts
  const deletedCarts = await prisma.customerCart.deleteMany({});
  console.log(`✓ Deleted ${deletedCarts.count} customer carts`);

  // 9. Customer Sessions
  const deletedSessions = await prisma.customerSession.deleteMany({});
  console.log(`✓ Deleted ${deletedSessions.count} customer sessions`);

  // 10. Customer Profiles
  const deletedProfiles = await prisma.customerProfile.deleteMany({});
  console.log(`✓ Deleted ${deletedProfiles.count} customer profiles`);

  // 11. Customer Accounts
  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`✓ Deleted ${deletedCustomers.count} customer accounts`);

  console.log("\nVerifying remaining data in database...");
  const [
    remainingCustomers,
    remainingOrders,
    remainingOrderItems,
    remainingEmailLogs,
    remainingProducts,
    remainingCategories,
    remainingMaterials,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.emailLog.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.material.count(),
  ]);

  console.log(`Remaining Customers: ${remainingCustomers}`);
  console.log(`Remaining Orders: ${remainingOrders}`);
  console.log(`Remaining Order Items: ${remainingOrderItems}`);
  console.log(`Remaining Email Logs: ${remainingEmailLogs}`);
  console.log(`Catalog Products (Preserved): ${remainingProducts}`);
  console.log(`Catalog Categories (Preserved): ${remainingCategories}`);
  console.log(`Catalog Materials (Preserved): ${remainingMaterials}`);

  console.log("\nPURGE COMPLETED SUCCESSFULLY. Only the Admin account remains active.");

  await prisma.$disconnect();
}

purgeUserData().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});

