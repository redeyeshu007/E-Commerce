import { type Order, type ShippingAddress } from "@/types/order";

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface ShippingAddressInput {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
}

// Re-export Order as OrderOutput for backward compatibility
export type OrderOutput = Order;

export class OrderClientService {
  /**
   * Submits order to backend protected checkout endpoint.
   * Enforces UPI test simulation payment method and idempotency key.
   */
  static async createOrder(payload: {
    items: OrderItemInput[];
    shippingAddress: ShippingAddressInput;
    paymentMethod?: string;
    idempotencyKey?: string;
  }): Promise<Order> {
    const res = await fetch("/api/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        paymentMethod: payload.paymentMethod || "UPI",
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Authentication required. Please sign in to complete checkout.");
      }
      throw new Error(body?.error?.message || "Failed to place order. Please try again.");
    }

    return body.data.order;
  }

  /**
   * Retrieves orders for currently authenticated customer
   */
  static async getMyOrders(): Promise<Order[]> {
    const res = await fetch("/api/orders", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        return [];
      }
      throw new Error("Unable to fetch order history.");
    }

    const body = await res.json();
    return body.data?.orders || [];
  }

  /**
   * Retrieves details for a single order owned by the customer
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const body = await res.json();
    return body.data?.order || null;
  }

  /**
   * Customer confirms delivery receipt of their shipped order
   */
  static async confirmDelivery(orderId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to confirm delivery receipt.");
    }

    return body.data.order;
  }
}
