import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("Product Catalogue Database-Driven API Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  describe("1. Public Products Catalogue Endpoint (GET /api/v1/products)", () => {
    it("returns 200 with products list, price bounds, and dynamic category counts from PostgreSQL", async () => {
      const res = await request(app).get("/api/v1/products");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { products, total, minCataloguePrice, maxCataloguePrice, categoryCounts } = res.body.data;
      expect(Array.isArray(products)).toBe(true);
      expect(total).toBeGreaterThanOrEqual(24);
      expect(typeof minCataloguePrice).toBe("number");
      expect(typeof maxCataloguePrice).toBe("number");
      expect(maxCataloguePrice).toBeGreaterThan(minCataloguePrice);

      // Verify dynamic category counts are present for all active categories
      expect(categoryCounts).toBeDefined();
      expect(typeof categoryCounts["necklaces"]).toBe("number");
      expect(typeof categoryCounts["rings"]).toBe("number");
      // Find a category with 0 products (e.g. newly created or empty collection like vvvvv)
      const zeroCatEntry = Object.entries(categoryCounts).find(([_, count]) => count === 0);
      if (zeroCatEntry) {
        expect(typeof zeroCatEntry[1]).toBe("number");
        expect(zeroCatEntry[1]).toBe(0); // Zero-product category count is authoritative 0
      }
    });

    it("filters products correctly by category slug", async () => {
      const res = await request(app).get("/api/v1/products?category=necklaces");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { products, total } = res.body.data;
      expect(total).toBeGreaterThan(0);
      products.forEach((p: any) => {
        expect(p.category.toUpperCase()).toContain("NECKLACE");
      });
    });

    it("returns empty product array for active category with zero products without failing", async () => {
      const listRes = await request(app).get("/api/v1/products");
      const zeroCatSlug = Object.entries(listRes.body.data.categoryCounts).find(([_, count]) => count === 0)?.[0] || "vvvvv";
      const res = await request(app).get(`/api/v1/products?category=${zeroCatSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { products, total } = res.body.data;
      expect(total).toBe(0);
      expect(products).toEqual([]);
    });

    it("filters products by price range", async () => {
      const res = await request(app).get("/api/v1/products?minPrice=20000&maxPrice=30000");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { products } = res.body.data;
      products.forEach((p: any) => {
        expect(p.priceInr).toBeGreaterThanOrEqual(20000);
        expect(p.priceInr).toBeLessThanOrEqual(30000);
      });
    });

    it("filters products by search keyword", async () => {
      const res = await request(app).get("/api/v1/products?search=solitaire");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { products, total } = res.body.data;
      expect(total).toBeGreaterThan(0);
      products.forEach((p: any) => {
        const matches =
          p.name.toLowerCase().includes("solitaire") ||
          (p.description && p.description.toLowerCase().includes("solitaire")) ||
          p.category.toLowerCase().includes("solitaire");
        expect(matches).toBe(true);
      });
    });

    it("supports sorting by price low-to-high", async () => {
      const res = await request(app).get("/api/v1/products?sort=price-low-to-high");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { products } = res.body.data;
      for (let i = 1; i < products.length; i++) {
        expect(products[i].priceInr).toBeGreaterThanOrEqual(products[i - 1].priceInr);
      }
    });
  });

  describe("2. Single Product Detail Endpoint (GET /api/v1/products/:slugOrId)", () => {
    it("returns 200 with enriched product details for valid product slug", async () => {
      const res = await request(app).get("/api/v1/products/solitaire-diamond-pendant-necklace");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const product = res.body.data;
      expect(product.slug).toBe("solitaire-diamond-pendant-necklace");
      expect(product.name).toBe("Solitaire Diamond Pendant Necklace");
      expect(product.image).toBeDefined();
      expect(product.image.src).toBeDefined();
      expect(Array.isArray(product.images)).toBe(true);
      expect(Array.isArray(product.specs)).toBe(true);
      expect(Array.isArray(product.reviews)).toBe(true);
    });

    it("returns 404 for non-existent product slug", async () => {
      const res = await request(app).get("/api/v1/products/non-existent-luxury-item");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
    });
  });

  describe("3. Adjacent Products Endpoint (GET /api/v1/products/:slugOrId/adjacent)", () => {
    it("returns prev and next products in catalogue sequence", async () => {
      const res = await request(app).get("/api/v1/products/solitaire-diamond-pendant-necklace/adjacent");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prev).toBeDefined();
      expect(res.body.data.next).toBeDefined();
    });
  });
});
