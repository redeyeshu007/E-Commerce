import { describe, it, expect } from "vitest";
import request from "supertest";
import { validateEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

describe("GET /api/v1/health", () => {
  const env = validateEnv();
  const app = createApp(env);

  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(typeof res.body.data.timestamp).toBe("string");
    expect(typeof res.body.data.version).toBe("string");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
