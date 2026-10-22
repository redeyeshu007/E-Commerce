import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("Backend Foundation Test Suite", () => {
  const env = validateEnv();
  const app = createApp(env);

  describe("1. Infrastructure Health Liveness Endpoint (GET /api/health)", () => {
    it("returns 200 with status ok and uptime", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.service).toBe("peralagae-backend");
      expect(typeof res.body.data.timestamp).toBe("string");
      expect(typeof res.body.data.uptime).toBe("number");
      expect(res.headers["x-request-id"]).toBeDefined();
    });

    it("v1 alias /api/v1/health also returns 200 with status ok", async () => {
      const res = await request(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
    });
  });

  describe("2. Database Readiness Endpoint (GET /api/health/ready)", () => {
    it("reports honest database status without crashing", async () => {
      const res = await request(app).get("/api/health/ready");

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("ok");
        expect(res.body.data.database.connected).toBe(true);
      } else {
        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.data.status).toBe("degraded");
        expect(res.body.data.database.connected).toBe(false);
        expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
      }
    });
  });

  describe("3. Unknown Route Handling (404 Not Found)", () => {
    it("returns consistent 404 error envelope for undefined endpoints", async () => {
      const res = await request(app).get("/api/non-existent-endpoint");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.message).toContain("GET /api/non-existent-endpoint");
    });
  });

  describe("4. Centralized Error Handling & Malformed JSON", () => {
    it("returns 400 INVALID_JSON on malformed JSON payload", async () => {
      const res = await request(app)
        .post("/api/health")
        .set("Content-Type", "application/json")
        .send("{ broken_json: ");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_JSON");
      expect(res.body.error.message).toBe("Malformed JSON payload in request body");
    });
  });

  describe("5. Environment Validation (Zod)", () => {
    it("validates valid environment configuration successfully", () => {
      const validConfig = validateEnv({
        NODE_ENV: "test",
        PORT: "4000",
        DATABASE_URL: "",
        CORS_ORIGINS: "http://localhost:3000,http://localhost:5173",
        LOG_LEVEL: "silent",
      });

      expect(validConfig.NODE_ENV).toBe("test");
      expect(validConfig.PORT).toBe(4000);
      expect(validConfig.CORS_ORIGINS).toEqual(["http://localhost:3000", "http://localhost:5173"]);
      expect(validConfig.LOG_LEVEL).toBe("silent");
    });

    it("rejects invalid PORT outside valid range", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "test",
          PORT: "999999",
        }),
      ).toThrow("PORT must be an integer between 1 and 65535");
    });

    it("enforces MONGODB_URI requirement in production", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          MONGODB_URI: "",
          CORS_ORIGINS: "https://peralagae.example.com",
        }),
      ).toThrow("MONGODB_URI is required in production environment");
    });

    it("disallows wildcard CORS origin in production", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/ecom",
          CORS_ORIGINS: "*",
        }),
      ).toThrow("Wildcard CORS origin '*' is not permitted in production");
    });
  });
});
