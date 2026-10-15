import { Router, type Request, type Response } from "express";
import { ProductService, type ProductFilterInput } from "../services/product-service.js";
import { logger } from "../utils/logger.js";
import type { EnvConfig } from "../config/env.js";

export function createProductRouter(_env: EnvConfig): Router {
  const router = Router();

  /**
   * GET /api/v1/products
   * Retrieves paginated products with filters, sorting, and dynamic category counts
   * backed by Supabase PostgreSQL.
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const {
        category,
        search,
        minPrice,
        maxPrice,
        materials,
        sizes,
        sort,
        page,
        pageSize,
      } = req.query;

      const filters: ProductFilterInput = {
        category: typeof category === "string" ? category : undefined,
        search: typeof search === "string" ? search : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        materials: Array.isArray(materials)
          ? (materials as string[])
          : typeof materials === "string"
          ? materials.split(",")
          : undefined,
        sizes: Array.isArray(sizes)
          ? (sizes as string[])
          : typeof sizes === "string"
          ? sizes.split(",")
          : undefined,
        sort: typeof sort === "string" ? sort : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      };

      const result = await ProductService.getProducts(filters);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch products from database");
      return res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to retrieve products from database",
        },
      });
    }
  });

  /**
   * GET /api/v1/products/:slugOrId
   * Retrieves single product detail by slug or ID.
   */
  router.get("/:slugOrId", async (req: Request, res: Response) => {
    try {
      const slugParam = req.params["slugOrId"];
      const slugOrId = Array.isArray(slugParam) ? slugParam[0] : slugParam;
      if (typeof slugOrId !== "string" || !slugOrId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAM",
            message: "Product slug or ID parameter is required",
          },
        });
      }

      const product = await ProductService.getProductBySlugOrId(slugOrId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: `Product with slug or ID '${slugOrId}' not found`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch product detail from database");
      return res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to retrieve product detail from database",
        },
      });
    }
  });

  /**
   * GET /api/v1/products/:slugOrId/adjacent
   * Retrieves adjacent products for product detail page navigation.
   */
  router.get("/:slugOrId/adjacent", async (req: Request, res: Response) => {
    try {
      const slugParam = req.params["slugOrId"];
      const slugOrId = Array.isArray(slugParam) ? slugParam[0] : slugParam;
      if (typeof slugOrId !== "string" || !slugOrId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PARAM",
            message: "Product slug or ID parameter is required",
          },
        });
      }

      const adjacent = await ProductService.getAdjacentProducts(slugOrId);
      if (!adjacent) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: `Adjacent products for '${slugOrId}' not found`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: adjacent,
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch adjacent products from database");
      return res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to retrieve adjacent products from database",
        },
      });
    }
  });

  return router;
}
