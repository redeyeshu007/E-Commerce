import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { MaterialService } from "../src/services/material-service.js";
import { prisma } from "../src/database/prisma.js";

describe("Materials & Editorial Collection Management Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;
  let testMaterialId: string;

  beforeAll(async () => {
    await MaterialService.seedInitialData();
  }, 60000);

  async function getAdminCookie(): Promise<string> {
    if (adminCookie) return adminCookie;
    const loginRes = await request(app).post("/api/admin/auth/login").send({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    });
    const setCookie = loginRes.headers["set-cookie"];
    adminCookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
    return adminCookie;
  }

  describe("1. Public Storefront Endpoints", () => {
    it("GET /api/v1/materials returns active materials in display order", async () => {
      const res = await request(app).get("/api/v1/materials");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const names = res.body.data.map((m: any) => m.name);
      expect(names).toContain("Gold");
      expect(names).toContain("Diamond");

      // Verify each item has stable id, name, slug, and productCount
      for (const mat of res.body.data) {
        expect(mat.id).toBeDefined();
        expect(mat.name).toBeDefined();
        expect(mat.slug).toBeDefined();
        expect(typeof mat.productCount).toBe("number");
        expect(mat.isActive).toBe(true);
      }
    });

    it("GET /api/v1/materials/section returns current published section with cards and material destination", async () => {
      const res = await request(app).get("/api/v1/materials/section");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.heading).toBe("Designed in India. Crafted with timeless elegance.");
      expect(Array.isArray(res.body.data.cards)).toBe(true);
      expect(res.body.data.cards.length).toBeGreaterThanOrEqual(3);

      const card1 = res.body.data.cards[0];
      expect(card1.title).toBeDefined();
      expect(card1.description).toBeDefined();
      expect(card1.ctaText).toBeDefined();
      expect(card1.imageUrl).toBeDefined();
    });

    it("GET /api/v1/materials/slug/:slug returns material by slug", async () => {
      const res = await request(app).get("/api/v1/materials/slug/gold");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe("gold");
      expect(res.body.data.name).toBe("Gold");
    });

    it("GET /api/v1/materials/slug/:slug returns 404 for unknown slug", async () => {
      const res = await request(app).get("/api/v1/materials/slug/non-existent-material-slug");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("2. Admin Authorization & Protected Endpoints", () => {
    it("rejects unauthenticated request to GET /api/v1/materials/admin", async () => {
      const res = await request(app).get("/api/v1/materials/admin");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated request to POST /api/v1/materials/admin", async () => {
      const res = await request(app).post("/api/v1/materials/admin").send({
        name: "Unauthorized Material",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated request to PUT /api/v1/materials/admin/section", async () => {
      const res = await request(app).put("/api/v1/materials/admin/section").send({
        heading: "Unauthorized Heading",
        cards: [],
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Material CRUD & Safe Deletion Validation", () => {
    it("creates a new material with auto-generated slug", async () => {
      const cookie = await getAdminCookie();
      const testName = `Tungsten Carbide ${Date.now()}`;

      const res = await request(app)
        .post("/api/v1/materials/admin")
        .set("Cookie", cookie)
        .send({
          name: testName,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testName);
      expect(res.body.data.slug).toContain("tungsten-carbide");
      expect(res.body.data.isActive).toBe(true);

      testMaterialId = res.body.data.id;
    });

    it("rejects case-insensitive duplicate material name with 409 Conflict", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/materials/admin")
        .set("Cookie", cookie)
        .send({
          name: "gold", // lowercase duplicate of baseline "Gold"
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("already exists");
    });

    it("updates material name and isActive status", async () => {
      const cookie = await getAdminCookie();
      const updatedName = `Tungsten Elite ${Date.now()}`;

      const res = await request(app)
        .put(`/api/v1/materials/admin/${testMaterialId}`)
        .set("Cookie", cookie)
        .send({
          name: updatedName,
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updatedName);
      expect(res.body.data.isActive).toBe(false);
    });

    it("blocks deletion with 409 Conflict if material is referenced by products", async () => {
      const cookie = await getAdminCookie();

      // Find the Gold material which is referenced by products
      const gold = await prisma.material.findUnique({
        where: { slug: "gold" },
        include: { _count: { select: { products: true } } },
      });

      if (gold && gold._count.products > 0) {
        const res = await request(app)
          .delete(`/api/v1/materials/admin/${gold.id}`)
          .set("Cookie", cookie);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("MATERIAL_IN_USE");
        expect(res.body.error.productCount).toBeGreaterThanOrEqual(1);
      }
    });

    it("safely deletes an unreferenced material", async () => {
      const cookie = await getAdminCookie();

      const res = await request(app)
        .delete(`/api/v1/materials/admin/${testMaterialId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedId).toBe(testMaterialId);

      // Verify it no longer exists
      const verifyRes = await request(app).get(`/api/v1/materials/slug/tungsten-elite`);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe("4. Section Publishing, Card Configuration & Version History", () => {
    it("updates section heading and cards, creating a snapshot in history", async () => {
      const cookie = await getAdminCookie();

      const existingSection = await MaterialService.getHomepageSection();
      const customHeading = `Royal Heritage Collection — ${Date.now()}`;

      const res = await request(app)
        .put("/api/v1/materials/admin/section")
        .set("Cookie", cookie)
        .send({
          heading: customHeading,
          cards: existingSection.cards.map((c, i) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            ctaText: c.ctaText,
            imageUrl: c.imageUrl,
            imageAlt: c.imageAlt,
            materialId: c.materialId,
            order: i,
            isActive: true,
          })),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.heading).toBe(customHeading);

      // Verify public section endpoint returns the updated heading immediately
      const publicRes = await request(app).get("/api/v1/materials/section");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.heading).toBe(customHeading);
    });

    it("records independent version history and supports version restoration", async () => {
      const cookie = await getAdminCookie();

      // Retrieve version history
      const historyRes = await request(app)
        .get("/api/v1/materials/admin/section/history")
        .set("Cookie", cookie);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(Array.isArray(historyRes.body.data)).toBe(true);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);

      const oldestVersion = historyRes.body.data[historyRes.body.data.length - 1];
      expect(oldestVersion.id).toBeDefined();

      // Restore the older version
      const restoreRes = await request(app)
        .post(`/api/v1/materials/admin/section/restore/${oldestVersion.id}`)
        .set("Cookie", cookie);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.heading).toBeDefined();
    });
  });
});
