import { z } from "zod";

/**
 * Environment variable schema and validation using Zod.
 *
 * Requirements:
 * - Centralized environment validation
 * - Clear, safe configuration error messages
 * - Distinct rules for development, test, and production
 * - No sensitive credentials hardcoded or exposed in logs
 */

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((val, ctx) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PORT must be an integer between 1 and 65535",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  DATABASE_URL: z.string().optional().default(""),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    // DATABASE_URL is required in production
    if (!data.DATABASE_URL || data.DATABASE_URL.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required in production environment",
      });
    } else if (
      !data.DATABASE_URL.startsWith("postgresql://") &&
      !data.DATABASE_URL.startsWith("postgres://")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL must be a valid PostgreSQL connection string",
      });
    }

    // CORS_ORIGINS must not allow wildcard in production
    if (data.CORS_ORIGINS.includes("*")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "Wildcard CORS origin '*' is not permitted in production",
      });
    }
  }
});

export type EnvConfig = z.output<typeof baseEnvSchema>;

/**
 * Validates environment variables.
 * Accepts optional explicit dictionary (useful for isolated unit testing).
 * Defaults to process.env.
 */
export function validateEnv(source: Record<string, string | undefined> = process.env): EnvConfig {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "config"}: ${issue.message}`)
      .join("\n");

    const message = `[config] Configuration validation failed:\n${errorDetails}`;
    if (process.env["NODE_ENV"] !== "test") {
      console.error(message);
    }
    throw new Error(message);
  }

  return result.data;
}
