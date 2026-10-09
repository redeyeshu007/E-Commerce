import { Router } from "express";
import { healthRouter } from "./health.js";

/**
 * API v1 router — mounts all v1 sub-routers.
 * All routes in this file are prefixed with /api/v1 (set in app.ts).
 *
 * Add feature routers here as modules are implemented:
 *   router.use("/products", productRouter);
 *   router.use("/auth", authRouter);
 *   etc.
 */

export const v1Router = Router();

// Health check — always mounted
v1Router.use("/health", healthRouter);

// ── Feature routers (mount here when ready) ────────────────────────────────
// v1Router.use("/auth", authRouter);
// v1Router.use("/products", productRouter);
// v1Router.use("/categories", categoryRouter);
// v1Router.use("/gold-rates", goldRatesRouter);
// v1Router.use("/inventory", inventoryRouter);
// v1Router.use("/cart", cartRouter);
// v1Router.use("/checkout", checkoutRouter);
// v1Router.use("/orders", orderRouter);
// v1Router.use("/payments", paymentRouter);
// v1Router.use("/shipments", shipmentRouter);
// v1Router.use("/customers", customerRouter);
// v1Router.use("/admin", adminRouter);
// v1Router.use("/content", contentRouter);
// v1Router.use("/offers", offerRouter);
