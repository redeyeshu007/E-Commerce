/**
 * Company / tenant configuration types.
 *
 * Each jewellery company deployment is identified by a unique companyId
 * and has its own configuration file. This module defines the shape of
 * that configuration so both frontend and backend can agree on the contract.
 *
 * See: docs/adding-a-new-company.md (to be written during feature development)
 */

/** Supported currencies (extend as needed) */
export type SupportedCurrency = "INR" | "USD" | "AED" | "GBP" | "EUR";

/** Supported locales */
export type SupportedLocale = "en-IN" | "en-US" | "en-AE" | "en-GB";

/** Feature flags available to each company deployment */
export interface CompanyFeatureFlags {
  goldRateLive: boolean;
  paymentsEnabled: boolean;
  shippingEnabled: boolean;
  wishlistEnabled: boolean;
  reviewsEnabled: boolean;
}

/** Company contact information */
export interface CompanyContact {
  email: string;
  phone?: string;
  address?: string;
}

/** Company identity configuration */
export interface CompanyConfig {
  /** Unique slug identifier — used in environment variables and config filenames */
  companyId: string;
  /** Display name shown to customers */
  companyName: string;
  /** Canonical domain for this deployment (no protocol, no trailing slash) */
  domain: string;
  /** Public site URL (with protocol) */
  siteUrl: string;
  /** Default currency for this deployment */
  currency: SupportedCurrency;
  /** Default locale for number and date formatting */
  locale: SupportedLocale;
  /** Contact details shown on the storefront */
  contact: CompanyContact;
  /** Feature flags — controls which features are active for this deployment */
  features: CompanyFeatureFlags;
}
