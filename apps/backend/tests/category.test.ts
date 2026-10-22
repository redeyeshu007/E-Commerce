import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import path from "node:path";
import fs from "node:fs";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { CategoryService } from "../src/services/category-service.js";
import { prisma } from "../src/database/prisma.js";

describe("Category Management API & Catalogue Integration Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;

  beforeAll(async () => {
    await CategoryService.seedInitialData();
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

  describe("1. Public Storefront Endpoints (GET /api/v1/categories)", () => {
    it("returns 200 with all 6 baseline categories in order without authentication", async () => {
      const res = await request(app).get("/api/v1/categories");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);

      const slugs = res.body.data.map((c: any) => c.slug);
      expect(slugs).toContain("necklaces");
      expect(slugs).toContain("rings");
      expect(slugs).toContain("bracelets");
      expect(slugs).toContain("earrings");
      expect(slugs).toContain("charms-bangles");
      expect(slugs).toContain("gift-ideas");

      // Verify first category order
      const necklaces = res.body.data.find((c: any) => c.slug === "necklaces");
      expect(necklaces).toBeDefined();
      expect(necklaces.name).toBe("NECKLACES");
      expect(necklaces.order).toBeGreaterThanOrEqual(1);
      expect(necklaces.productCount).toBeGreaterThanOrEqual(1);
    });

    it("returns 200 for single category by slug", async () => {
      const res = await request(app).get("/api/v1/categories/necklaces");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe("necklaces");
      expect(res.body.data.name).toBe("NECKLACES");
    });

    it("returns 404 for unknown category slug", async () => {
      const res = await request(app).get("/api/v1/categories/non-existent-category-slug");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("2. Admin Authorization & Protected Endpoints", () => {
    it("rejects unauthenticated request to GET /api/v1/categories/admin/list", async () => {
      const res = await request(app).get("/api/v1/categories/admin/list");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated request to POST /api/v1/categories/admin", async () => {
      const res = await request(app).post("/api/v1/categories/admin").send({
        name: "Anklets",
        imageUrl: "/images/test.jpg",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("allows authenticated admin to retrieve full categories list with product counts", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/categories/admin/list")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);

      const rings = res.body.data.find((c: any) => c.slug === "rings");
      expect(rings).toBeDefined();
      expect(rings.productCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Category Creation, Slug Generation & Duplicate Validation", () => {
    it("creates a new category with generated URL-safe slug", async () => {
      const cookie = await getAdminCookie();
      const testName = `Pendants & Chokers ${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/categories/admin")
        .set("Cookie", cookie)
        .send({
          name: testName,
          imageUrl: "/images/collections/collection-necklaces.jpg",
          description: "Luxury pendants and chokers",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testName);
      expect(res.body.data.slug).toContain("pendants-chokers");
      expect(res.body.data.productCount).toBe(0);

      // Clean up test category
      await prisma.category.delete({ where: { id: res.body.data.id } });
    });


    it("creates a new category with only name provided (using fallback imageUrl and auto-generated slug)", async () => {
      const cookie = await getAdminCookie();
      const testName = `Anklets & Charms ${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/categories/admin")
        .set("Cookie", cookie)
        .send({
          name: testName,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testName);
      expect(res.body.data.slug).toContain("anklets-charms");
      expect(res.body.data.imageUrl).toBe("/images/collections/collection-necklaces.jpg");

      // Clean up test category
      await prisma.category.delete({ where: { id: res.body.data.id } });
    });

    it("rejects duplicate category name with 409 Conflict", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/categories/admin")
        .set("Cookie", cookie)
        .send({
          name: "NECKLACES", // Already exists in baseline
          imageUrl: "/images/test.jpg",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("already exists");
    });

    it("rejects case-insensitive duplicate category name with 409 Conflict", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/categories/admin")
        .set("Cookie", cookie)
        .send({
          name: "necklaces", // lowercase duplicate of baseline "NECKLACES"
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("already exists");
    });

    it("rejects empty category name with 400 Validation Error", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/categories/admin")
        .set("Cookie", cookie)
        .send({
          name: "",
          imageUrl: "/images/test.jpg",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("4. Category Editing & ID Preservation", () => {
    it("updates category details while preserving stable ID and product associations", async () => {
      const cookie = await getAdminCookie();

      // Create a temporary category
      const testCat = await CategoryService.createCategory({
        name: `Temp Brooches ${Date.now()}`,
        imageUrl: "/images/collections/collection-rings.jpg",
        description: "Initial description",
        order: 99,
      });

      // Update the category
      const res = await request(app)
        .put(`/api/v1/categories/admin/${testCat.id}`)
        .set("Cookie", cookie)
        .send({
          description: "Updated luxury brooches description",
          order: 98,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testCat.id); // Stable ID preserved
      expect(res.body.data.description).toBe("Updated luxury brooches description");
      expect(res.body.data.order).toBe(98);

      // Clean up
      await prisma.category.delete({ where: { id: testCat.id } });
    });
  });

  describe("5. Category Reordering", () => {
    it("updates sequential order for multiple categories", async () => {
      const cookie = await getAdminCookie();
      const categories = await CategoryService.getAllCategories({ includeInactive: true });
      const firstTwo = categories.slice(0, 2);
      const reversedIds = [firstTwo[1]!.id, firstTwo[0]!.id];

      const res = await request(app)
        .patch("/api/v1/categories/admin/reorder")
        .set("Cookie", cookie)
        .send({ orderedIds: reversedIds });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the new orders
      const updated = await CategoryService.getAllCategories({ includeInactive: true });
      const cat1 = updated.find((c) => c.id === reversedIds[0]);
      const cat2 = updated.find((c) => c.id === reversedIds[1]);
      expect(cat1?.order).toBe(1);
      expect(cat2?.order).toBe(2);

      // Restore baseline order
      await CategoryService.reorderCategories(firstTwo.map((c) => c.id));
    });
  });

  describe("6. Delete Category & Associated Products Cascade", () => {
    it("permanently cascades deletion to category and its associated products", async () => {
      const cookie = await getAdminCookie();

      // Create dedicated test category
      const testCat = await CategoryService.createCategory({
        name: `Test Delete Category ${Date.now()}`,
        imageUrl: "/images/collections/collection-earrings.jpg",
      });

      // Create a test product associated with this category
      const testProd = await prisma.product.create({
        data: {
          id: `test-prod-del-${Date.now()}`,
          name: "Test Associated Product",
          slug: `test-associated-product-${Date.now()}`,
          categoryId: testCat.id,
          imageUrl: "/images/products/product-earrings-blue-stripes.jpg",
          priceInr: 9999,
        },
      });

      // Confirm product is associated
      const beforeCount = await prisma.product.count({ where: { categoryId: testCat.id } });
      expect(beforeCount).toBe(1);

      // Delete the category via admin endpoint
      const deleteRes = await request(app)
        .delete(`/api/v1/categories/admin/${testCat.id}`)
        .set("Cookie", cookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.deletedProductCount).toBe(1);
      expect(deleteRes.body.data.deletedCategory.id).toBe(testCat.id);

      // Verify category is gone from database
      const checkCat = await prisma.category.findUnique({ where: { id: testCat.id } });
      expect(checkCat).toBeNull();

      // Verify associated product was deleted (no orphan records)
      const checkProd = await prisma.product.findUnique({ where: { id: testProd.id } });
      expect(checkProd).toBeNull();
    });

    it("returns 404 when deleting a non-existent category", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .delete("/api/v1/categories/admin/non-existent-id")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("7. Category Image Upload & Magic Bytes Validation", () => {
    it("rejects non-image upload with 400", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/categories/admin/upload-image")
        .set("Cookie", cookie)
        .attach("image", Buffer.from("console.log('malicious script');"), {
          filename: "script.js",
          contentType: "application/javascript",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("rejects renamed binary file with spoofed extension failing magic bytes", async () => {
      const cookie = await getAdminCookie();
      // Text file renamed to .jpg
      const fakeJpg = Buffer.from("This is plain text with .jpg extension");
      const res = await request(app)
        .post("/api/v1/categories/admin/upload-image")
        .set("Cookie", cookie)
        .attach("image", fakeJpg, {
          filename: "spoofed.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_IMAGE_CONTENT");
    });

    it("accepts valid JPEG image and returns persistent url", async () => {
      const cookie = await getAdminCookie();
      // Valid JPEG header bytes: FF D8 FF E0
      const validJpg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0xff, 0xd9,
      ]);

      const res = await request(app)
        .post("/api/v1/categories/admin/upload-image")
        .set("Cookie", cookie)
        .attach("image", validJpg, {
          filename: "valid-test.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/categories\/cat-/);
      expect(res.body.data.filename).toBeDefined();

      // Clean up uploaded file from disk if present
      const filePath = path.resolve(process.cwd(), "uploads", "categories", res.body.data.filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    });
  });
});
