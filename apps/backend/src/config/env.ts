import { z } from "zod";

/**
 * Environment variable schema and validation.
 *
 * All required environment variables are declared here with Zod.
 * The application will throw a clear error at startup if any required
 * variable is missing or has an invalid value.
 *
 * See: .env.example for the full list of variables.
 */

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((v) => parseInt(v, 10)),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Company identity
  COMPANY_ID: z.string().min(1, "COMPANY_ID is required"),
  COMPANY_NAME: z.string().min(1, "COMPANY_NAME is required"),
  COMPANY_DOMAIN: z.string().min(1, "COMPANY_DOMAIN is required"),

  // Feature flags
  FEATURE_GOLD_RATE_LIVE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FEATURE_PAYMENTS_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FEATURE_SHIPPING_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

export type EnvConfig = z.output<typeof envSchema>;

/**
 * Validates process.env against the schema.
 * Called once at application startup in server.ts.
 * Throws a formatted error if any required variable is missing.
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("[config] ❌ Invalid environment variables:\n");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error(
      "[config] Application failed to start due to missing or invalid environment variables. See above for details.",
    );
  }

  return result.data;
}
