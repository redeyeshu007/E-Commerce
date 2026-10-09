import "dotenv/config";
import { validateEnv } from "./config/env.js";
import { createApp } from "./app.js";

// ── Environment validation ─────────────────────────────────────────────────
// Validates all required env variables at startup and throws if any are missing.
const env = validateEnv();

// ── Create Express application ─────────────────────────────────────────────
const app = createApp(env);

// ── Start HTTP server ──────────────────────────────────────────────────────
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.warn(`[server] Gold Commerce API running on http://localhost:${PORT}`);
  console.warn(`[server] Environment: ${env.NODE_ENV}`);
  console.warn(`[server] API docs: http://localhost:${PORT}/api/docs`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
const gracefulShutdown = (signal: string) => {
  console.warn(`[server] Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.warn("[server] HTTP server closed.");
    process.exit(0);
  });

  // Force shutdown after 10 s
  setTimeout(() => {
    console.error("[server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server };
