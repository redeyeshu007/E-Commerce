import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class names.
 * Used by shadcn/ui components — do not remove.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount in Indian Rupees (INR) using the Indian numbering system.
 * Formats integers without decimals (e.g. ₹1,299, ₹4,999, ₹12,500).
 * Never displays USD or the dollar symbol.
 */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}
