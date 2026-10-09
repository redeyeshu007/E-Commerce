import { z } from "zod";

/**
 * Common reusable Zod schema primitives.
 * Import and compose these when building feature-level schemas.
 */

/** Non-empty string with whitespace trimmed */
export const nonEmptyString = z.string().trim().min(1, "This field is required");

/** Valid email address */
export const emailSchema = z.string().trim().email("Please enter a valid email address");

/** Phone number — basic format, extend per locale */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,20}$/, "Please enter a valid phone number");

/** Positive integer (useful for IDs, quantities) */
export const positiveInt = z.number().int().positive();

/** UUID v4 */
export const uuidSchema = z.string().uuid("Invalid ID format");

/** ISO 8601 date string */
export const isoDateString = z.string().datetime({ message: "Invalid date format" });

/** Slug — lowercase letters, numbers, and hyphens */
export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");
