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
 * Formats whole integers without decimals (e.g. ₹1,299, ₹4,999, ₹32,000).
 * Displays exact 2 decimal places if the amount has fractional paise (e.g. ₹0.12, ₹4.12, ₹50,941.74).
 * Never displays USD or the dollar symbol.
 */
export function formatInr(amount: number | null | undefined): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const isFractional = !Number.isInteger(numericAmount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: isFractional ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
