import { type Order, type AdminOrdersResponse } from "@/types/order";

export interface AdminOrdersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

export class OrderAdminService {
  /**
   * Retrieves paginated orders for the admin management dashboard
   */
  static async getOrders(params: AdminOrdersFilterParams = {}): Promise<AdminOrdersResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search.trim());
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.paymentStatus && params.paymentStatus !== "ALL") {
      query.set("paymentStatus", params.paymentStatus);
    }
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);

    const queryString = query.toString();
    const url = `/api/v1/orders/admin${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to retrieve orders");
    }

    return body.data;
  }

  /**
   * Retrieves single order details for admin inspection
   */
  static async getOrderById(orderId: string): Promise<Order> {
    const res = await fetch(`/api/v1/orders/admin/${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to retrieve order details");
    }

    return body.data.order;
  }

  /**
   * Updates fulfilment status with lifecycle validation
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ): Promise<Order> {
    const res = await fetch(`/api/v1/orders/admin/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, note }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update order status");
    }

    return body.data.order;
  }

  /**
   * Uploads shipping evidence images and dispatch notes, transitioning order to SHIPPED
   */
  static async addShippingUpdate(orderId: string, formData: FormData): Promise<Order> {
    const res = await fetch(`/api/v1/orders/admin/${orderId}/shipping`, {
      method: "POST",
      credentials: "include",
      body: formData, // multipart/form-data handled natively
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to save shipping update");
    }

    return body.data.order;
  }

  /**
   * Reconciles order payment status with Razorpay API
   */
  static async reconcilePayment(
    orderId: string
  ): Promise<{ order: Order; reconciled: boolean; reason?: string }> {
    const res = await fetch(`/api/v1/orders/admin/${orderId}/reconcile-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to reconcile payment with Razorpay");
    }

    return body.data;
  }
}
