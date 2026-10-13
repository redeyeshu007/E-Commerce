/**
 * Recommendation Service — PERALAGAE
 *
 * Implements deterministic, priority-based product recommendation logic
 * for the Cart Page ("You May Be Interested In...").
 *
 * Recommendation Hierarchy:
 * Priority 1: Same category as items in the customer's cart
 * Priority 2: Closely related jewellery categories
 * Priority 3: Matching attributes (materials, price tier)
 * Exclusions: Products already in cart, out-of-stock items, duplicates
 * Fallback: Curated catalogue items if cart is empty or pool is small
 */

import type { Product } from "@/types/product";
import type { CartItem } from "@/providers/storefront-provider";
import { SHOP_PRODUCTS } from "./product-service";

/**
 * Related category mapping based on classic fine jewellery pairings.
 */
export const RELATED_CATEGORIES_MAP: Record<string, string[]> = {
  rings: ["bracelets", "earrings", "necklaces"],
  earrings: ["necklaces", "bracelets", "rings"],
  necklaces: ["earrings", "charms-bangles", "bracelets", "rings"],
  bracelets: ["rings", "charms-bangles", "necklaces", "earrings"],
  "charms-bangles": ["bracelets", "necklaces", "rings"],
  "gift-ideas": ["necklaces", "rings", "earrings", "bracelets"],
};

export interface RecommendationOptions {
  /** Maximum number of recommendations to return (defaults to 4) */
  limit?: number;
  /** Custom catalogue source for testing or API injection */
  catalogue?: Product[];
}

/**
 * Normalize category string for robust matching (e.g. 'RINGS' -> 'rings')
 */
function normalizeCategory(category: string): string {
  const lower = category.toLowerCase().trim();
  if (lower.includes("ring")) return "rings";
  if (lower.includes("earring")) return "earrings";
  if (lower.includes("necklace")) return "necklaces";
  if (lower.includes("bracelet")) return "bracelets";
  if (lower.includes("charm") || lower.includes("bangle")) return "charms-bangles";
  if (lower.includes("gift")) return "gift-ideas";
  return lower;
}

/**
 * Compute deterministic recommendations based on current cart items.
 */
export function getRecommendedProducts(
  cartItems: CartItem[],
  options: RecommendationOptions = {}
): Product[] {
  const { limit = 4, catalogue = SHOP_PRODUCTS } = options;

  // 1. Build exclusion set from active cart item IDs
  const cartProductIds = new Set(cartItems.map((item) => item.product.id));

  // 2. Filter candidates: exclude cart items and out-of-stock items
  const eligibleCandidates = catalogue.filter(
    (product) => !cartProductIds.has(product.id) && product.inStock !== false
  );

  if (eligibleCandidates.length === 0) {
    return [];
  }

  // 3. Fallback for Empty Cart: Return top curated items from catalogue
  if (cartItems.length === 0) {
    // Return first `limit` items (curated default set)
    return eligibleCandidates.slice(0, limit);
  }

  // 4. Extract cart metadata for scoring
  const cartCategories = new Set<string>();
  const cartMaterials = new Set<string>();
  let totalCartPrice = 0;
  let totalCartQty = 0;

  for (const item of cartItems) {
    cartCategories.add(normalizeCategory(item.product.category));
    if (item.product.materials) {
      for (const mat of item.product.materials) {
        cartMaterials.add(mat.toLowerCase());
      }
    }
    totalCartPrice += item.product.priceInr * item.quantity;
    totalCartQty += item.quantity;
  }

  const avgCartPrice = totalCartQty > 0 ? totalCartPrice / totalCartQty : 30000;

  // 5. Gather all related categories from the cart categories
  const relatedCategories = new Set<string>();
  for (const cat of cartCategories) {
    const related = RELATED_CATEGORIES_MAP[cat] || [];
    for (const r of related) {
      if (!cartCategories.has(r)) {
        relatedCategories.add(r);
      }
    }
  }

  // 6. Score each candidate deterministically
  interface ScoredCandidate {
    product: Product;
    score: number;
    originalIndex: number;
  }

  const scored: ScoredCandidate[] = eligibleCandidates.map((product, index) => {
    let score = 0;
    const prodCat = normalizeCategory(product.category);

    // Priority 1 — Same category (+100)
    if (cartCategories.has(prodCat)) {
      score += 100;
    }
    // Priority 2 — Related category (+50)
    else if (relatedCategories.has(prodCat)) {
      score += 50;
    }

    // Priority 3 — Similar attributes
    // Material match (+20 per match)
    if (product.materials && cartMaterials.size > 0) {
      for (const mat of product.materials) {
        if (cartMaterials.has(mat.toLowerCase())) {
          score += 20;
        }
      }
    }

    // Price tier similarity (+10 if within ±35% of average cart price)
    if (avgCartPrice > 0) {
      const priceDiffRatio = Math.abs(product.priceInr - avgCartPrice) / avgCartPrice;
      if (priceDiffRatio <= 0.35) {
        score += 10;
      }
    }

    // Featured / Hot / New bonus (+5)
    if (product.isHot || product.isNew) {
      score += 5;
    }

    return { product, score, originalIndex: index };
  });

  // 7. Sort deterministically:
  // Higher score first; if tied, preserve stable catalogue order (originalIndex)
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });

  // 8. Return top `limit` unique products
  return scored.slice(0, limit).map((s) => s.product);
}
