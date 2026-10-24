import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { prisma } from "../src/database/prisma.js";
import { OrderService } from "../src/services/order-service.js";
import { RazorpayService } from "../src/services/razorpay-service.js";

describe("PERALAGAE — End-to-End Razorpay Payment Gateway Integration Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  const timestamp = Date.now();
  const customerEmail = `rzp_test_user_${timestamp}@peralagae.com`;
  const attackerEmail = `rzp_attacker_${timestamp}@peralagae.com`;
  const testPassword = "CustomerSecurePassword2026!";

  let customerCookie = "";
  let attackerCookie = "";
  let sampleProduct: { id: string; name: string; priceInr: number; stockCount: number };
  let createdOrderId = "";
  let serverRazorpayOrderId = "";
  let orderTotalPaise = 0;

  // Use RazorpayService helper to generate valid signatures
  const razorpayService = OrderService.getRazorpayService();

  beforeAll(async () => {
    // 1. Ensure sample product with guaranteed stock exists
    const prod = await prisma.product.findFirst({
      where: { inStock: true, isAvailable: true, stockCount: { gte: 10 } },
    });

    if (prod) {
      sampleProduct = prod;
    } else {
      sampleProduct = await prisma.product.create({
        data: {
          name: "Test 22K Royal Gold Choker",
          slug: `test-royal-gold-choker-${timestamp}`,
          priceInr: 125000,
          stockCount: 20,
          inStock: true,
          isAvailable: true,
          description: "Hallmarked 22K gold choker for integration testing",
          imageUrl: "/uploads/products/test-choker.jpg",
          material: "GOLD",
        },
      });
    }

    // 2. Register and authenticate customer
    const regCust = await request(app).post("/api/auth/register").send({
      fullName: "Ananya Sharma",
      email: customerEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    customerCookie = Array.isArray(regCust.headers["set-cookie"])
      ? regCust.headers["set-cookie"].join(";")
      : (regCust.headers["set-cookie"] as string);

    // Complete customer profile
    await request(app)
      .put("/api/auth/profile")
      .set("Cookie", customerCookie)
      .send({
        recipientName: "Ananya Sharma",
        phone: "+919876543210",
        streetAddress: "123 Nariman Point",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400021",
        country: "India",
      });

    // 3. Register second customer (attacker) for ownership test
    const regAttacker = await request(app).post("/api/auth/register").send({
      fullName: "Attacker User",
      email: attackerEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    attackerCookie = Array.isArray(regAttacker.headers["set-cookie"])
      ? regAttacker.headers["set-cookie"].join(";")
      : (regAttacker.headers["set-cookie"] as string);

    await request(app)
      .put("/api/auth/profile")
      .set("Cookie", attackerCookie)
      .send({
        recipientName: "Attacker User",
        phone: "+919876543299",
        streetAddress: "456 Fake Street",
        city: "Pune",
        state: "Maharashtra",
        pinCode: "411001",
        country: "India",
      });
  });

  describe("1. Public Gateway Configuration", () => {
    it("returns public Razorpay Key ID, currency, and mode at GET /api/checkout/config without exposing secrets", async () => {
      const res = await request(app).get("/api/checkout/config");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.keyId).toBeDefined();
      expect(res.body.data.currency).toBe("INR");
      expect(["test", "live"]).toContain(res.body.data.mode);

      // Verify that secret keys are NEVER exposed
      expect(res.body.data.keySecret).toBeUndefined();
      expect(res.body.data.webhookSecret).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(env.RAZORPAY_KEY_SECRET);
      expect(JSON.stringify(res.body)).not.toContain(env.RAZORPAY_WEBHOOK_SECRET);
    });
  });

  describe("2. Server-Side Order Creation & Razorpay Order Generation", () => {
    it("creates local order and server-created Razorpay order with exact payable amount in paise", async () => {
      const initialStock = sampleProduct.stockCount;
      const quantity = 1;

      // Attempt client injection of fake prices, manipulated totals, and PAID status
      const res = await request(app)
        .post("/api/checkout/create-order")
        .set("Cookie", customerCookie)
        .send({
          paymentStatus: "PAID", // Injected client status - MUST BE IGNORED
          total: 10, // Manipulated low total - MUST BE IGNORED
          items: [{ productId: sampleProduct.id, quantity }],
          shippingAddress: {
            fullName: "Ananya Sharma",
            addressLine1: "123 Nariman Point",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400021",
            country: "India",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const { order, razorpay } = res.body.data;
      createdOrderId = order.id;
      serverRazorpayOrderId = razorpay.orderId;

      // Authoritative pricing check
      expect(order.subtotalInr).toBe(sampleProduct.priceInr);
      expect(order.totalInr).toBe(sampleProduct.priceInr);
      expect(order.paymentProvider).toBe("RAZORPAY");
      expect(order.paymentStatus).toBe("PENDING"); // Injected "PAID" was properly overridden to "PENDING"
      expect(order.currency).toBe("INR");

      // Razorpay Order ID check
      expect(razorpay.orderId).toBeDefined();
      expect(order.razorpayOrderId).toBe(razorpay.orderId);

      // Amount in paise check
      orderTotalPaise = Math.round(order.totalInr * 100);
      expect(razorpay.amount).toBe(orderTotalPaise);
      expect(razorpay.currency).toBe("INR");
      expect(razorpay.keyId).toBeDefined();

      // Verify concurrency-safe stock deduction occurred
      const updatedProd = await prisma.product.findUnique({
        where: { id: sampleProduct.id },
      });
      expect(updatedProd?.stockCount).toBe(initialStock - quantity);
    });

    it("strictly rejects Cash on Delivery (COD) during checkout", async () => {
      const res = await request(app)
        .post("/api/checkout/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: {
            fullName: "Ananya Sharma",
            addressLine1: "123 Nariman Point",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400021",
            country: "India",
            phone: "+919876543210",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("COD_NOT_ALLOWED");
    });
  });

  describe("3. Cryptographic Payment Signature Verification", () => {
    it("rejects invalid or tampered payment signature with 400 INVALID_SIGNATURE", async () => {
      const fakePaymentId = `pay_fake_${Date.now()}`;
      const invalidSignature = "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";

      const res = await request(app)
        .post("/api/checkout/verify-payment")
        .set("Cookie", customerCookie)
        .send({
          orderId: createdOrderId,
          razorpayOrderId: serverRazorpayOrderId,
          razorpayPaymentId: fakePaymentId,
          razorpaySignature: invalidSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_SIGNATURE");

      // Verify order status remains PENDING in MongoDB
      const currentOrder = await prisma.order.findUnique({
        where: { id: createdOrderId },
      });
      expect(currentOrder?.paymentStatus).toBe("PENDING");
    });

    it("prevents Customer B from verifying payment for Customer A's order (ownership enforcement)", async () => {
      const paymentId = `pay_attacker_${Date.now()}`;
      // Calculate valid signature for this order ID and payment ID
      const validSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${serverRazorpayOrderId}|${paymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/checkout/verify-payment")
        .set("Cookie", attackerCookie) // Attacker tries to verify Customer A's order
        .send({
          orderId: createdOrderId,
          razorpayOrderId: serverRazorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("accepts valid cryptographic signature and transitions order to PAID atomically", async () => {
      const realPaymentId = `pay_verified_${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${serverRazorpayOrderId}|${realPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/checkout/verify-payment")
        .set("Cookie", customerCookie)
        .send({
          orderId: createdOrderId,
          razorpayOrderId: serverRazorpayOrderId,
          razorpayPaymentId: realPaymentId,
          razorpaySignature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe("PAID");
      expect(res.body.data.order.razorpayPaymentId).toBe(realPaymentId);
      expect(res.body.data.order.paymentCapturedAt).toBeDefined();

      // Verify persisted directly in MongoDB
      const dbOrder = await prisma.order.findUnique({
        where: { id: createdOrderId },
      });
      expect(dbOrder?.paymentStatus).toBe("PAID");
      expect(dbOrder?.razorpayPaymentId).toBe(realPaymentId);
    });

    it("handles duplicate verification requests idempotently without error", async () => {
      const paymentId = `pay_duplicate_${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${serverRazorpayOrderId}|${paymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/checkout/verify-payment")
        .set("Cookie", customerCookie)
        .send({
          orderId: createdOrderId,
          razorpayOrderId: serverRazorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe("PAID");
    });
  });

  describe("4. Webhook Signature Verification & Event Processing", () => {
    it("rejects webhook requests with invalid or missing X-Razorpay-Signature", async () => {
      const res = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("x-razorpay-signature", "invalid_signature_hex")
        .send({
          event: "payment.captured",
          payload: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    it("processes payment.captured event, updates order to PAID, and ignores duplicates idempotently", async () => {
      // 1. Create a second order in PENDING state to test webhook capture
      const createRes = await request(app)
        .post("/api/checkout/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: {
            fullName: "Ananya Sharma",
            addressLine1: "123 Nariman Point",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400021",
            country: "India",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
        });

      const secondOrder = createRes.body.data.order;
      const secondRzpOrderId = createRes.body.data.razorpay.orderId;
      const secondPaymentId = `pay_webhook_cap_${Date.now()}`;
      const eventId = `evt_test_${Date.now()}`;

      const webhookPayload = {
        event_id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: secondPaymentId,
              order_id: secondRzpOrderId,
              amount: Math.round(secondOrder.totalInr * 100),
              currency: "INR",
              status: "captured",
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      // First webhook delivery
      const res1 = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(webhookPayload);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe("ok");

      // Verify order was marked PAID in MongoDB
      const updatedOrder = await prisma.order.findUnique({
        where: { id: secondOrder.id },
      });
      expect(updatedOrder?.paymentStatus).toBe("PAID");
      expect(updatedOrder?.razorpayPaymentId).toBe(secondPaymentId);

      // Second duplicate webhook delivery with same event_id
      const res2 = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(webhookPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.result?.status).toBe("ignored");
    });

    it("processes payment.failed event: marks order FAILED and restores product stock", async () => {
      const stockBefore = (await prisma.product.findUnique({ where: { id: sampleProduct.id } }))
        ?.stockCount || 0;

      // Create an order
      const createRes = await request(app)
        .post("/api/checkout/create-order")
        .set("Cookie", customerCookie)
        .send({
          items: [{ productId: sampleProduct.id, quantity: 2 }],
          shippingAddress: {
            fullName: "Ananya Sharma",
            addressLine1: "123 Nariman Point",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400021",
            country: "India",
            phone: "+919876543210",
          },
          paymentMethod: "UPI",
        });

      const failedOrder = createRes.body.data.order;
      const failedRzpOrderId = createRes.body.data.razorpay.orderId;
      const failedPaymentId = `pay_webhook_fail_${Date.now()}`;
      const eventId = `evt_fail_${Date.now()}`;

      // Stock should be deducted by 2
      const stockAfterOrder = (
        await prisma.product.findUnique({ where: { id: sampleProduct.id } })
      )?.stockCount || 0;
      expect(stockAfterOrder).toBe(stockBefore - 2);

      const webhookPayload = {
        event_id: eventId,
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: failedPaymentId,
              order_id: failedRzpOrderId,
              error_description: "Insufficient funds in customer account",
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const res = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);

      // Verify order is marked FAILED with reason in MongoDB
      const dbOrder = await prisma.order.findUnique({
        where: { id: failedOrder.id },
      });
      expect(dbOrder?.paymentStatus).toBe("FAILED");
      expect(dbOrder?.paymentFailureReason).toBe("Insufficient funds in customer account");

      // Verify stock was restored safely
      const stockRestored = (
        await prisma.product.findUnique({ where: { id: sampleProduct.id } })
      )?.stockCount || 0;
      expect(stockRestored).toBe(stockBefore);
    });

    it("ensures an old payment.failed webhook CANNOT overwrite an already PAID order", async () => {
      // createdOrderId was already verified as PAID in section 3
      const paidOrder = await prisma.order.findUnique({
        where: { id: createdOrderId },
      });
      expect(paidOrder?.paymentStatus).toBe("PAID");

      const eventId = `evt_late_fail_${Date.now()}`;
      const webhookPayload = {
        event_id: eventId,
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: `pay_late_fail_${Date.now()}`,
              order_id: paidOrder?.razorpayOrderId,
              error_description: "Late failure event arrived out of order",
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const res = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);

      // Verify order STILL has paymentStatus = PAID!
      const verifyOrder = await prisma.order.findUnique({
        where: { id: createdOrderId },
      });
      expect(verifyOrder?.paymentStatus).toBe("PAID");
    });
  });
});
