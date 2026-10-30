import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface CartItemSyncInput {
  productId: string;
  quantity: number;
}

export class CartService {
  /**
   * Retrieves an authenticated customer's cart with live catalog pricing and stock checks
   */
  static async getCustomerCart(customerId: string) {
    if (!customerId) return { items: [], subtotalInr: 0, totalInr: 0 };

    const cart = await prisma.customerCart.findUnique({
      where: { customerId },
    });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return { items: [], subtotalInr: 0, totalInr: 0 };
    }

    const rawItems = cart.items as Array<{ productId: string; quantity: number; addedAt?: string }>;

    // Fetch live product details from MongoDB
    const productIds = rawItems.map((i) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true,
        inStock: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const validItems: Array<{
      id: string;
      product: {
        id: string;
        name: string;
        slug: string;
        imageUrl: string;
        priceInr: number;
        compareAtPriceInr?: number | null;
        stockCount: number;
      };
      quantity: number;
      totalInr: number;
    }> = [];

    let subtotalInr = 0;

    for (const raw of rawItems) {
      const product = productMap.get(raw.productId);
      if (product) {
        const qty = Math.max(1, Math.min(product.stockCount || 10, Number(raw.quantity) || 1));
        const itemTotal = product.priceInr * qty;
        subtotalInr += itemTotal;

        validItems.push({
          id: product.id,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            priceInr: product.priceInr,
            compareAtPriceInr: product.compareAtPriceInr,
            stockCount: product.stockCount,
          },
          quantity: qty,
          totalInr: itemTotal,
        });
      }
    }

    // 3% GST included calculation rule
    const totalInr = subtotalInr;

    return {
      items: validItems,
      subtotalInr,
      totalInr,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Syncs / saves the customer's cart items to MongoDB
   */
  static async syncCustomerCart(customerId: string, items: CartItemSyncInput[]) {
    if (!customerId) {
      throw Object.assign(new Error("Customer ID required"), { status: 401 });
    }

    const sanitizedItems = (items || [])
      .filter((i) => i && typeof i.productId === "string" && Number(i.quantity) > 0)
      .map((i) => ({
        productId: i.productId.trim(),
        quantity: Math.max(1, Math.floor(Number(i.quantity))),
        addedAt: new Date().toISOString(),
      }));

    const cart = await prisma.customerCart.upsert({
      where: { customerId },
      create: {
        customerId,
        items: sanitizedItems,
      },
      update: {
        items: sanitizedItems,
      },
    });

    logger.info({ customerId, itemCount: sanitizedItems.length }, "Customer cart synchronized to MongoDB");
    return this.getCustomerCart(customerId);
  }

  /**
   * Clears the customer's cart in MongoDB (e.g. after successful order placement)
   */
  static async clearCustomerCart(customerId: string) {
    if (!customerId) return;

    try {
      await prisma.customerCart.upsert({
        where: { customerId },
        create: { customerId, items: [] },
        update: { items: [] },
      });
      logger.info({ customerId }, "Customer cart cleared in MongoDB");
    } catch (err) {
      logger.warn({ err, customerId }, "Failed to clear customer cart");
    }
  }
}

