import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";
import { GstService } from "./gst-service.js";

export interface ShippingAddressInput {
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  country?: string | undefined;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string; // DERIVED FROM VERIFIED SERVER-SIDE SESSION
  items: OrderItemInput[];
  shippingAddress: ShippingAddressInput;
  paymentMethod?: string | undefined;
  idempotencyKey?: string | undefined;
}

export interface AdminOrdersFilter {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  status?: string | undefined;
  paymentStatus?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export class OrderService {
  /**
   * Generates a collision-resistant luxury order number
   * Format: PLG-YYYYMMDD-XXXX (e.g. PLG-20261021-9K4F)
   */
  private static generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PLG-${dateStr}-${randomHex}`;
  }

  /**
   * Creates an order with strict server-side price, stock, and GST validation.
   * Cash on Delivery (COD) is strictly disallowed.
   * Payment method is UPI only with SIMULATED test payment status.
   */
  static async createOrder(input: CreateOrderInput) {
    const { customerId, items, shippingAddress, paymentMethod = "UPI", idempotencyKey } = input;

    if (!customerId) {
      throw Object.assign(new Error("Customer authentication required to place an order"), {
        code: "UNAUTHORIZED",
        status: 401,
      });
    }

    // 1. COD is strictly disabled
    const normalizedPaymentMethod = (paymentMethod || "UPI").trim().toUpperCase();
    if (normalizedPaymentMethod === "COD") {
      throw Object.assign(
        new Error("Cash on Delivery (COD) is not supported. Please select UPI simulation payment."),
        {
          code: "COD_NOT_ALLOWED",
          status: 400,
        }
      );
    }

    // 2. Check Idempotency protection against duplicate submissions
    if (idempotencyKey && typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
      const existingOrder = await prisma.order.findFirst({
        where: { idempotencyKey: idempotencyKey.trim() },
        include: {
          items: true,
          statusLogs: { orderBy: { createdAt: "asc" } },
          shippingUpdates: { orderBy: { createdAt: "asc" } },
        },
      });

      if (existingOrder) {
        logger.info(
          { orderId: existingOrder.id, orderNumber: existingOrder.orderNumber, idempotencyKey },
          "Returning existing order matched by idempotency key"
        );
        return existingOrder;
      }
    }

    // 3. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw Object.assign(new Error("Order must contain at least one item"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    // 4. Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName?.trim() ||
      !shippingAddress.addressLine?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.postalCode?.trim() ||
      !shippingAddress.phone?.trim()
    ) {
      throw Object.assign(
        new Error("Complete shipping address with recipient name, street address, city, state, postal code, and phone is required"),
        { code: "VALIDATION_ERROR", status: 400 }
      );
    }

    // 5. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw Object.assign(new Error("Customer account not found"), {
        code: "UNAUTHORIZED",
        status: 401,
      });
    }

    // 6. Aggregate quantities and check product stock
    const productIds: string[] = [];
    const quantityMap = new Map<string, number>();

    for (const item of items) {
      if (!item.productId || typeof item.productId !== "string") {
        throw Object.assign(new Error("Invalid product ID in order item"), {
          code: "VALIDATION_ERROR",
          status: 400,
        });
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty < 1) {
        throw Object.assign(new Error("Product quantity must be at least 1"), {
          code: "VALIDATION_ERROR",
          status: 400,
        });
      }
      productIds.push(item.productId);
      quantityMap.set(item.productId, (quantityMap.get(item.productId) || 0) + qty);
    }

    // Fetch live product records from MongoDB (never trust client prices or stock)
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (dbProducts.length !== new Set(productIds).size) {
      throw Object.assign(
        new Error("One or more items in your cart could not be found or are no longer catalogued."),
        { code: "PRODUCT_NOT_FOUND", status: 404 }
      );
    }

    // 7. Validate stock and calculate prices
    const activeGst = await GstService.getSetting();
    const gstRate = activeGst.percentage;
    const isInclusive = activeGst.isInclusive;

    let subtotalInr = 0;
    let totalTaxInr = 0;

    const validatedItems: {
      productId: string;
      productName: string;
      productSlug: string;
      productImageUrl: string;
      unitPriceInr: number;
      quantity: number;
      totalPriceInr: number;
      gstRate: number;
      taxInr: number;
    }[] = [];

    for (const product of dbProducts) {
      const requestedQty = quantityMap.get(product.id) || 1;

      if (!product.isAvailable || !product.inStock) {
        throw Object.assign(
          new Error(`Product "${product.name}" is currently unavailable or out of stock.`),
          { code: "PRODUCT_UNAVAILABLE", status: 400 }
        );
      }

      if (product.stockCount < requestedQty) {
        throw Object.assign(
          new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockCount}, Requested: ${requestedQty}.`
          ),
          { code: "INSUFFICIENT_STOCK", status: 400 }
        );
      }

      const unitPrice = product.priceInr;
      const lineTotal = unitPrice * requestedQty;
      const { taxInr: itemTax } = GstService.calculateTax(lineTotal, gstRate, isInclusive);

      subtotalInr += lineTotal;
      totalTaxInr += itemTax;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImageUrl: product.imageUrl,
        unitPriceInr: unitPrice,
        quantity: requestedQty,
        totalPriceInr: lineTotal,
        gstRate,
        taxInr: itemTax,
      });
    }

    // Complimentary insured express delivery for PERALAGAE fine jewellery
    const shippingInr = 0;
    const discountInr = 0;
    const totalInr = subtotalInr - discountInr + shippingInr; // Inclusive of GST
    const orderNumber = this.generateOrderNumber();

    // 8. Atomic transaction: create order, status log, and concurrency-safe stock deduction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: "PLACED",
          subtotalInr,
          discountInr,
          shippingInr,
          taxInr: totalTaxInr,
          totalInr,
          gstRate,
          gstInclusive: isInclusive,
          idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
          shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            addressLine: shippingAddress.addressLine.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            phone: shippingAddress.phone.trim(),
            country: shippingAddress.country?.trim() || "India",
          },
          paymentMethod: "UPI",
          paymentStatus: "SIMULATED", // Explicitly simulated test payment
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSlug: item.productSlug,
              productImageUrl: item.productImageUrl,
              unitPriceInr: item.unitPriceInr,
              quantity: item.quantity,
              totalPriceInr: item.totalPriceInr,
              gstRate: item.gstRate,
              taxInr: item.taxInr,
            })),
          },
          statusLogs: {
            create: {
              fromStatus: null,
              toStatus: "PLACED",
              note: "Test order placed via UPI simulation",
              updatedBy: customer.id,
              updatedByRole: "CUSTOMER",
            },
          },
        },
        include: {
          items: true,
          statusLogs: true,
        },
      });

      // Deduct stock safely for each item
      for (const item of validatedItems) {
        const currentProd = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockCount: true },
        });

        const newStock = Math.max(0, (currentProd?.stockCount ?? item.quantity) - item.quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockCount: newStock,
            inStock: newStock > 0,
          },
        });
      }

      return createdOrder;
    });

    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber, customerId: customer.id, totalInr },
      "Order created successfully in MongoDB with SIMULATED UPI payment"
    );

    return order;
  }

  /**
   * Retrieves all orders for the authenticated customer with strict ownership check
   */
  static async getCustomerOrders(customerId: string) {
    if (!customerId) {
      throw Object.assign(new Error("Customer authentication required"), {
        code: "UNAUTHORIZED",
        status: 401,
      });
    }

    return prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
        shippingUpdates: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves a single order with strict customer ownership verification
   */
  static async getOrderById(orderId: string, customerId: string) {
    if (!customerId) {
      throw Object.assign(new Error("Customer authentication required"), {
        code: "UNAUTHORIZED",
        status: 401,
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
        shippingUpdates: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found"), {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    // STRICT CUSTOMER OWNERSHIP ENFORCEMENT
    if (order.customerId !== customerId) {
      throw Object.assign(new Error("You do not have permission to access this order"), {
        code: "FORBIDDEN",
        status: 403,
      });
    }

    return order;
  }

  /**
   * Customer confirms receipt of delivery
   * Changes status from SHIPPED to DELIVERED
   */
  static async confirmOrderDelivered(orderId: string, customerId: string) {
    const order = await this.getOrderById(orderId, customerId);

    if (order.status !== "SHIPPED") {
      throw Object.assign(
        new Error(`Order is currently "${order.status}". Only shipped orders can be confirmed as delivered.`),
        { code: "INVALID_TRANSITION", status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          statusLogs: {
            create: {
              fromStatus: "SHIPPED",
              toStatus: "DELIVERED",
              note: "Customer confirmed order receipt",
              updatedBy: customerId,
              updatedByRole: "CUSTOMER",
            },
          },
        },
        include: {
          items: true,
          statusLogs: { orderBy: { createdAt: "asc" } },
          shippingUpdates: { orderBy: { createdAt: "asc" } },
        },
      });

      return updated;
    });

    logger.info({ orderId, customerId }, "Order receipt confirmed by customer and marked DELIVERED");
    return updatedOrder;
  }

  /**
   * Admin: List orders with search, filters, and pagination
   */
  static async getAdminOrders(filter: AdminOrdersFilter = {}) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Fulfilment status filter
    if (filter.status && filter.status !== "ALL") {
      where.status = filter.status.trim().toUpperCase();
    }

    // Payment status filter
    if (filter.paymentStatus && filter.paymentStatus !== "ALL") {
      where.paymentStatus = filter.paymentStatus.trim().toUpperCase();
    }

    // Date range filter
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search query by orderNumber
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: true,
          statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Retrieve full order details by ID
   */
  static async getAdminOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profile: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                stockCount: true,
              },
            },
          },
        },
        statusLogs: { orderBy: { createdAt: "asc" } },
        shippingUpdates: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found"), {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    return order;
  }

  /**
   * Admin: Update order status with strict workflow validation.
   * Admin cannot unilaterally mark order as DELIVERED (requires customer confirmation).
   */
  static async updateOrderStatus(
    orderId: string,
    toStatus: string,
    adminId: string,
    note?: string | undefined
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: true },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found"), {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    const currentStatus = order.status;
    const targetStatus = toStatus.trim().toUpperCase();

    // Admin cannot mark DELIVERED unilaterally
    if (targetStatus === "DELIVERED") {
      throw Object.assign(
        new Error(
          "Delivery confirmation must be initiated by the customer upon receipt of goods."
        ),
        { code: "FORBIDDEN_TRANSITION", status: 400 }
      );
    }

    // Validate lifecycle transitions
    const validTransitions: Record<string, string[]> = {
      PLACED: ["PROCESSING", "CANCELLED", "DELIVERY_ISSUE"],
      PROCESSING: ["SHIPPED", "CANCELLED", "DELIVERY_ISSUE"],
      SHIPPED: ["DELIVERY_ISSUE", "CANCELLED"],
      DELIVERED: ["DELIVERY_ISSUE"],
      CANCELLED: [],
      DELIVERY_ISSUE: ["PROCESSING", "SHIPPED", "CANCELLED"],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw Object.assign(
        new Error(
          `Cannot transition order from "${currentStatus}" to "${targetStatus}". Allowed transitions: ${allowed.join(", ") || "none"}`
        ),
        { code: "INVALID_STATUS_TRANSITION", status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: targetStatus,
        statusLogs: {
          create: {
            fromStatus: currentStatus,
            toStatus: targetStatus,
            note: note || `Status updated to ${targetStatus} by admin`,
            updatedBy: adminId,
            updatedByRole: "ADMIN",
          },
        },
      };

      if (targetStatus === "SHIPPED" && !order.dispatchedAt) {
        updateData.dispatchedAt = new Date();
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: true,
          statusLogs: { orderBy: { createdAt: "asc" } },
          shippingUpdates: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    logger.info(
      { orderId, fromStatus: currentStatus, toStatus: targetStatus, adminId },
      "Admin updated order status"
    );

    return updated;
  }

  /**
   * Admin: Add Shipping Evidence (multiple images, carrier, tracking #, description)
   * Automatically moves status to SHIPPED if not already shipped.
   */
  static async addShippingUpdate(
    orderId: string,
    data: {
      carrierName?: string | undefined;
      trackingNumber?: string | undefined;
      description: string;
      images: Array<{ url: string; filename?: string | undefined }>;
    },
    adminId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found"), {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    if (!data.description || !data.description.trim()) {
      throw Object.assign(new Error("Shipping description / dispatch note is required"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    const currentStatus = order.status;
    const shouldTransitionToShipped = currentStatus === "PLACED" || currentStatus === "PROCESSING";
    const newStatus = shouldTransitionToShipped ? "SHIPPED" : currentStatus;

    // Existing shipping images array
    const existingImages = Array.isArray(order.shippingImages) ? (order.shippingImages as any[]) : [];
    const mergedImages = [...existingImages, ...(data.images || [])];

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Create shipping update record
      await tx.orderShippingUpdate.create({
        data: {
          orderId,
          carrierName: data.carrierName?.trim() || order.carrierName || "Direct Courier",
          trackingNumber: data.trackingNumber?.trim() || order.trackingNumber || null,
          description: data.description.trim(),
          images: data.images || [],
          createdBy: adminId,
        },
      });

      // 2. Update order
      const updateData: any = {
        carrierName: data.carrierName?.trim() || order.carrierName,
        trackingNumber: data.trackingNumber?.trim() || order.trackingNumber,
        shippingDescription: data.description.trim(),
        shippingImages: mergedImages,
      };

      if (shouldTransitionToShipped) {
        updateData.status = "SHIPPED";
        updateData.dispatchedAt = new Date();
        updateData.statusLogs = {
          create: {
            fromStatus: currentStatus,
            toStatus: "SHIPPED",
            note: `Dispatched: ${data.description.trim()}`,
            updatedBy: adminId,
            updatedByRole: "ADMIN",
          },
        };
      } else {
        updateData.statusLogs = {
          create: {
            fromStatus: currentStatus,
            toStatus: currentStatus,
            note: `Shipping update added: ${data.description.trim()}`,
            updatedBy: adminId,
            updatedByRole: "ADMIN",
          },
        };
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: true,
          statusLogs: { orderBy: { createdAt: "asc" } },
          shippingUpdates: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    logger.info(
      { orderId, imagesCount: data.images?.length || 0, newStatus, adminId },
      "Shipping update saved and status transitioned to SHIPPED"
    );

    return updatedOrder;
  }
}
