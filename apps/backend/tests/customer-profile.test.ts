import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

describe("Customer Profile & Mandatory Checkout Integration Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let testCustomerCookie: string;
  let testCustomerId: string;
  let testProductId: string;
  const testEmail = `profile.test.${Date.now()}@peralagae.com`;
  const testPassword = "TestPassword@2026";
  const initialFullName = "Aditi Sharma";

  beforeAll(async () => {
    // Fetch a real active product from database to use for checkout tests
    const product = await prisma.product.findFirst({
      where: { isAvailable: true, inStock: true },
      select: { id: true },
    });
    expect(product).toBeDefined();
    testProductId = product!.id;
  }, 30000);

  describe("1. Registration & Initial Incomplete Profile State", () => {
    it("Registers a new customer and sets initial isProfileComplete to false", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: initialFullName,
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.email).toBe(testEmail);
      expect(res.body.data.customer.isProfileComplete).toBe(false);

      testCustomerId = res.body.data.customer.id;
      const setCookie = res.headers["set-cookie"];
      testCustomerCookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
      expect(testCustomerCookie).toBeDefined();
    });

    it("GET /api/auth/me returns isProfileComplete = false for new customer", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", testCustomerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.email).toBe(testEmail);
      expect(res.body.data.isProfileComplete).toBe(false);
      expect(res.body.data.customer.isProfileComplete).toBe(false);
    });

    it("GET /api/auth/profile returns customer info and null profile", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", testCustomerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.email).toBe(testEmail);
      expect(res.body.data.customer.fullName).toBe(initialFullName);
      expect(res.body.data.isProfileComplete).toBe(false);
      expect(res.body.data.profile).toBeNull();
    });

    it("Blocks checkout with 403 PROFILE_INCOMPLETE when profile is incomplete", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .set("Cookie", testCustomerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Aditi Sharma",
            addressLine: "Flat 101, Lakeview Residency",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            phone: "9876543210",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("PROFILE_INCOMPLETE");
    });
  });

  describe("2. Profile Validation & Persistence in MongoDB", () => {
    it("Rejects profile save with invalid Indian phone number", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", testCustomerCookie)
        .send({
          recipientName: "Aditi Sharma",
          phone: "12345", // Invalid length and prefix
          streetAddress: "124, Indiranagar 100ft Road",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "560038",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Rejects profile save with invalid Indian PIN code", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", testCustomerCookie)
        .send({
          recipientName: "Aditi Sharma",
          phone: "9876543210",
          streetAddress: "124, Indiranagar 100ft Road",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "056003", // Invalid: first digit 0
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Saves complete profile and persists default shipping address to MongoDB", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", testCustomerCookie)
        .send({
          fullName: "Aditi S. Sharma",
          recipientName: "Aditi Sharma",
          phone: "+91 98765 43210", // Formatted input with +91
          streetAddress: "124, Indiranagar 100ft Road, Near Metro Pillar 42",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "560038",
          country: "India",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProfileComplete).toBe(true);
      expect(res.body.data.customer.fullName).toBe("Aditi S. Sharma");
      expect(res.body.data.profile.recipientName).toBe("Aditi Sharma");
      expect(res.body.data.profile.phone).toBe("9876543210"); // Cleaned
      expect(res.body.data.profile.streetAddress).toBe("124, Indiranagar 100ft Road, Near Metro Pillar 42");
      expect(res.body.data.profile.city).toBe("Bengaluru");
      expect(res.body.data.profile.state).toBe("Karnataka");
      expect(res.body.data.profile.pinCode).toBe("560038");
      expect(res.body.data.profile.country).toBe("India");
      expect(res.body.data.profile.isComplete).toBe(true);
    });

    it("GET /api/auth/me now reflects isProfileComplete = true and provides default shipping address", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", testCustomerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.isProfileComplete).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.city).toBe("Bengaluru");
    });

    it("Unauthenticated request to PUT /api/auth/profile is rejected with 401", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({
          recipientName: "Hacker Attempt",
          phone: "9876543210",
          streetAddress: "Unknown Street",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400001",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Checkout Integration & Order Snapshot Preservation", () => {
    let createdOrderId: string;

    it("Allows checkout now that customer profile is complete", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .set("Cookie", testCustomerCookie)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Aditi Sharma",
            addressLine: "124, Indiranagar 100ft Road, Near Metro Pillar 42",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560038",
            phone: "9876543210",
          },
          paymentMethod: "UPI",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order).toBeDefined();
      createdOrderId = res.body.data.order.id;

      // Verify order shipping address snapshot
      expect(res.body.data.order.shippingAddress.city).toBe("Bengaluru");
      expect(res.body.data.order.shippingAddress.postalCode).toBe("560038");
    });

    it("Subsequent profile updates do NOT alter previous order shippingAddress snapshot", async () => {
      // 1. Update customer profile to a new address (e.g. moved to Mumbai)
      const updateRes = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", testCustomerCookie)
        .send({
          recipientName: "Aditi S. Sharma",
          phone: "9123456789",
          streetAddress: "702, Marine Drive Boulevard",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400020",
          country: "India",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.profile.city).toBe("Mumbai");

      // 2. Fetch the previously placed order from DB
      const order = await prisma.order.findUnique({
        where: { id: createdOrderId },
      });

      expect(order).toBeDefined();
      const orderAddr = order!.shippingAddress as any;
      // Must STILL be Bengaluru, preserving historical snapshot!
      expect(orderAddr.city).toBe("Bengaluru");
      expect(orderAddr.postalCode).toBe("560038");
      expect(orderAddr.addressLine).toBe("124, Indiranagar 100ft Road, Near Metro Pillar 42");
    });
  });
});
