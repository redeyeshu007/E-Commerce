import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { NavbarService } from "../src/services/navbar-service.js";

describe("Navbar Management API & Independent Version Histories Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;

  beforeEach(() => {
    NavbarService.resetInMemoryState();
  });

  // Helper to obtain admin session cookie
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

  describe("1. Public Storefront Endpoint (GET /api/v1/navbar)", () => {
    it("returns 200 with current navbar settings without authentication", async () => {
      const res = await request(app).get("/api/v1/navbar");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.topBar).toBeDefined();
      expect(typeof res.body.data.topBar.text).toBe("string");
      expect(res.body.data.secondNavbar).toBeDefined();
      expect(Array.isArray(res.body.data.secondNavbar.links)).toBe(true);
      expect(typeof res.body.data.version).toBe("number");
      expect(typeof res.body.data.topBarVersion).toBe("number");
      expect(typeof res.body.data.secondNavbarVersion).toBe("number");
    });
  });

  describe("2. Admin Authorization & Protected Settings", () => {
    it("rejects unauthenticated request to GET /api/v1/navbar/admin/settings", async () => {
      const res = await request(app).get("/api/v1/navbar/admin/settings");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("allows authenticated admin to GET /api/v1/navbar/admin/settings with independent versions", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/navbar/admin/settings")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.topBarVersion).toBe(1);
      expect(res.body.data.secondNavbarVersion).toBe(1);
    });
  });

  describe("3. Independent Version Counters & Publishing Separation", () => {
    it("1 & 2: Top Bar v1 and Second Navbar v1 coexist, and publishing Top Bar v2 does NOT increment Second Navbar", async () => {
      const cookie = await getAdminCookie();

      // Initial state
      const initial = await request(app).get("/api/v1/navbar");
      expect(initial.body.data.topBarVersion).toBe(1);
      expect(initial.body.data.secondNavbarVersion).toBe(1);

      // Publish Top Bar
      const putTopRes = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({
          text: "DIWALI SPECIAL: 50% OFF ON LUXURY GOLD JEWELLERY",
          backgroundColor: "#FCE7F3",
          textColor: "#111827",
          visible: true,
          dismissible: false,
        });

      expect(putTopRes.status).toBe(200);
      expect(putTopRes.body.success).toBe(true);
      expect(putTopRes.body.data.topBarVersion).toBe(2);
      // Crucial: Second Navbar version remains v1!
      expect(putTopRes.body.data.secondNavbarVersion).toBe(1);
    });

    it("3 & 8: Publishing Second Navbar updates ONLY promotional message, increments only Second Navbar, and leaves Top Bar untouched", async () => {
      const cookie = await getAdminCookie();

      // Set initial Top Bar
      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "PRESERVED TOP BAR TEXT" });

      const beforeUpdate = await request(app).get("/api/v1/navbar");
      const originalTopVersion = beforeUpdate.body.data.topBarVersion;
      const originalPhone = beforeUpdate.body.data.secondNavbar.phone;
      const originalCta = beforeUpdate.body.data.secondNavbar.ctaText;
      const originalLinks = beforeUpdate.body.data.secondNavbar.links;

      // Update Second Navbar with ONLY promotional message
      const putSecondRes = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({
          promoText: "Festive Collection Live — Complimentary Hallmarking",
        });

      expect(putSecondRes.status).toBe(200);
      expect(putSecondRes.body.success).toBe(true);
      expect(putSecondRes.body.data.secondNavbar.promoText).toBe(
        "Festive Collection Live — Complimentary Hallmarking"
      );

      // Requirement 8: All other Second Navbar fields are preserved
      expect(putSecondRes.body.data.secondNavbar.phone).toBe(originalPhone);
      expect(putSecondRes.body.data.secondNavbar.ctaText).toBe(originalCta);
      expect(putSecondRes.body.data.secondNavbar.links).toEqual(originalLinks);

      // Second Navbar version incremented to 2, Top Bar version untouched!
      expect(putSecondRes.body.data.secondNavbarVersion).toBe(2);
      expect(putSecondRes.body.data.topBarVersion).toBe(originalTopVersion);

      // Verify Top Bar history does NOT contain any Second Navbar entry
      const topHistory = await request(app)
        .get("/api/v1/navbar/admin/history?section=top_bar")
        .set("Cookie", cookie);

      const secondInTop = topHistory.body.data.some(
        (h: any) => h.section === "SECOND_NAVBAR" || h.description?.includes("promotional message")
      );
      expect(secondInTop).toBe(false);
    });
  });

  describe("4. Section History Filtering (GET /api/v1/navbar/admin/history)", () => {
    it("4: retrieves only Top Bar history when section=top_bar", async () => {
      const cookie = await getAdminCookie();

      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "Top Bar Exclusive Update 1" });

      await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "Second Navbar Exclusive Update 1" });

      const res = await request(app)
        .get("/api/v1/navbar/admin/history?section=top_bar")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((item: any) => {
        expect(item.section).toBe("TOP_BAR");
        expect(item.snapshot.topBar).toBeDefined();
      });
    });

    it("4: retrieves only Second Navbar history when section=second_navbar", async () => {
      const cookie = await getAdminCookie();

      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "Top Bar Exclusive Update 2" });

      await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "Second Navbar Exclusive Update 2" });

      const res = await request(app)
        .get("/api/v1/navbar/admin/history?section=second_navbar")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((item: any) => {
        expect(item.section).toBe("SECOND_NAVBAR");
        expect(item.snapshot.secondNavbar.promoText).toBeDefined();
      });
    });
  });

  describe("5. Validation and Error Handling", () => {
    it("10: rejects empty announcement text for Top Bar", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("10: rejects Top Bar text exceeding 250 characters", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "A".repeat(251) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("250 characters");
    });

    it("10: rejects empty promotional message for Second Navbar", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "   " });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("10: rejects promotional message exceeding 120 characters", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "P".repeat(121) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("120 characters");
    });
  });

  describe("6. Version Restoration Behavior", () => {
    it("6: restoring a Top Bar version does NOT modify Second Navbar", async () => {
      const cookie = await getAdminCookie();

      // Top Bar v1 -> v2
      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "Top Bar Version 2" });

      // Second Navbar v1 -> v2
      await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "Second Navbar Text 2" });

      const topHistoryRes = await request(app)
        .get("/api/v1/navbar/admin/history?section=top_bar")
        .set("Cookie", cookie);

      const topV1Record = topHistoryRes.body.data.find((h: any) => h.version === 1);
      expect(topV1Record).toBeDefined();

      // Restore Top Bar v1
      const restoreRes = await request(app)
        .post(`/api/v1/navbar/admin/history/${topV1Record.id}/restore`)
        .set("Cookie", cookie)
        .send({ section: "top_bar" });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.topBar.text).toBe(topV1Record.snapshot.topBar.text);

      // Crucial: Second Navbar remains at "Second Navbar Text 2" and v2!
      expect(restoreRes.body.data.secondNavbar.promoText).toBe("Second Navbar Text 2");
      expect(restoreRes.body.data.secondNavbarVersion).toBe(2);
    });

    it("7: restoring a Second Navbar version does NOT modify Top Bar", async () => {
      const cookie = await getAdminCookie();

      // Top Bar v1 -> v2
      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "Top Bar Custom Announcement" });

      // Second Navbar v1 -> v2
      await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "Second Navbar Promo v2" });

      const secondHistoryRes = await request(app)
        .get("/api/v1/navbar/admin/history?section=second_navbar")
        .set("Cookie", cookie);

      const secondV1Record = secondHistoryRes.body.data.find((h: any) => h.version === 1);
      expect(secondV1Record).toBeDefined();

      // Restore Second Navbar v1
      const restoreRes = await request(app)
        .post(`/api/v1/navbar/admin/history/${secondV1Record.id}/restore`)
        .set("Cookie", cookie)
        .send({ section: "second_navbar" });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.secondNavbar.promoText).toBe(
        secondV1Record.snapshot.secondNavbar.promoText
      );

      // Crucial: Top Bar remains at "Top Bar Custom Announcement" and v2!
      expect(restoreRes.body.data.topBar.text).toBe("Top Bar Custom Announcement");
      expect(restoreRes.body.data.topBarVersion).toBe(2);
    });

    it("9: history and published content persist after subsequent inspection requests", async () => {
      const cookie = await getAdminCookie();

      await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({ promoText: "Persisted Promo Message" });

      // Inspection 1: Storefront endpoint
      const storefrontRes = await request(app).get("/api/v1/navbar");
      expect(storefrontRes.body.data.secondNavbar.promoText).toBe("Persisted Promo Message");

      // Inspection 2: Admin settings endpoint
      const adminRes = await request(app)
        .get("/api/v1/navbar/admin/settings")
        .set("Cookie", cookie);
      expect(adminRes.body.data.secondNavbar.promoText).toBe("Persisted Promo Message");

      // Inspection 3: History endpoint
      const histRes = await request(app)
        .get("/api/v1/navbar/admin/history?section=second_navbar")
        .set("Cookie", cookie);
      expect(histRes.body.data[0].snapshot.secondNavbar.promoText).toBe("Persisted Promo Message");
    });
  });
});
