/**
 * Product Data Model — PERALAGAE
 *
 * Defines strongly-typed product schemas used across product cards,
 * carousels, quick-view dialogs, cart, and wishlist operations.
 */

export interface ProductImage {
  /** Public asset path or URL */
  src: string;
  /** Descriptive alternative text for accessibility */
  alt: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

export interface Product {
  /** Stable unique product identifier */
  id: string;
  /** URL slug */
  slug: string;
  /** Display title of the fine jewellery item */
  name: string;
  /** Product category label (e.g. "NECKLACES", "RINGS", "BRACELETS", "EARRINGS", "CHARMS & BANGLES") */
  category: string;
  /** High-resolution product imagery */
  image: ProductImage;
  /** Numeric price in Indian Rupees (INR) */
  priceInr: number;
  /** Optional original compare-at price in INR (for discounted items) */
  compareAtPriceInr?: number;
  /** Whether product qualifies for "NEW" badge */
  isNew?: boolean;
  /** Whether product qualifies for "HOT" badge */
  isHot?: boolean;
  /** Inventory availability status */
  isAvailable?: boolean;
  /** Detailed description for quick-view and product detail displays */
  description?: string;
  /** Precious metal / gemstone material specification */
  material?: string;
  /** Categorized material tags (e.g. ["Gold", "Diamond", "Platinum", "Silver", "Rose Gold"]) */
  materials?: string[];
  /** Available sizes (e.g. ["6", "7", "8", "9", "10"] for rings, ["16\"", "18\""] for necklaces) */
  sizes?: string[];
  /** Creation ISO date for 'Newest First' sorting */
  createdAt?: string;
  /** In-stock status */
  inStock?: boolean;
}
