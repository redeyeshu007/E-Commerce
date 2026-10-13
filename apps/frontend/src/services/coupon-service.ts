/**
 * Coupon Service — PERALAGAE
 *
 * Provides coupon validation, discount computation, and business rules
 * for luxury cart checkout. Structured as a clean boundary for future
 * backend API integration.
 */

export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minSubtotal?: number;
  description: string;
  isExpired?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

/**
 * Curated authentic promotional coupons.
 */
export const VALID_COUPONS: Record<string, Coupon> = {
  SUMMER15: {
    code: "SUMMER15",
    discountType: "percentage",
    discountValue: 15,
    description: "Summer Sale 15% discount",
  },
  PERA10: {
    code: "PERA10",
    discountType: "percentage",
    discountValue: 10,
    description: "Welcome to PERALAGAE 10% discount",
  },
  GOLD5000: {
    code: "GOLD5000",
    discountType: "fixed",
    discountValue: 5000,
    minSubtotal: 30000,
    description: "₹5,000 off on fine jewellery orders above ₹30,000",
  },
  EXPIRED20: {
    code: "EXPIRED20",
    discountType: "percentage",
    discountValue: 20,
    description: "Expired seasonal promotion",
    isExpired: true,
  },
};

/**
 * Validate a promotional coupon code against the current cart subtotal.
 */
export function validateCoupon(
  code: string,
  subtotalInr: number
): CouponValidationResult {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      discountAmount: 0,
      message: "Please enter a coupon code.",
    };
  }

  const coupon = VALID_COUPONS[normalized];

  if (!coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Coupon code "${normalized}" is invalid. Please check and try again.`,
    };
  }

  if (coupon.isExpired) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Coupon code "${normalized}" has expired.`,
    };
  }

  if (coupon.minSubtotal && subtotalInr < coupon.minSubtotal) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Coupon "${normalized}" requires a minimum order of ₹${coupon.minSubtotal.toLocaleString("en-IN")}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotalInr * coupon.discountValue) / 100);
  } else if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, subtotalInr);
  }

  return {
    isValid: true,
    coupon,
    discountAmount,
    message: `Coupon "${coupon.code}" applied successfully (${
      coupon.discountType === "percentage" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue.toLocaleString("en-IN")} off`
    })!`,
  };
}

/**
 * Recalculate discount amount for an already applied coupon when cart subtotal changes.
 */
export function calculateDiscount(coupon: Coupon | null, subtotalInr: number): number {
  if (!coupon || subtotalInr <= 0) return 0;
  if (coupon.minSubtotal && subtotalInr < coupon.minSubtotal) return 0;

  if (coupon.discountType === "percentage") {
    return Math.round((subtotalInr * coupon.discountValue) / 100);
  }
  if (coupon.discountType === "fixed") {
    return Math.min(coupon.discountValue, subtotalInr);
  }
  return 0;
}
