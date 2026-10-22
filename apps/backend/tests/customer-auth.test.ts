import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("Customer Authentication Integration Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  const timestamp = Date.now();
  const testEmail = `testcustomer_${timestamp}@peralagae.com`;
  const testPassword = "CustomerSecurePassword2026!";
  const testFullName = "Peralagae VIP Customer";

  let customerCookie = "";

  describe("1. Customer Registration (POST /api/auth/register)", () => {
    it("rejects registration with missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects registration with invalid email format", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Test Customer",
        email: "not-an-email",
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects registration when password and confirmPassword do not match", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Test Customer",
        email: "match_test@peralagae.com",
        password: "ValidPassword123!",
        confirmPassword: "DifferentPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("Passwords do not match");
    });

    it("rejects registration with weak password (< 8 chars)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Test Customer",
        email: "short_pw@peralagae.com",
        password: "short",
        confirmPassword: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("successfully registers a new customer with valid credentials and sets HTTP-only cookie", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: testFullName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.customer.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.customer.fullName).toBe(testFullName);
      expect(res.body.data.customer.role).toBe("customer");
      // Must NEVER return password hash
      expect(res.body.data.customer.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain("passwordHash");

      // Verify HTTP-only cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : (cookies as string);
      expect(cookieStr).toContain("peralagae_customer_token");
      expect(cookieStr).toContain("HttpOnly");
      customerCookie = cookieStr;
    });

    it("rejects duplicate customer registration with 409 CONFLICT", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Duplicate User",
        email: testEmail.toUpperCase(), // test email normalization
        password: testPassword,
        confirmPassword: testPassword,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("2. Customer Sign In (POST /api/auth/login)", () => {
    it("rejects login with missing credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects login with wrong password returning safe generic error", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "WrongPassword999!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects login with non-existent email returning identical safe generic error", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent_customer_xyz@peralagae.com",
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("successfully logs in with valid credentials and sets secure cookie", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.customer.fullName).toBe(testFullName);
      expect(res.body.data.customer.passwordHash).toBeUndefined();

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : (cookies as string);
      expect(cookieStr).toContain("peralagae_customer_token");
      customerCookie = cookieStr;
    });
  });

  describe("3. Customer Session Verification & Me (GET /api/auth/me)", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns authenticated customer profile when valid session cookie provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.customer.fullName).toBe(testFullName);
      expect(res.body.data.customer.role).toBe("customer");
    });
  });

  describe("4. Customer Sign Out (POST /api/auth/logout)", () => {
    it("clears authentication cookie on logout", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : (cookies as string);
      // Cookie is expired/cleared
      expect(cookieStr).toMatch(/peralagae_customer_token=;|peralagae_customer_token=Max-Age=0|Expires=/i);
    });
  });

  describe("5. Forgot Password & Password Reset Flow", () => {
    let resetToken = "";

    it("accepts forgot password request gracefully without revealing account existence", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: testEmail,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If an account exists with this email");

      // In non-production test environment, resetToken is returned for verification
      if (res.body.data?.resetToken) {
        resetToken = res.body.data.resetToken;
      }
    });

    it("accepts forgot password for non-existent email with identical message", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "nobody_here_987654@peralagae.com",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If an account exists with this email");
    });

    it("resets password using valid token", async () => {
      if (!resetToken) return; // skip if no token exposed in env

      const newPassword = "BrandNewCustomerPass2026!";
      const res = await request(app).post("/api/auth/reset-password").send({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Password has been reset");

      // Old password must fail now
      const oldLogin = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: testPassword,
      });
      expect(oldLogin.status).toBe(401);

      // New password must succeed
      const newLogin = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: newPassword,
      });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
    });

    it("rejects password reset with invalid or expired token", async () => {
      // 64-character token passing schema validation but not in DB
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        password: "SomePassword123!",
        confirmPassword: "SomePassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_RESET_TOKEN");
    });
  });

  describe("6. Google OAuth Configuration Status & Validation", () => {
    it("reports accurate configuration status at GET /api/auth/google/url", async () => {
      const res = await request(app).get("/api/auth/google/url");

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.configured).toBe(true);
        expect(res.body.data.authUrl).toContain("accounts.google.com");
      } else {
        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.data.configured).toBe(false);
        expect(res.body.error.code).toBe("GOOGLE_NOT_CONFIGURED");
      }
    });

    it("handles POST /api/auth/google with missing code or unconfigured credentials gracefully", async () => {
      const res = await request(app).post("/api/auth/google").send({});

      expect([400, 503]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
