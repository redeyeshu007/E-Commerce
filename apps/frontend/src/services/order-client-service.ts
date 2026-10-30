import { type Order, type CreateOrderResult } from "@/types/order";
import { API_BASE_URL } from "@/lib/api-client";
import { getStoredCustomerToken } from "./customer-auth-service";

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

export interface RazorpayPublicConfig {
  keyId: string;
  mode: "test" | "live";
  currency: string;
  isMock?: boolean;
}

function getOrderHeaders(): Record<string, string> {
  const token = getStoredCustomerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export class OrderClientService {
  /**
   * Retrieves public Razorpay configuration from backend (Key ID, Mode, Currency).
   * Secret keys are NEVER exposed.
   */
  static async getRazorpayConfig(): Promise<RazorpayPublicConfig> {
    const res = await fetch(`${API_BASE_URL}/checkout/config`, {
      method: "GET",
      headers: getOrderHeaders(),
    });

    if (!res.ok) {
      throw new Error("Unable to retrieve payment gateway configuration.");
    }

    const body = await res.json();
    return body.data;
  }

  /**
   * Submits order to backend protected checkout endpoint.
   * Generates server-side Razorpay order and returns immutable snapshots.
   */
  static async createOrder(payload: {
    items: OrderItemInput[];
    shippingAddress: ShippingAddressInput;
    paymentMethod?: string;
    idempotencyKey?: string;
  }): Promise<CreateOrderResult> {
    const res = await fetch(`${API_BASE_URL}/checkout/create-order`, {
      method: "POST",
      headers: getOrderHeaders(),
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

    return {
      order: body.data.order,
      razorpay: body.data.razorpay,
    };
  }

  /**
   * Cryptographically verifies Razorpay payment signature on backend.
   * Updates order status to PAID upon verified success.
   */
  static async verifyPayment(payload: {
    orderId?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ order: Order; verified: boolean }> {
    const res = await fetch(`${API_BASE_URL}/checkout/verify-payment`, {
      method: "POST",
      headers: getOrderHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        body?.error?.message || "Payment signature verification failed. Please contact customer support."
      );
    }

    return {
      order: body.data.order,
      verified: Boolean(body.data.verified),
    };
  }

  /**
   * Retrieves orders for currently authenticated customer
   */
  static async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "GET",
      headers: getOrderHeaders(),
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
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: getOrderHeaders(),
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
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm-delivery`, {
      method: "POST",
      headers: getOrderHeaders(),
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to confirm delivery receipt.");
    }

    return body.data.order;
  }
}
