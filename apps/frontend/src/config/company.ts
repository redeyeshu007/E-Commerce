/**
 * Company configuration — frontend.
 *
 * This module provides type-safe access to company-specific configuration
 * that is injected via environment variables at build/runtime.
 *
 * Each company deployment sets its own values via .env.local or server env vars.
 * See: packages/shared-types/src/company.ts for the full CompanyConfig type.
 * See: .env.example for the list of variables.
 *
 * NOTE: Only NEXT_PUBLIC_ prefixed variables are available in the browser bundle.
 * Never put secrets here.
 */

import type { CompanyConfig } from "@gold-commerce/shared-types";

/**
 * Reads company configuration from NEXT_PUBLIC_ environment variables.
 * Called once at module evaluation time — values come from the build environment.
 */
function loadCompanyConfig(): CompanyConfig {
  return {
    companyId: process.env["NEXT_PUBLIC_COMPANY_ID"] ?? "default",
    companyName: process.env["NEXT_PUBLIC_COMPANY_NAME"] ?? "Gold Commerce Platform",
    domain: process.env["NEXT_PUBLIC_COMPANY_DOMAIN"] ?? "localhost",
    siteUrl: process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000",
    currency: "INR",
    locale: "en-IN",
    contact: {
      email: process.env["NEXT_PUBLIC_CONTACT_EMAIL"] ?? "contact@example.com",
    },
    features: {
      goldRateLive: process.env["NEXT_PUBLIC_FEATURE_GOLD_RATE_LIVE"] === "true",
      paymentsEnabled: process.env["NEXT_PUBLIC_FEATURE_PAYMENTS_ENABLED"] === "true",
      shippingEnabled: process.env["NEXT_PUBLIC_FEATURE_SHIPPING_ENABLED"] === "true",
      wishlistEnabled: process.env["NEXT_PUBLIC_FEATURE_WISHLIST_ENABLED"] === "true",
      reviewsEnabled: process.env["NEXT_PUBLIC_FEATURE_REVIEWS_ENABLED"] === "true",
    },
  };
}

export const companyConfig: CompanyConfig = loadCompanyConfig();

/** Convenience accessor for feature flags */
export const featureFlags = companyConfig.features;
