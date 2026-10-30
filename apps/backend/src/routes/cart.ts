import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { CartService } from "../services/cart-service.js";
import { createCustomerAuthMiddleware } from "../middleware/customer-auth.js";
import { logger } from "../utils/logger.js";

const cartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const syncCartSchema = z.object({
  items: z.array(cartItemSchema),
});

export function createCartRouter(env: EnvConfig): Router {
  const router = Router();
  const requireCustomerAuth = createCustomerAuthMiddleware(env);

  /**
   * GET /api/cart
   * Retrieves authenticated customer's cart with live catalog prices
   */
  router.get("/", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const customerId = req.customer!.id;
      const cart = await CartService.getCustomerCart(customerId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch customer cart");
      res.status(500).json({
        success: false,
        error: { code: "FETCH_CART_FAILED", message: "Failed to retrieve cart" },
      });
    }
  });

  /**
   * PUT /api/cart
   * Synchronizes customer's cart items to MongoDB
   */
  router.put("/", requireCustomerAuth, async (req: Request, res: Response) => {
    const parseResult = syncCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid cart items format",
        },
      });
      return;
    }

    try {
      const customerId = req.customer!.id;
      const cart = await CartService.syncCustomerCart(customerId, parseResult.data.items);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to sync customer cart");
      res.status(500).json({
        success: false,
        error: { code: "SYNC_CART_FAILED", message: "Failed to synchronize cart" },
      });
    }
  });

  /**
   * DELETE /api/cart
   * Clears customer's cart in MongoDB
   */
  router.delete("/", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const customerId = req.customer!.id;
      await CartService.clearCustomerCart(customerId);
      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to clear customer cart");
      res.status(500).json({
        success: false,
        error: { code: "CLEAR_CART_FAILED", message: "Failed to clear cart" },
      });
    }
  });

  return router;
}

