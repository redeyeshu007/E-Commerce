import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { validateEnv } from "../src/config/env.js";
import { prisma } from "../src/database/prisma.js";
import { signAdminToken } from "../src/utils/auth.js";
import { EmailService } from "../src/services/email/email-service.js";

const env = validateEnv();
const app = createApp(env);

describe("PERALAGAE Jewellery — Production Readiness & Quality Audit E2E Suite", () => {
  let adminToken: string;
  let testCustomerId: string;
  let testCustomerCookie: string;
  let testCustomerEmail: string;
  let testCategoryId: string;
  let testProductId: string;
  let testOrderId: string;

  beforeAll(async () => {
    adminToken = signAdminToken({ email: "admin@peralagae.com" }, env.ADMIN_JWT_SECRET);

    // Seed test category and product
    const category = await prisma.category.create({
      data: {
        name: "Audit Royal Rings",
        slug: `audit-royal-rings-${Date.now()}`,
        imageUrl: "/images/categories/rings.jpg",
        order: 99,
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: "Nizam Polki Diamond Ring",
        slug: `nizam-polki-diamond-ring-${Date.now()}`,
        description: "Handcrafted 22kt hallmarked gold ring featuring natural uncut diamonds.",
        priceInr: 95000,
        categoryId: category.id,
        imageUrl: "/images/products/nizam-ring.jpg",
        inStock: true,
        stockCount: 10,
        images: ["/images/products/nizam-ring.jpg"],
        material: "22kt Gold",
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    try {
      if (testOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } });
        await prisma.orderShippingUpdate.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      if (testProductId) {
        await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
      if (testCategoryId) {
        await prisma.category.deleteMany({ where: { id: testCategoryId } });
      }
      if (testCustomerEmail) {
        await prisma.emailLog.deleteMany({ where: { recipientEmail: testCustomerEmail } });
        await prisma.customerCart.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.customerSession.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.customerProfile.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.customer.deleteMany({ where: { id: testCustomerId } });
      }
    } catch {
      // Safe teardown ignore
    }
  });

  // ── 1. Public Content & Homepage APIs ───────────────────────────────────────
  describe("1. Public Storefront & Catalogue APIs", () => {
    it("returns healthy service status and connected MongoDB state", async () => {
      const res = await request(app).get("/api/health/ready");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.database.connected).toBe(true);
    });

    it("fetches categories from MongoDB without hardcoded fallbacks", async () => {
      const res = await request(app).get("/api/v1/categories");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((c: any) => c.id === testCategoryId)).toBe(true);
    });

    it("fetches active products and verifies INR price calculations and stock availability", async () => {
      const res = await request(app).get("/api/v1/products?search=Nizam+Polki");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      const found = res.body.data.products.find((p: any) => p.id === testProductId);
      expect(found).toBeDefined();
      expect(found.priceInr).toBe(95000);
      expect(found.inStock).toBe(true);
      expect(found.stockCount).toBe(10);
    });

    it("retrieves product detail by slug safely", async () => {
      const product = await prisma.product.findUnique({ where: { id: testProductId } });
      const res = await request(app).get(`/api/v1/products/${product?.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProductId);
    });

    it("returns 404 for invalid/non-existent product slug", async () => {
      const res = await request(app).get("/api/v1/products/non-existent-luxury-item-404");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 2. Customer Authentication & Security Isolation ─────────────────────────
  describe("2. Customer Authentication & Data Protection", () => {
    it("registers new customer, hashes password with bcrypt, and initializes session", async () => {
      testCustomerEmail = `audit_client_${Date.now()}@peralagae.test`;
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: testCustomerEmail,
          password: "RoyalCustomer2026!",
          confirmPassword: "RoyalCustomer2026!",
          fullName: "Princess Gayatri Devi",
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      testCustomerId = regRes.body.data.customer.id;
      testCustomerCookie = regRes.headers["set-cookie"]?.[0] || "";

      // Verify password is NOT stored as plaintext in MongoDB
      const customer = await prisma.customer.findUnique({ where: { id: testCustomerId } });
      expect(customer).not.toBeNull();
      expect(customer?.passwordHash).not.toBe("RoyalCustomer2026!");
      expect(customer?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("safely rejects duplicate customer registration with HTTP 409", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: testCustomerEmail,
          password: "RoyalCustomer2026!",
          confirmPassword: "RoyalCustomer2026!",
          fullName: "Princess Gayatri Devi",
        });

      expect(regRes.status).toBe(409);
      expect(regRes.body.success).toBe(false);
    });

    it("rejects login attempt with incorrect password", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: testCustomerEmail,
          password: "WrongPassword123!",
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.success).toBe(false);
    });

    it("authenticates customer with valid credentials and sets secure cookie", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: testCustomerEmail,
          password: "RoyalCustomer2026!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.headers["set-cookie"]).toBeDefined();
    });

    it("prevents customer token from accessing admin-only routes (RBAC check)", async () => {
      const adminRes = await request(app)
        .get("/api/emails/admin/stats")
        .set("Cookie", testCustomerCookie);

      expect(adminRes.status).toBe(401);
      expect(adminRes.body.success).toBe(false);
    });
  });

  // ── 3. Shopping Cart Synchronization & MongoDB Persistence ─────────────────
  describe("3. Shopping Cart Operations & Isolation", () => {
    it("synchronizes customer shopping cart to MongoDB via PUT /api/cart", async () => {
      const syncRes = await request(app)
        .put("/api/cart")
        .set("Cookie", testCustomerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 2 }],
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);

      const cartInDb = await prisma.customerCart.findUnique({
        where: { customerId: testCustomerId },
      });

      expect(cartInDb).not.toBeNull();
      const items = cartInDb?.items as any[];
      expect(items.length).toBe(1);
      expect(items[0].productId).toBe(testProductId);
      expect(items[0].quantity).toBe(2);
    });

    it("retrieves saved cart items with verified product pricing from MongoDB", async () => {
      const getRes = await request(app)
        .get("/api/cart")
        .set("Cookie", testCustomerCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.items.length).toBe(1);
      expect(getRes.body.data.items[0].product.priceInr).toBe(95000);
      expect(getRes.body.data.subtotalInr).toBe(190000);
    });
  });

  // ── 4. Checkout, 3% GST Calculation & Razorpay Order Creation ───────────────
  describe("4. Checkout, Tax Compliance & Razorpay Order Generation", () => {
    it("completes customer shipping profile and creates order with 3% GST & Razorpay details", async () => {
      // Complete profile first (required for secure checkout)
      const profRes = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", testCustomerCookie)
        .send({
          recipientName: "Princess Gayatri Devi",
          phone: "+919876543210",
          streetAddress: "Palace Boulevard",
          city: "Jaipur",
          state: "Rajasthan",
          pinCode: "302006",
          country: "India",
        });
      expect(profRes.status).toBe(200);

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set("Cookie", testCustomerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Princess Gayatri Devi",
            addressLine: "Palace Boulevard",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302006",
            country: "India",
            phone: "+919876543210",
          },
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.order.orderNumber).toBeDefined();

      testOrderId = createRes.body.data.order.id;
      const order = createRes.body.data.order;
      const razorpay = createRes.body.data.razorpay;

      // Price verification: 95,000 INR
      expect(order.subtotalInr).toBe(95000);
      expect(order.totalInr).toBe(95000);
      expect(order.gstRate).toBe(3.0);
      expect(order.gstInclusive).toBe(true);

      // Razorpay details: amount must be in paise (1 INR = 100 paise)
      expect(razorpay.amount).toBe(9500000);
      expect(razorpay.currency).toBe("INR");
      expect(razorpay.orderId).toBeDefined();
    });

    it("rejects invalid payment signature during payment verification", async () => {
      const fakeVerifyRes = await request(app)
        .post("/api/v1/orders/verify-payment")
        .set("Cookie", testCustomerCookie)
        .send({
          orderId: testOrderId,
          razorpayOrderId: "order_fake_123",
          razorpayPaymentId: "pay_fake_456",
          razorpaySignature: "invalid_cryptographic_signature_hash",
        });

      expect(fakeVerifyRes.status).toBe(400);
      expect(fakeVerifyRes.body.success).toBe(false);

      // Order status must remain PLACED (not marked PAID)
      const orderInDb = await prisma.order.findUnique({ where: { id: testOrderId } });
      expect(orderInDb?.paymentStatus).not.toBe("PAID");
    });
  });

  // ── 5. SMTP Email Service Verification ──────────────────────────────────────
  describe("5. Nodemailer SMTP Reliability & Security", () => {
    it("confirms SMTP connection verification endpoint works via admin route", async () => {
      const smtpRes = await request(app)
        .post("/api/emails/admin/smtp/verify")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(smtpRes.status).toBe(200);
      expect(smtpRes.body.success).toBe(true);
    });

    it("reports provider as SMTP in admin delivery statistics", async () => {
      const statsRes = await request(app)
        .get("/api/emails/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.provider).toBe("SMTP");
      expect(statsRes.body.data.smtpPort).toBe(587);
    });
  });
});
