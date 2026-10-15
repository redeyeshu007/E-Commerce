import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { HeroService } from "../src/services/hero-service.js";

describe("Hero Images Management API & Independent Histories Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;

  beforeEach(async () => {
    await HeroService.resetToDefault();
  });

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

  describe("1. Public Storefront Endpoint (GET /api/v1/hero)", () => {
    it("returns 200 with current hero settings without authentication", async () => {
      const res = await request(app).get("/api/v1/hero");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { heroImage1, heroImage2, heroImage3 } = res.body.data;

      // Hero Image 1 verification
      expect(heroImage1).toBeDefined();
      expect(heroImage1.id).toBe("heroImage1");
      expect(heroImage1.name).toBe("Hero Image 1");
      expect(heroImage1.normalHeadline).toBe("Necklaces &");
      expect(heroImage1.boldHeadline).toBe("Body Jewels");
      expect(heroImage1.description).toBe("Look to our new season collection for girls.");
      expect(heroImage1.imageUrl).toContain("banner-necklaces.jpg");

      // Hero Image 2 verification (no description)
      expect(heroImage2).toBeDefined();
      expect(heroImage2.id).toBe("heroImage2");
      expect(heroImage2.name).toBe("Hero Image 2");
      expect(heroImage2.normalHeadline).toBe("Just Lunched");
      expect(heroImage2.boldHeadline).toBe("Desk The Hals");
      expect(heroImage2.description).toBeUndefined();

      // Hero Image 3 verification (no description)
      expect(heroImage3).toBeDefined();
      expect(heroImage3.id).toBe("heroImage3");
      expect(heroImage3.name).toBe("Hero Image 3");
      expect(heroImage3.normalHeadline).toBe("Jewelry &");
      expect(heroImage3.boldHeadline).toBe("Charm Bracelets");
      expect(heroImage3.description).toBeUndefined();

      // Independent version counters exist
      expect(res.body.data.heroImage1Version).toBe(1);
      expect(res.body.data.heroImage2Version).toBe(1);
      expect(res.body.data.heroImage3Version).toBe(1);
    });
  });

  describe("2. Admin Authorization & Protected Settings", () => {
    it("rejects unauthenticated request to GET /api/v1/hero/admin/settings", async () => {
      const res = await request(app).get("/api/v1/hero/admin/settings");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated request to PUT /api/v1/hero/admin/slot/heroImage1", async () => {
      const res = await request(app).put("/api/v1/hero/admin/slot/heroImage1").send({
        normalHeadline: "Unauthenticated Test",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("allows authenticated admin to GET /api/v1/hero/admin/settings", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/hero/admin/settings")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.heroImage1).toBeDefined();
      expect(res.body.data.heroImage2).toBeDefined();
      expect(res.body.data.heroImage3).toBeDefined();
    });
  });

  describe("3. Independent Slot Editing & Independent Version Counters", () => {
    it("updating Hero Image 1 increments ONLY heroImage1Version and does NOT modify Hero Image 2 or 3", async () => {
      const cookie = await getAdminCookie();

      // Read baseline
      const initial = await request(app).get("/api/v1/hero");
      const initialHero2 = initial.body.data.heroImage2;
      const initialHero3 = initial.body.data.heroImage3;
      expect(initial.body.data.heroImage1Version).toBe(1);
      expect(initial.body.data.heroImage2Version).toBe(1);
      expect(initial.body.data.heroImage3Version).toBe(1);

      // Update Hero Image 1 only
      const updateRes = await request(app)
        .put("/api/v1/hero/admin/slot/heroImage1")
        .set("Cookie", cookie)
        .send({
          normalHeadline: "Royal Jewels &",
          boldHeadline: "Bridal Sets",
          description: "Exclusive handcrafted bridal collections for the modern era.",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.heroImage1.normalHeadline).toBe("Royal Jewels &");
      expect(updateRes.body.data.heroImage1.boldHeadline).toBe("Bridal Sets");
      expect(updateRes.body.data.heroImage1.description).toBe(
        "Exclusive handcrafted bridal collections for the modern era."
      );

      // Version counters: only Hero 1 incremented!
      expect(updateRes.body.data.heroImage1Version).toBe(2);
      expect(updateRes.body.data.heroImage2Version).toBe(1);
      expect(updateRes.body.data.heroImage3Version).toBe(1);

      // Verify Hero Image 2 and Hero Image 3 are completely untouched
      expect(updateRes.body.data.heroImage2.normalHeadline).toBe(initialHero2.normalHeadline);
      expect(updateRes.body.data.heroImage2.boldHeadline).toBe(initialHero2.boldHeadline);
      expect(updateRes.body.data.heroImage2.imageUrl).toBe(initialHero2.imageUrl);

      expect(updateRes.body.data.heroImage3.normalHeadline).toBe(initialHero3.normalHeadline);
      expect(updateRes.body.data.heroImage3.boldHeadline).toBe(initialHero3.boldHeadline);
      expect(updateRes.body.data.heroImage3.imageUrl).toBe(initialHero3.imageUrl);
    });

    it("updating Hero Image 2 increments ONLY heroImage2Version and does NOT modify Hero Image 1 or 3", async () => {
      const cookie = await getAdminCookie();

      const initial = await request(app).get("/api/v1/hero");
      const initialHero1 = initial.body.data.heroImage1;
      const initialHero3 = initial.body.data.heroImage3;

      const updateRes = await request(app)
        .put("/api/v1/hero/admin/slot/heroImage2")
        .set("Cookie", cookie)
        .send({
          normalHeadline: "New Arrival",
          boldHeadline: "Diamond Chokers",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.heroImage2.normalHeadline).toBe("New Arrival");
      expect(updateRes.body.data.heroImage2.boldHeadline).toBe("Diamond Chokers");

      // Version counters: only Hero 2 incremented
      expect(updateRes.body.data.heroImage2Version).toBe(2);
      expect(updateRes.body.data.heroImage1Version).toBe(1);
      expect(updateRes.body.data.heroImage3Version).toBe(1);

      // Verify Hero 1 and Hero 3 unchanged
      expect(updateRes.body.data.heroImage1.normalHeadline).toBe(initialHero1.normalHeadline);
      expect(updateRes.body.data.heroImage1.description).toBe(initialHero1.description);
      expect(updateRes.body.data.heroImage3.normalHeadline).toBe(initialHero3.normalHeadline);
    });
  });

  describe("4. Independent Version History Streams (GET /api/v1/hero/admin/history)", () => {
    it("retrieves only Hero Image 1 history when slotId=heroImage1", async () => {
      const cookie = await getAdminCookie();

      // Publish an update for heroImage1
      await request(app)
        .put("/api/v1/hero/admin/slot/heroImage1")
        .set("Cookie", cookie)
        .send({
          normalHeadline: "Luxury &",
          boldHeadline: "Fine Gold",
        });

      const res = await request(app)
        .get("/api/v1/hero/admin/history?slotId=heroImage1")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // All items must belong to heroImage1
      for (const item of res.body.data) {
        expect(item.slotId).toBe("heroImage1");
      }

      // Newest item should be v2 and marked as current
      expect(res.body.data[0].version).toBe(2);
      expect(res.body.data[0].isCurrent).toBe(true);
    });

    it("retrieves only Hero Image 2 history when slotId=heroImage2", async () => {
      const cookie = await getAdminCookie();

      const res = await request(app)
        .get("/api/v1/hero/admin/history?slotId=heroImage2")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      for (const item of res.body.data) {
        expect(item.slotId).toBe("heroImage2");
      }
    });
  });

  describe("5. Slot Restoration Behavior (POST /api/v1/hero/admin/restore)", () => {
    it("restoring Hero Image 1 restores its historical state and does NOT modify Hero Image 2 or 3", async () => {
      const cookie = await getAdminCookie();

      // 1. Initial baseline: Hero 1 has "Necklaces &"
      const baseline = await request(app).get("/api/v1/hero");
      const originalHero2 = baseline.body.data.heroImage2;
      const originalHero3 = baseline.body.data.heroImage3;

      // 2. Modify Hero 1 to v2
      await request(app)
        .put("/api/v1/hero/admin/slot/heroImage1")
        .set("Cookie", cookie)
        .send({
          normalHeadline: "Temporary Text &",
          boldHeadline: "Temporary Jewels",
        });

      // Verify v2 is live
      const v2Live = await request(app).get("/api/v1/hero");
      expect(v2Live.body.data.heroImage1.normalHeadline).toBe("Temporary Text &");

      // 3. Restore Hero 1 back to v1
      const restoreRes = await request(app)
        .post("/api/v1/hero/admin/restore")
        .set("Cookie", cookie)
        .send({
          slotId: "heroImage1",
          version: 1,
        });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.heroImage1.normalHeadline).toBe("Necklaces &");
      expect(restoreRes.body.data.heroImage1.boldHeadline).toBe("Body Jewels");

      // Hero 2 and Hero 3 remain strictly unmodified
      expect(restoreRes.body.data.heroImage2.normalHeadline).toBe(originalHero2.normalHeadline);
      expect(restoreRes.body.data.heroImage3.normalHeadline).toBe(originalHero3.normalHeadline);
    });
  });

  describe("6. Image Upload & Validation", () => {
    it("rejects non-image upload with 400", async () => {
      const cookie = await getAdminCookie();
      const fakeTextFile = Buffer.from("Hello world, this is a plain text file, not an image!");

      const res = await request(app)
        .post("/api/v1/hero/admin/upload")
        .set("Cookie", cookie)
        .attach("image", fakeTextFile, "malicious.txt");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects renamed binary file with spoofed extension failing magic bytes", async () => {
      const cookie = await getAdminCookie();
      const fakeBinary = Buffer.from("MZThisIsAnExecutableFileDisguisedAsJpg");

      const res = await request(app)
        .post("/api/v1/hero/admin/upload")
        .set("Cookie", cookie)
        .attach("image", fakeBinary, "fake-image.jpg");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_IMAGE_DATA");
    });

    it("accepts valid JPEG image and returns persistent url", async () => {
      const cookie = await getAdminCookie();
      const validJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const res = await request(app)
        .post("/api/v1/hero/admin/upload")
        .set("Cookie", cookie)
        .attach("image", validJpeg, "test-valid.jpg");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/hero\/hero-/);
    });
  });
});
