import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("Admin Authentication Test Suite (Phase 1)", () => {
  const env = validateEnv();
  const app = createApp(env);

  const validEmail = env.ADMIN_EMAIL;
  const validPassword = env.ADMIN_PASSWORD;

  describe("1. POST /api/admin/auth/login", () => {
    it("rejects request with missing email or password", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects request with malformed email", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: "not-an-email",
        password: "somepassword",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects invalid password with generic error message", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: validEmail,
        password: "wrong_password_12345",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.message).toBe("Invalid email or password");
      // Must not leak stack or target password
      expect(res.body.error.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(validPassword);
    });

    it("rejects invalid email with identical generic error message", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: "nonexistent_admin@peralagae.com",
        password: validPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("authenticates successfully with valid credentials and sets HTTP-only cookie", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: validEmail,
        password: validPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe(validEmail);
      expect(res.body.data.admin.role).toBe("admin");
      expect(typeof res.body.data.token).toBe("string");

      // Verify Set-Cookie header contains HttpOnly session token
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies || "";
      expect(cookieStr).toContain("peralagae_admin_token=");
      expect(cookieStr).toContain("HttpOnly");

      // Ensure no passwords or secrets are returned
      expect(JSON.stringify(res.body)).not.toContain(validPassword);
      expect(JSON.stringify(res.body)).not.toContain(env.ADMIN_JWT_SECRET);
    });

    it("authenticates successfully with email containing leading/trailing whitespace and mixed case", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: `  ${validEmail.toUpperCase()}  `,
        password: validPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe(validEmail.toLowerCase());
    });
  });

  describe("2. GET /api/admin/auth/me (Protected Session Check)", () => {
    it("returns 401 when accessed without session cookie or token", async () => {
      const res = await request(app).get("/api/admin/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when accessed with an invalid or tampered token", async () => {
      const res = await request(app)
        .get("/api/admin/auth/me")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 with admin identity when valid cookie is provided", async () => {
      // 1. Log in first
      const loginRes = await request(app).post("/api/admin/auth/login").send({
        email: validEmail,
        password: validPassword,
      });

      const cookies = loginRes.headers["set-cookie"];
      expect(cookies).toBeDefined();

      // 2. Access /me with the cookie
      const meRes = await request(app)
        .get("/api/admin/auth/me")
        .set("Cookie", cookies as unknown as string[]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe(validEmail);
      expect(meRes.body.data.role).toBe("admin");
    });

    it("returns 200 with admin identity when valid Bearer header is provided", async () => {
      // 1. Log in first
      const loginRes = await request(app).post("/api/admin/auth/login").send({
        email: validEmail,
        password: validPassword,
      });

      const token = loginRes.body.data.token;
      expect(token).toBeDefined();

      // 2. Access /me with Bearer token
      const meRes = await request(app)
        .get("/api/admin/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe(validEmail);
      expect(meRes.body.data.role).toBe("admin");
    });
  });

  describe("3. POST /api/admin/auth/logout", () => {
    it("clears the admin session cookie and returns success", async () => {
      const res = await request(app).post("/api/admin/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Logged out");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies || "";
      // Cleared cookie has empty value or past expiration
      expect(cookieStr).toContain("peralagae_admin_token=");
    });
  });
});
