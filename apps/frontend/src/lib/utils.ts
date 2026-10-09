import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class names.
 * Used by shadcn/ui components — do not remove.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
