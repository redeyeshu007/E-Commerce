import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("Navbar Management API Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  let adminCookie: string;

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
    });
  });

  describe("2. Admin Authorization & Protected Settings", () => {
    it("rejects unauthenticated request to GET /api/v1/navbar/admin/settings", async () => {
      const res = await request(app).get("/api/v1/navbar/admin/settings");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("allows authenticated admin to GET /api/v1/navbar/admin/settings", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/navbar/admin/settings")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.topBar.backgroundColor).toBeDefined();
    });
  });

  describe("3. PUT /api/v1/navbar/admin/top-bar", () => {
    it("rejects unauthenticated update attempt", async () => {
      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .send({ text: "Hacked announcement" });

      expect(res.status).toBe(401);
    });

    it("rejects invalid payload when text exceeds 250 characters", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "A".repeat(251) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("250 characters");
    });

    it("rejects empty announcement text", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("successfully updates top bar announcement, increments version, and creates history", async () => {
      const cookie = await getAdminCookie();
      const updatePayload = {
        text: "DIWALI SPECIAL: 50% OFF ON LUXURY GOLD JEWELLERY",
        backgroundColor: "#FCE7F3",
        textColor: "#111827",
        visible: true,
        dismissible: false,
        description: "Updated for Diwali luxury campaign",
      };

      const res = await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topBar.text).toBe(updatePayload.text);
      expect(res.body.data.topBar.backgroundColor).toBe(updatePayload.backgroundColor);
      expect(res.body.data.topBar.dismissible).toBe(false);
      expect(res.body.data.version).toBeGreaterThan(1);

      // Verify storefront endpoint immediately reflects changes
      const storefrontRes = await request(app).get("/api/v1/navbar");
      expect(storefrontRes.body.data.topBar.text).toBe(updatePayload.text);
      expect(storefrontRes.body.data.topBar.dismissible).toBe(false);
    });
  });

  describe("4. PUT /api/v1/navbar/admin/second-navbar", () => {
    it("rejects invalid payload when promo text exceeds 120 characters", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({
          phone: "+91 99999 88888",
          promoText: "B".repeat(121),
          ctaText: "Shop",
          ctaHref: "/shop",
          links: [{ id: "l1", label: "Link 1", href: "/l1", isImplemented: true }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("120 characters");
    });

    it("rejects update when links array is empty", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({
          phone: "+91 99999 88888",
          promoText: "Valid promo",
          ctaText: "Shop",
          ctaHref: "/shop",
          links: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("successfully updates second navbar elements and dynamic links", async () => {
      const cookie = await getAdminCookie();
      const updatePayload = {
        phone: "+91 98400 12345",
        phoneHref: "tel:+919840012345",
        promoText: "Festive Collection Live — Complimentary Hallmarking",
        ctaText: "Explore Now",
        ctaHref: "/collections/festive",
        links: [
          { id: "find-store", label: "Store Locator", href: "/#store-locator", isImplemented: true },
          { id: "custom-orders", label: "Custom Jewellery", href: "/#custom-orders", isImplemented: true },
          { id: "faqs", label: "Help & FAQs", href: "/#faqs", isImplemented: false },
        ],
        showPhone: true,
        showPromotion: true,
        showLinks: true,
        description: "Updated festive promo banner and custom orders link",
      };

      const res = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.secondNavbar.phone).toBe(updatePayload.phone);
      expect(res.body.data.secondNavbar.promoText).toBe(updatePayload.promoText);
      expect(res.body.data.secondNavbar.links.length).toBe(3);
      expect(res.body.data.secondNavbar.links[1]?.label).toBe("Custom Jewellery");

      // Verify storefront sync
      const storefrontRes = await request(app).get("/api/v1/navbar");
      expect(storefrontRes.body.data.secondNavbar.promoText).toBe(updatePayload.promoText);
    });
  });

  describe("5. Content History & Version Restoration", () => {
    it("returns history records with version snapshots", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .get("/api/v1/navbar/admin/history")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstRecord = res.body.data[0];
      expect(firstRecord.id).toBeDefined();
      expect(firstRecord.snapshot).toBeDefined();
      expect(firstRecord.version).toBeDefined();
    });

    it("rejects restore for non-existent snapshot ID", async () => {
      const cookie = await getAdminCookie();
      const res = await request(app)
        .post("/api/v1/navbar/admin/history/non_existent_id_9999/restore")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RESTORE_FAILED");
    });

    it("restores older version snapshot, creates pre-restore backup, and increments published version", async () => {
      const cookie = await getAdminCookie();

      // Retrieve history list
      const historyRes = await request(app)
        .get("/api/v1/navbar/admin/history")
        .set("Cookie", cookie);

      const historyRecords = historyRes.body.data;
      const targetRecord = historyRecords[historyRecords.length - 1]; // Oldest snapshot
      const targetVersion = targetRecord.version;

      const restoreRes = await request(app)
        .post(`/api/v1/navbar/admin/history/${targetRecord.id}/restore`)
        .set("Cookie", cookie);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.topBar.text).toBe(targetRecord.snapshot.topBar.text);
      expect(restoreRes.body.data.version).toBeGreaterThan(targetVersion);

      // Verify new history list has the pre-restore backup record
      const postRestoreHistory = await request(app)
        .get("/api/v1/navbar/admin/history")
        .set("Cookie", cookie);

      expect(postRestoreHistory.body.data[0]?.description).toContain("Pre-restore backup");
    });

    it("restores only top_bar section without altering second_navbar when section='top_bar'", async () => {
      const cookie = await getAdminCookie();

      // Ensure distinct top_bar and second_navbar
      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "PROMO VERSION A" });

      const putSecondRes = await request(app)
        .put("/api/v1/navbar/admin/second-navbar")
        .set("Cookie", cookie)
        .send({
          phone: "+91 99999 00000",
          promoText: "UNIQUE SECOND NAVBAR TEXT",
          ctaText: "Shop Now",
          ctaHref: "/shop",
          links: [{ id: "l1", label: "Store", href: "/store", isImplemented: true }],
        });
      expect(putSecondRes.status).toBe(200);

      const historyRes = await request(app)
        .get("/api/v1/navbar/admin/history")
        .set("Cookie", cookie);

      const records = historyRes.body.data;
      const olderSnapshot = records.find(
        (r: any) => r.snapshot?.topBar?.text && r.snapshot.topBar.text !== "PROMO VERSION A"
      );
      expect(olderSnapshot).toBeDefined();

      const restoreRes = await request(app)
        .post(`/api/v1/navbar/admin/history/${olderSnapshot.id}/restore`)
        .set("Cookie", cookie)
        .send({ section: "top_bar" });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      // Top bar restored to older text
      expect(restoreRes.body.data.topBar.text).toBe(olderSnapshot.snapshot.topBar.text);
      // Second navbar was NOT overwritten, preserved current
      expect(restoreRes.body.data.secondNavbar.promoText).toBe("UNIQUE SECOND NAVBAR TEXT");
    });

    it("restores only second_navbar section without altering top_bar when section='second_navbar'", async () => {
      const cookie = await getAdminCookie();

      // Ensure current top bar has a unique value
      await request(app)
        .put("/api/v1/navbar/admin/top-bar")
        .set("Cookie", cookie)
        .send({ text: "PRESERVED TOP BAR ANNOUNCEMENT" });

      const historyRes = await request(app)
        .get("/api/v1/navbar/admin/history")
        .set("Cookie", cookie);

      const records = historyRes.body.data;
      const olderSnapshot = records.find(
        (r: any) =>
          r.snapshot?.secondNavbar?.promoText &&
          r.snapshot.secondNavbar.promoText !== "UNIQUE SECOND NAVBAR TEXT"
      );
      expect(olderSnapshot).toBeDefined();

      const restoreRes = await request(app)
        .post(`/api/v1/navbar/admin/history/${olderSnapshot.id}/restore`)
        .set("Cookie", cookie)
        .send({ section: "second_navbar" });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      // Top bar remains preserved
      expect(restoreRes.body.data.topBar.text).toBe("PRESERVED TOP BAR ANNOUNCEMENT");
      // Second navbar restored to older snapshot
      expect(restoreRes.body.data.secondNavbar.promoText).toBe(
        olderSnapshot.snapshot.secondNavbar.promoText
      );
    });
  });
});
