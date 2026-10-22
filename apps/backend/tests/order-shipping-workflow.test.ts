import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { validateEnv } from "../src/config/env.js";
import { prisma } from "../src/database/prisma.js";
import { signAdminToken } from "../src/utils/auth.js";

const env = validateEnv();
const app = createApp(env);

describe("Complete Order, GST, Shipping, and Customer Delivery Confirmation Workflow", () => {
  let adminToken: string;
  let customerCookie: string;
  let customerId: string;
  let testProductId: string;
  let testProductInitialStock = 15;
  let createdOrderId: string;
  let createdOrderNumber: string;

  beforeAll(async () => {
    // 1. Generate verified admin token
    adminToken = signAdminToken(
      { email: "admin@peralagae.com" },
      env.ADMIN_JWT_SECRET
    );

    // 2. Create customer account with completed profile
    const unique = Date.now().toString(36);
    const email = `workflow_customer_${unique}@peralagae.test`;
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "SecurePassword123!",
        fullName: "Maharani Gayatri Devi",
      });

    customerCookie = regRes.headers["set-cookie"]?.[0] || "";
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", customerCookie);

    customerId = meRes.body.data.customer.id;

    // Save full shipping profile
    await request(app)
      .put("/api/auth/profile")
      .set("Cookie", customerCookie)
      .send({
        recipientName: "Maharani Gayatri Devi",
        phone: "+919876543210",
        streetAddress: "City Palace, Jaleb Chowk",
        city: "Jaipur",
        state: "Rajasthan",
        pinCode: "302002",
        country: "India",
      });

    // 3. Create or ensure a sample product in MongoDB
    const category = await prisma.category.findFirst();
    const product = await prisma.product.create({
      data: {
        name: `Royal Kundan Choker ${unique}`,
        slug: `royal-kundan-choker-${unique}`,
        imageUrl: "/uploads/products/royal-choker.jpg",
        priceInr: 125000,
        stockCount: testProductInitialStock,
        inStock: true,
        isAvailable: true,
        ...(category?.id ? { categoryId: category.id } : {}),
      },
    });

    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up created records
    try {
      if (customerId) {
        const customerOrders = await prisma.order.findMany({ where: { customerId }, select: { id: true } });
        const orderIds = customerOrders.map((o) => o.id);
        if (orderIds.length > 0) {
          await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderShippingUpdate.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
      }
      if (testProductId) {
        await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
        await prisma.product.delete({ where: { id: testProductId } });
      }
      if (customerId) {
        await prisma.customerProfile.deleteMany({ where: { customerId } });
        await prisma.customerSession.deleteMany({ where: { customerId } });
        await prisma.customer.delete({ where: { id: customerId } });
      }
    } catch {
      // ignore cleanup errors
    }
  });

  describe("1. GST Settings API", () => {
    it("retrieves active global GST setting (defaults to 3% inclusive for gold jewellery)", async () => {
      const res = await request(app).get("/api/v1/gst/settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.setting).toBeDefined();
      expect(typeof res.body.data.setting.percentage).toBe("number");
      expect(res.body.data.setting.isInclusive).toBe(true);
    });

    it("allows admin to update GST rate and persists to MongoDB", async () => {
      const res = await request(app)
        .put("/api/v1/gst/admin/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          percentage: 3.0,
          isInclusive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.setting.percentage).toBe(3.0);
    });

    it("rejects invalid GST percentage (>40% or negative)", async () => {
      const res = await request(app)
        .put("/api/v1/gst/admin/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          percentage: 45, // Exceeds reasonable max
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Order Creation with UPI Simulation & Concurrency-Safe Stock", () => {
    it("rejects Cash on Delivery (COD) as unavailable", async () => {
      const res = await request(app)
        .post("/api/v1/orders/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 2 }],
          shippingAddress: {
            fullName: "Maharani Gayatri Devi",
            addressLine1: "City Palace, Jaleb Chowk",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302002",
            phone: "+919876543210",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("COD_NOT_ALLOWED");
    });

    it("places an order with UPI test payment simulation and deducts stock safely", async () => {
      const idempotencyKey = `idem_${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/orders/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 2 }],
          shippingAddress: {
            fullName: "Maharani Gayatri Devi",
            addressLine1: "City Palace, Jaleb Chowk",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302002",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
          idempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order).toBeDefined();
      createdOrderId = order.id;
      createdOrderNumber = order.orderNumber;

      // Assert Human-readable order number
      expect(createdOrderNumber).toMatch(/^PLG-\d{8}-[A-Z0-9]{4}$/);

      // Assert status and payment details
      expect(order.status).toBe("PLACED");
      expect(order.paymentMethod).toBe("UPI");
      expect(order.paymentStatus).toBe("SIMULATED");

      // Assert GST breakdown snapshot
      expect(order.gstRate).toBe(3.0);
      expect(order.gstInclusive).toBe(true);
      expect(order.taxInr).toBeGreaterThan(0);
      expect(order.totalInr).toBe(250000); // 125,000 * 2

      // Verify stock was safely decremented in MongoDB
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(updatedProduct?.stockCount).toBe(testProductInitialStock - 2);
    });

    it("returns identical order when resubmitted with same idempotency key", async () => {
      const idempotencyKey = `idem_${Date.now()}_retry`;
      const res1 = await request(app)
        .post("/api/v1/orders/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Maharani Gayatri Devi",
            addressLine1: "City Palace, Jaleb Chowk",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302002",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
          idempotencyKey,
        });

      expect(res1.status).toBe(201);
      const order1Id = res1.body.data.order.id;

      // Immediate retry with identical key
      const res2 = await request(app)
        .post("/api/v1/orders/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Maharani Gayatri Devi",
            addressLine1: "City Palace, Jaleb Chowk",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302002",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
          idempotencyKey,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.order.id).toBe(order1Id);
    });
  });

  describe("3. Admin Orders Management & Status Workflow", () => {
    it("allows admin to list real orders with search and pagination", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/admin?search=${createdOrderNumber}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.orders[0].orderNumber).toBe(createdOrderNumber);
    });

    it("allows admin to view single order details with customer and items", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/admin/${createdOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order.id).toBe(createdOrderId);
      expect(order.customer.email).toBeDefined();
      expect(order.items.length).toBe(1);
      expect(order.statusLogs.length).toBeGreaterThanOrEqual(1);
    });

    it("allows admin to transition status from PLACED to PROCESSING", async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/admin/${createdOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "PROCESSING",
          note: "Boutique artisan is packaging the hallmarked choker with insured seal.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe("PROCESSING");
    });

    it("strictly prevents admin from unilaterally marking order as DELIVERED", async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/admin/${createdOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "DELIVERED",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN_TRANSITION");
    });

    it("allows admin to dispatch order with shipping evidence images and description (transitions to SHIPPED)", async () => {
      // 1x1 transparent PNG buffer for mock image upload
      const dummyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );

      const res = await request(app)
        .post(`/api/v1/orders/admin/${createdOrderId}/shipping`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("carrierName", "Blue Dart Apex Insured")
        .field("trackingNumber", "BD-8899112233")
        .field(
          "description",
          "Package verified, tamper-proof luxury seal attached, handed to Blue Dart courier."
        )
        .attach("images", dummyPng, "dispatch_proof_1.png");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order.status).toBe("SHIPPED");
      expect(order.dispatchedAt).toBeDefined();
      expect(order.shippingUpdates.length).toBeGreaterThanOrEqual(1);
      expect(order.shippingUpdates[0].images.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. Customer Tracking & Receipt Confirmation", () => {
    it("allows authenticated customer to track their shipped order and view shipping evidence", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order.status).toBe("SHIPPED");
      expect(order.paymentStatus).toBe("SIMULATED");
      expect(order.shippingUpdates.length).toBeGreaterThanOrEqual(1);
      expect(order.shippingUpdates[0].carrierName).toBe("Blue Dart Apex Insured");
    });

    it("allows the owning customer to confirm delivery receipt (transitions to DELIVERED)", async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${createdOrderId}/confirm-delivery`)
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order.status).toBe("DELIVERED");
      expect(order.deliveredAt).toBeDefined();

      // Check status logs show customer confirmed
      const latestLog = order.statusLogs[order.statusLogs.length - 1];
      expect(latestLog.toStatus).toBe("DELIVERED");
      expect(latestLog.updatedByRole).toBe("CUSTOMER");
    });

    it("rejects duplicate delivery confirmation when order is already DELIVERED", async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${createdOrderId}/confirm-delivery`)
        .set("Cookie", customerCookie);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TRANSITION");
    });
  });
});
