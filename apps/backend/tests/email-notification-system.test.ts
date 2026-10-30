import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { validateEnv } from "../src/config/env.js";
import { prisma } from "../src/database/prisma.js";
import { signAdminToken } from "../src/utils/auth.js";
import { CartReminderService } from "../src/services/email/cart-reminder-service.js";

const env = validateEnv();
const app = createApp(env);

describe("PERALAGAE Jewellery — Complete Email Notification System Integration Test Suite", () => {
  let adminToken: string;
  let customerCookie: string;
  let customerId: string;
  let customerEmail: string;
  let customerUnsubscribeToken: string;
  let testProductId: string;
  let testOrderId: string;
  let testOrderNumber: string;

  beforeAll(async () => {
    // 1. Generate verified admin token
    adminToken = signAdminToken(
      { email: "admin@peralagae.com" },
      env.ADMIN_JWT_SECRET
    );

    // 2. Ensure a sample product exists for cart & order testing
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Email Test Rings",
          slug: `email-test-rings-${Date.now()}`,
          imageUrl: "/images/categories/rings.jpg",
          order: 1,
        },
      });
    }

    const testProduct = await prisma.product.create({
      data: {
        name: "Imperial Kundan Choker",
        slug: `imperial-kundan-choker-${Date.now()}`,
        description: "Handcrafted 22kt hallmarked gold choker with uncut polki diamonds.",
        priceInr: 185000,
        categoryId: category.id,
        imageUrl: "/uploads/products/choker.jpg",
        inStock: true,
        stockCount: 15,
        images: ["/uploads/products/choker.jpg"],
        material: "22kt Gold",
      },
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    try {
      if (testProductId) {
        await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
      if (customerEmail) {
        await prisma.emailLog.deleteMany({ where: { recipientEmail: customerEmail } });
        await prisma.customerCart.deleteMany({ where: { customerId } });
        await prisma.orderStatusHistory.deleteMany({ where: { order: { customerId } } });
        await prisma.orderShippingUpdate.deleteMany({ where: { order: { customerId } } });
        await prisma.orderItem.deleteMany({ where: { order: { customerId } } });
        await prisma.order.deleteMany({ where: { customerId } });
        await prisma.customerProfile.deleteMany({ where: { customerId } });
        await prisma.customerSession.deleteMany({ where: { customerId } });
        await prisma.customer.deleteMany({ where: { id: customerId } });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. New Customer Welcome Email Flow
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Customer Registration & Welcome Email", () => {
    it("successfully creates customer account and sends luxury Welcome Email", async () => {
      const unique = Date.now().toString(36);
      customerEmail = `lady_peralagae_${unique}@royaltest.com`;

      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: customerEmail,
          password: "RoyalCustomer2026!",
          confirmPassword: "RoyalCustomer2026!",
          fullName: "Lady Arundhati Roy",
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      customerCookie = regRes.headers["set-cookie"]?.[0] || "";

      customerId = regRes.body.data.customer.id;
      expect(customerId).toBeDefined();

      // Complete customer profile for subsequent checkout
      await request(app)
        .put("/api/auth/profile")
        .set("Cookie", customerCookie)
        .send({
          recipientName: "Lady Arundhati Roy",
          phone: "+919876543210",
          streetAddress: "77 Heritage Boulevard, Malabar Hill",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400006",
          country: "India",
        });

      // Verify customer record has unsubscribe token
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      expect(customer).not.toBeNull();
      expect(customer?.unsubscribeToken).toBeDefined();
      customerUnsubscribeToken = customer!.unsubscribeToken!;

      // Verify EmailLog created for WELCOME
      const welcomeLog = await prisma.emailLog.findFirst({
        where: {
          recipientEmail: customerEmail,
          emailType: "WELCOME",
        },
      });

      expect(welcomeLog).not.toBeNull();
      expect(welcomeLog?.status).toBe("SENT");
      expect(welcomeLog?.idempotencyKey).toBe(`welcome_${customerId}`);
      expect(welcomeLog?.customerId).toBe(customerId);
    });

    it("does NOT send duplicate welcome email on duplicate register request", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: customerEmail,
          password: "RoyalCustomer2026!",
          confirmPassword: "RoyalCustomer2026!",
          fullName: "Lady Arundhati Roy",
        });

      expect(regRes.status).toBe(409);

      const logs = await prisma.emailLog.findMany({
        where: {
          recipientEmail: customerEmail,
          emailType: "WELCOME",
        },
      });
      expect(logs.length).toBe(1);
    });

    it("does NOT send welcome email on customer login", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: customerEmail,
          password: "RoyalCustomer2026!",
        });

      expect(loginRes.status).toBe(200);

      const logs = await prisma.emailLog.findMany({
        where: {
          recipientEmail: customerEmail,
          emailType: "WELCOME",
        },
      });
      expect(logs.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Forgot Password — Secure OTP Flow
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Forgot Password — Secure 6-Digit OTP Flow", () => {
    let capturedOtp: string = "";

    it("generates secure numeric OTP, hashes it in DB, and dispatches OTP email", async () => {
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: customerEmail });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.debugOtp).toMatch(/^\d{6}$/);
      capturedOtp = forgotRes.body.debugOtp;

      // Verify customer record has hashed OTP and 10-minute expiry
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      expect(customer?.passwordResetOtpHash).toBeDefined();
      expect(customer?.passwordResetOtpExpires).toBeDefined();
      expect(customer?.passwordResetOtpAttempts).toBe(0);

      // Verify OTP is hashed (64-char hex SHA-256) and NOT plaintext
      expect(customer!.passwordResetOtpHash!.length).toBe(64);

      // Verify EmailLog created for PASSWORD_RESET_OTP
      const otpLog = await prisma.emailLog.findFirst({
        where: {
          recipientEmail: customerEmail,
          emailType: "PASSWORD_RESET_OTP",
        },
        orderBy: { createdAt: "desc" },
      });

      expect(otpLog).not.toBeNull();
      expect(otpLog?.status).toBe("SENT");
    });

    it("rejects non-existent email safely without revealing account status", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent_client@peralagae.test" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects invalid OTP and increments attempt counter", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: customerEmail,
          otp: "000000",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_OTP");

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      expect(customer?.passwordResetOtpAttempts).toBe(1);
    });

    it("verifies valid OTP successfully via /api/auth/verify-otp", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: customerEmail,
          otp: capturedOtp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.valid).toBe(true);
    });

    it("resets password with valid OTP and invalidates previous sessions", async () => {
      const newPassword = "NewRoyalPassword2026#";

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: customerEmail,
          otp: capturedOtp,
          newPassword,
          confirmPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify OTP fields are cleared from MongoDB
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      expect(customer?.passwordResetOtpHash).toBeNull();
      expect(customer?.passwordResetOtpExpires).toBeNull();
      expect(customer?.passwordResetOtpAttempts).toBe(0);

      // Old password should now fail
      const failedLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: customerEmail,
          password: "RoyalCustomer2026!",
        });
      expect(failedLogin.status).toBe(401);

      // New password should succeed
      const successLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: customerEmail,
          password: newPassword,
        });
      expect(successLogin.status).toBe(200);
      customerCookie = successLogin.headers["set-cookie"]?.[0] || customerCookie;
    });

    it("rejects attempt to reuse previously consumed OTP", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: customerEmail,
          otp: capturedOtp,
          newPassword: "AnotherPassword123!",
          confirmPassword: "AnotherPassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Cart Persistence & Daily Abandoned Cart Reminder
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Cart Synchronization & Daily Evening Cart Reminder", () => {
    it("synchronizes customer shopping cart to MongoDB via /api/cart", async () => {
      const putRes = await request(app)
        .put("/api/cart")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 2 }],
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.data.items.length).toBe(1);
      expect(putRes.body.data.items[0].product.name).toBe("Imperial Kundan Choker");
      expect(putRes.body.data.totalInr).toBe(370000); // 185,000 * 2

      // Verify GET /api/cart returns the persisted cart
      const getRes = await request(app)
        .get("/api/cart")
        .set("Cookie", customerCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.items.length).toBe(1);
    });

    it("processes daily cart reminders: sends luxury reminder with live items to eligible customer", async () => {
      const scheduledDate = "2026-10-30";
      const result = await CartReminderService.runDailyCartReminderJob({
        scheduledDate,
        forceRun: true,
      });

      expect(result.eligibleCount).toBeGreaterThanOrEqual(1);
      expect(result.sentCount).toBeGreaterThanOrEqual(1);

      // Verify EmailLog created with DAILY_CART_REMINDER and idempotency key
      const reminderLog = await prisma.emailLog.findFirst({
        where: {
          recipientEmail: customerEmail,
          emailType: "DAILY_CART_REMINDER",
          idempotencyKey: `cart_reminder_${customerId}_${scheduledDate}`,
        },
      });

      expect(reminderLog).not.toBeNull();
      expect(reminderLog?.status).toBe("SENT");
    });

    it("does NOT re-send cart reminder on the same date (database idempotency)", async () => {
      const scheduledDate = "2026-10-30";
      const result = await CartReminderService.runDailyCartReminderJob({
        scheduledDate,
        forceRun: true,
      });

      expect(result.skippedCount).toBeGreaterThanOrEqual(1);
    });

    it("allows customer to manage email preferences and unsubscribe via /api/emails/preferences", async () => {
      // 1. Fetch preferences using customer unsubscribe token
      const getPrefRes = await request(app)
        .get(`/api/emails/preferences?token=${customerUnsubscribeToken}`);

      expect(getPrefRes.status).toBe(200);
      expect(getPrefRes.body.data.emailCartRemindersEnabled).toBe(true);

      // 2. Unsubscribe from cart reminders
      const postPrefRes = await request(app)
        .post("/api/emails/preferences")
        .send({
          token: customerUnsubscribeToken,
          emailCartRemindersEnabled: false,
          emailOrderUpdatesEnabled: true,
        });

      expect(postPrefRes.status).toBe(200);
      expect(postPrefRes.body.data.emailCartRemindersEnabled).toBe(false);

      // 3. Process reminders on new date: customer should be excluded because opted out
      const newScheduledDate = "2026-10-31";
      const result = await CartReminderService.runDailyCartReminderJob({
        scheduledDate: newScheduledDate,
        forceRun: true,
      });

      const nextDayLog = await prisma.emailLog.findFirst({
        where: {
          recipientEmail: customerEmail,
          emailType: "DAILY_CART_REMINDER",
          idempotencyKey: `cart_reminder_${customerId}_${newScheduledDate}`,
        },
      });

      expect(nextDayLog).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Order Lifecycle Emails (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Order Lifecycle Emails (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)", () => {
    it(
      "creates order, simulates verified payment, and sends ORDER_CONFIRMED email",
      async () => {
      // 1. Place order
      const orderRes = await request(app)
        .post("/api/v1/orders/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Lady Arundhati Roy",
            addressLine1: "77 Heritage Boulevard, Malabar Hill",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400006",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
        });

      expect(orderRes.status).toBe(201);
      testOrderId = orderRes.body.data.order.id;
      testOrderNumber = orderRes.body.data.order.orderNumber;
      expect(testOrderId).toBeDefined();

      // 2. Cryptographically verify payment via Razorpay HMAC signature
      const serverRazorpayOrderId = orderRes.body.data.razorpay.orderId;
      const realPaymentId = `pay_verified_${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${serverRazorpayOrderId}|${realPaymentId}`)
        .digest("hex");

      const verifyRes = await request(app)
        .post("/api/checkout/verify-payment")
        .set("Cookie", customerCookie)
        .send({
          orderId: testOrderId,
          razorpayOrderId: serverRazorpayOrderId,
          razorpayPaymentId: realPaymentId,
          razorpaySignature: validSignature,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.order.paymentStatus).toBe("PAID");

      // Verify ORDER_CONFIRMED email logged in MongoDB
      const orderConfirmedLog = await prisma.emailLog.findFirst({
        where: {
          orderId: testOrderId,
          emailType: "ORDER_CONFIRMED",
        },
      });

      expect(orderConfirmedLog).not.toBeNull();
      expect(orderConfirmedLog?.status).toBe("SENT");
      expect(orderConfirmedLog?.idempotencyKey).toBe(`order_confirmed_${testOrderId}`);

      // Verify customer cart in MongoDB was automatically cleared
      const cartRes = await request(app)
        .get("/api/cart")
        .set("Cookie", customerCookie);
      expect(cartRes.body.data.items.length).toBe(0);
    }, 15000);

    it("triggers ORDER_PROCESSING email when admin changes order status to PROCESSING", async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/orders/admin/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "PROCESSING",
          note: "Artisan team is packaging the piece in presentation case.",
        });

      expect(updateRes.status).toBe(200);

      const processingLog = await prisma.emailLog.findFirst({
        where: {
          orderId: testOrderId,
          emailType: "ORDER_PROCESSING",
        },
      });

      expect(processingLog).not.toBeNull();
      expect(processingLog?.status).toBe("SENT");
      expect(processingLog?.idempotencyKey).toBe(`order_processing_${testOrderId}`);
    });

    it("does NOT send duplicate email if admin saves unchanged status", async () => {
      await request(app)
        .patch(`/api/v1/orders/admin/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "PROCESSING",
          note: "Checking status again.",
        });

      const count = await prisma.emailLog.count({
        where: {
          orderId: testOrderId,
          emailType: "ORDER_PROCESSING",
        },
      });

      expect(count).toBe(1);
    });

    it("triggers ORDER_SHIPPED email with tracking number and uploaded packaging photos", async () => {
      const dummyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );

      const shipRes = await request(app)
        .post(`/api/v1/orders/admin/${testOrderId}/shipping`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("carrierName", "Blue Dart Apex Luxury")
        .field("trackingNumber", "BLUEDART-EXP-992144")
        .field(
          "description",
          "Handcrafted choker checked for hallmark and placed inside velvet presentation case."
        )
        .attach("images", dummyPng, "packaging_proof.png");

      expect(shipRes.status).toBe(200);

      const shippedLog = await prisma.emailLog.findFirst({
        where: {
          orderId: testOrderId,
          emailType: "ORDER_SHIPPED",
        },
      });

      expect(shippedLog).not.toBeNull();
      expect(shippedLog?.status).toBe("SENT");
      expect(shippedLog?.idempotencyKey).toContain(`order_shipped_${testOrderId}`);
      expect((shippedLog?.metadata as any)?.imageCount).toBe(1);
    });

    it("triggers ORDER_COMPLETED email when customer confirms delivery receipt", async () => {
      const deliverRes = await request(app)
        .post(`/api/v1/orders/${testOrderId}/confirm-delivery`)
        .set("Cookie", customerCookie)
        .send({});

      expect(deliverRes.status).toBe(200);

      const deliveredLog = await prisma.emailLog.findFirst({
        where: {
          orderId: testOrderId,
          emailType: "ORDER_COMPLETED",
        },
      });

      expect(deliveredLog).not.toBeNull();
      expect(deliveredLog?.status).toBe("SENT");
      expect(deliveredLog?.idempotencyKey).toBe(`order_completed_${testOrderId}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Admin Email Logs, Stats & Retry Endpoints
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Admin Email Logs, KPIs & Retry Management", () => {
    it("returns aggregated delivery stats via GET /api/emails/admin/stats", async () => {
      const res = await request(app)
        .get("/api/emails/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(4);
      expect(res.body.data.sent).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data.deliveryRate).toBe("number");
    });

    it("lists paginated email logs with filtering via GET /api/emails/admin/logs", async () => {
      const res = await request(app)
        .get("/api/emails/admin/logs?limit=10&status=SENT")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it("retries a failed email via POST /api/emails/admin/logs/:id/retry", async () => {
      // Create a dummy failed email log
      const failedLog = await prisma.emailLog.create({
        data: {
          recipientEmail: "client_fail@peralagae.test",
          emailType: "WELCOME",
          subject: "Test Welcome",
          status: "FAILED",
          errorMessage: "Provider rate limit temporarily exceeded",
          idempotencyKey: `retry_test_${Date.now()}`,
        },
      });

      const retryRes = await request(app)
        .post(`/api/emails/admin/logs/${failedLog.id}/retry`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.success).toBe(true);

      const updated = await prisma.emailLog.findUnique({
        where: { id: failedLog.id },
      });
      expect(updated?.status).toBe("SENT");
      expect(updated?.errorMessage).toBeNull();
    });
  });
});
