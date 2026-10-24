import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { InstagramService } from "../src/services/instagram-service.js";

describe("Instagram Section Management API Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;

  beforeAll(async () => {
    await InstagramService.seedInitialData();
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
    it("GET /api/v1/instagram/section returns current published section with active images without auth", async () => {
      const res = await request(app).get("/api/v1/instagram/section");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.heading).toMatch(/Instagram/i);
      expect(res.body.data.handle).toMatch(/^@/);
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images.length).toBeGreaterThanOrEqual(6);

      const img1 = res.body.data.images[0];
      expect(img1.id).toBeDefined();
      expect(img1.imageUrl).toBeDefined();
      expect(img1.isActive).toBe(true);
    });

    it("GET /api/v1/instagram alias endpoint returns identical payload", async () => {
      const res = await request(app).get("/api/v1/instagram");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.heading).toMatch(/Instagram/i);
    });
  });

  describe("2. Admin Authorization & Protected Endpoints", () => {
    it("rejects unauthenticated GET /api/v1/instagram/admin/settings with 401", async () => {
      const res = await request(app).get("/api/v1/instagram/admin/settings");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated PUT /api/v1/instagram/admin/settings with 401", async () => {
      const res = await request(app).put("/api/v1/instagram/admin/settings").send({
        heading: "Unauthorized Heading",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated GET /api/v1/instagram/admin/history with 401", async () => {
      const res = await request(app).get("/api/v1/instagram/admin/history");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated POST /api/v1/instagram/admin/upload-image with 401", async () => {
      const res = await request(app).post("/api/v1/instagram/admin/upload-image");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Admin Section Updates, Image Management & Version History", () => {
    it("allows authenticated admin to GET /api/v1/instagram/admin/settings", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/instagram/admin/settings")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.images)).toBe(true);
    });

    it("updates heading, handle, profileUrl and supports more than 6 images with custom postUrl", async () => {
      const cookie = await getAdminCookie();

      // Send 7 images (verifying no fixed limit of six)
      const newImages = [
        { imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg", altText: "Photo 1", postUrl: "https://instagram.com/p/1", order: 0, isActive: true },
        { imageUrl: "/images/instagram/insta-2-diamond-earrings.jpg", altText: "Photo 2", postUrl: "https://instagram.com/p/2", order: 1, isActive: true },
        { imageUrl: "/images/instagram/insta-3-layered-necklaces.jpg", altText: "Photo 3", postUrl: null, order: 2, isActive: true },
        { imageUrl: "/images/instagram/insta-4-solitaire-ring.jpg", altText: "Photo 4", postUrl: null, order: 3, isActive: true },
        { imageUrl: "/images/instagram/insta-5-gold-earrings.jpg", altText: "Photo 5", postUrl: null, order: 4, isActive: true },
        { imageUrl: "/images/instagram/insta-6-fashion-editorial.jpg", altText: "Photo 6", postUrl: null, order: 5, isActive: true },
        { imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg", altText: "Photo 7 (Extra)", postUrl: "https://peralagae.com/collections/diamonds", order: 6, isActive: true },
      ];

      const res = await request(app)
        .put("/api/v1/instagram/admin/settings")
        .set("Cookie", cookie)
        .send({
          heading: "Follow Our Journey on Instagram",
          handle: "@peralagae_fine_jewels",
          profileUrl: "https://instagram.com/peralagae_fine_jewels",
          isActive: true,
          images: newImages,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.heading).toBe("Follow Our Journey on Instagram");
      expect(res.body.data.handle).toBe("@peralagae_fine_jewels");
      expect(res.body.data.profileUrl).toBe("https://instagram.com/peralagae_fine_jewels");

      // Verify public storefront reflects the update and all 7 images
      const publicRes = await request(app).get("/api/v1/instagram/section");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.heading).toBe("Follow Our Journey on Instagram");
      expect(publicRes.body.data.images.length).toBe(7);
      expect(publicRes.body.data.images[6].altText).toBe("Photo 7 (Extra)");
    });

    it("records independent version history and supports version restoration", async () => {
      const cookie = await getAdminCookie();

      // Fetch history snapshots
      const historyRes = await request(app)
        .get("/api/v1/instagram/admin/history")
        .set("Cookie", cookie);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(Array.isArray(historyRes.body.data)).toBe(true);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);

      const oldestSnapshot = historyRes.body.data[historyRes.body.data.length - 1];

      // Restore the older snapshot
      const restoreRes = await request(app)
        .post(`/api/v1/instagram/admin/restore/${oldestSnapshot.id}`)
        .set("Cookie", cookie);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.restoredFromVersion).toBe(oldestSnapshot.version);

      // Verify restored settings on storefront
      const publicRes = await request(app).get("/api/v1/instagram/section");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.heading).toBe(oldestSnapshot.heading);
    });

    it("rejects invalid destination URLs containing unsafe schemes (e.g. javascript:)", async () => {
      const cookie = await getAdminCookie();

      const res = await request(app)
        .put("/api/v1/instagram/admin/settings")
        .set("Cookie", cookie)
        .send({
          images: [
            {
              imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg",
              postUrl: "javascript:alert(1)",
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
