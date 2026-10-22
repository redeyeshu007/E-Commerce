import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

describe("Protected Checkout & Order Creation Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  const timestamp = Date.now();
  const customerAEmail = `order_cust_a_${timestamp}@peralagae.com`;
  const customerBEmail = `order_cust_b_${timestamp}@peralagae.com`;
  const testPassword = "CustomerSecurePassword2026!";

  let customerACookie = "";
  let customerBCookie = "";
  let sampleProduct: { id: string; name: string; priceInr: number };
  let createdOrderId = "";

  describe("1. Guest Access & Protected Endpoint Enforcement", () => {
    it("allows guest users to browse catalogue freely without authentication", async () => {
      const res = await request(app).get("/api/v1/products");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);

      // Save a valid product with guaranteed stock for subsequent checkout tests
      sampleProduct = res.body.data.products.find((p: any) => p.stockCount >= 5) || res.body.data.products[0];
      await prisma.product.update({
        where: { id: sampleProduct.id },
        data: { inStock: true, isAvailable: true, stockCount: 50 },
      });
      expect(sampleProduct.id).toBeDefined();
      expect(sampleProduct.priceInr).toBeGreaterThan(0);
    });

    it("rejects unauthenticated order creation at POST /api/orders with 401", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: {
            fullName: "Guest User",
            addressLine1: "123 Street",
            city: "Mumbai",
            state: "MH",
            postalCode: "400001",
            country: "India",
            phone: "+919876543210",
          },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated order creation at POST /api/checkout/create-order with 401", async () => {
      const res = await request(app)
        .post("/api/checkout/create-order")
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: {
            fullName: "Guest User",
            addressLine1: "123 Street",
            city: "Mumbai",
            state: "MH",
            postalCode: "400001",
            country: "India",
            phone: "+919876543210",
          },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("2. Authenticated Customer Checkout & Server-Side Price Integrity", () => {
    it("registers customer A and customer B", async () => {
      const regA = await request(app).post("/api/auth/register").send({
        fullName: "Customer Alpha",
        email: customerAEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });
      expect(regA.status).toBe(201);
      customerACookie = Array.isArray(regA.headers["set-cookie"])
        ? regA.headers["set-cookie"].join(";")
        : (regA.headers["set-cookie"] as string);

      const regB = await request(app).post("/api/auth/register").send({
        fullName: "Customer Beta",
        email: customerBEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });
      expect(regB.status).toBe(201);
      customerBCookie = Array.isArray(regB.headers["set-cookie"])
        ? regB.headers["set-cookie"].join(";")
        : (regB.headers["set-cookie"] as string);

      // Complete customer A's profile as required by the mandatory profile guard
      const profA = await request(app)
        .put("/api/auth/profile")
        .set("Cookie", customerACookie)
        .send({
          recipientName: "Customer Alpha",
          phone: "9876543211",
          streetAddress: "456 Luxury Lane",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "560001",
          country: "India",
        });
      expect(profA.status).toBe(200);
    });

    it("creates an order and enforces server-side prices (ignores client manipulated prices)", async () => {
      const quantity = 2;
      const expectedTotal = sampleProduct.priceInr * quantity;

      // Client attempts to send manipulated subtotal and fake customer ID
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", customerACookie)
        .send({
          customerId: "injected-fake-customer-id-12345",
          subtotal: 10, // manipulated low subtotal
          total: 10, // manipulated low total
          items: [
            {
              productId: sampleProduct.id,
              quantity,
              price: 5, // manipulated unit price
            },
          ],
          shippingAddress: {
            fullName: "Customer Alpha",
            addressLine1: "456 Luxury Lane",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            country: "India",
            phone: "+919876543211",
          },
          paymentMethod: "UPI",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order).toBeDefined();

      const order = res.body.data.order;
      createdOrderId = order.id;

      // Verify that server calculated total from DB price, NOT client price!
      expect(order.subtotalInr).toBe(expectedTotal);
      expect(order.totalInr).toBe(expectedTotal);
      expect(order.orderNumber).toMatch(/^PLG-/);
      expect(order.items.length).toBe(1);
      expect(order.items[0].unitPriceInr).toBe(sampleProduct.priceInr);
      expect(order.items[0].totalPriceInr).toBe(expectedTotal);

      // Verify customer identity was derived from verified session, not injected ID
      expect(order.customerId).not.toBe("injected-fake-customer-id-12345");
    });

    it("allows Customer A to retrieve their own order", async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set("Cookie", customerACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.id).toBe(createdOrderId);
    });

    it("prevents Customer B from accessing Customer A's private order (ownership enforcement)", async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set("Cookie", customerBCookie);

      // Must be 404 or 403 to protect privacy
      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it("lists only Customer A's orders for Customer A", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Cookie", customerACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.orders.some((o: any) => o.id === createdOrderId)).toBe(true);
    });

    it("strictly rejects Cash on Delivery (COD) with 400 error", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .set("Cookie", customerACookie)
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: {
            fullName: "Customer Alpha",
            addressLine1: "456 Luxury Lane",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            country: "India",
            phone: "+919876543211",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("COD_NOT_ALLOWED");
    });
  });
});
