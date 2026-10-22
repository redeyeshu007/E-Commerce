export type OrderStatus =
  | "PLACED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "DELIVERY_ISSUE";

export type PaymentMethod = "UPI" | "COD" | "CARD" | "NETBANKING";
export type PaymentStatus = "SIMULATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface ShippingAddress {
  fullName?: string;
  addressLine?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl?: string | null;
  unitPriceInr: number;
  quantity: number;
  totalPriceInr: number;
  gstRate?: number;
  taxInr?: number;
  product?: {
    id: string;
    slug: string;
    stockCount?: number;
  };
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  updatedBy: string;
  updatedByRole: "ADMIN" | "CUSTOMER" | "SYSTEM";
  createdAt: string;
}

export interface ShippingImage {
  url: string;
  filename?: string;
}

export interface OrderShippingUpdateItem {
  id: string;
  orderId: string;
  carrierName: string | null;
  trackingNumber: string | null;
  description: string;
  images: ShippingImage[];
  createdAt: string;
  createdBy: string | null;
}

export interface OrderCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  profile?: {
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: OrderCustomerSummary;
  status: OrderStatus | string;
  subtotalInr: number;
  discountInr: number;
  shippingInr: number;
  taxInr: number;
  totalInr: number;
  gstRate?: number;
  gstInclusive?: boolean;
  idempotencyKey?: string | null;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  shippingDescription?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  shippingImages?: ShippingImage[];
  items: OrderItem[];
  statusLogs?: OrderStatusHistoryItem[];
  shippingUpdates?: OrderShippingUpdateItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface AdminOrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
