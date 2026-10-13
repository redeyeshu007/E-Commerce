"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { Product } from "@/types/product";

export interface ProductBreadcrumbProps {
  product: Product;
  prevProduct?: Product | null;
  nextProduct?: Product | null;
}

/**
 * Format category identifier for query string matching in Shop page.
 */
function getCategoryQuery(category: string): string {
  const lower = category.toLowerCase().trim();
  if (lower.includes("necklace")) return "necklaces";
  if (lower.includes("ring")) return "rings";
  if (lower.includes("bracelet")) return "bracelets";
  if (lower.includes("earring")) return "earrings";
  if (lower.includes("charm") || lower.includes("bangle")) return "charms-bangles";
  if (lower.includes("gift")) return "gift-ideas";
  return "all";
}

/**
 * Format category display name in title case.
 */
function formatCategoryLabel(category: string): string {
  const cat = category.toUpperCase().trim();
  if (cat === "NECKLACES") return "Necklaces";
  if (cat === "RINGS") return "Rings";
  if (cat === "BRACELETS") return "Bracelets";
  if (cat === "EARRINGS") return "Earrings";
  if (cat === "CHARMS & BANGLES") return "Charms & Bangles";
  if (cat === "GIFT IDEAS") return "Gift Ideas";
  return category;
}

export function ProductBreadcrumb({
  product,
  prevProduct,
  nextProduct,
}: ProductBreadcrumbProps) {
  const catQuery = getCategoryQuery(product.category);
  const catLabel = formatCategoryLabel(product.category);

  return (
    <nav
      aria-label="Product breadcrumb navigation"
      className="w-full bg-white pt-5 pb-4 sm:pt-6 sm:pb-5 pdp-typography font-jost"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Breadcrumb trail matching reference (Home > Shop > Category > Product Name) */}
        <ol className="flex items-center gap-2 text-xs sm:text-[13px] text-[#777777] overflow-hidden whitespace-nowrap">
          <li className="flex items-center">
            <Link
              href="/"
              className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              Home
            </Link>
          </li>

          <li className="flex items-center text-[#999999] select-none text-[11px]" aria-hidden="true">
            &gt;
          </li>

          <li className="flex items-center">
            <Link
              href="/shop"
              className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              Shop
            </Link>
          </li>

          <li className="flex items-center text-[#999999] select-none text-[11px]" aria-hidden="true">
            &gt;
          </li>

          <li className="flex items-center">
            <Link
              href={`/shop?category=${catQuery}`}
              className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              {catLabel}
            </Link>
          </li>

          <li className="flex items-center text-[#999999] select-none text-[11px]" aria-hidden="true">
            &gt;
          </li>

          <li
            className="truncate text-[#111111] font-normal max-w-[160px] sm:max-w-[320px] md:max-w-none"
            aria-current="page"
            title={product.name}
          >
            {product.name}
          </li>
        </ol>

        {/* Right: Minimal Prev / Next Navigation Arrows (< >) matching screenshot */}
        {(prevProduct || nextProduct) && (
          <div className="flex items-center gap-3 pl-3 text-[#555555]">
            {prevProduct && (
              <Link
                href={`/product/${prevProduct.slug}`}
                aria-label={`Previous product: ${prevProduct.name}`}
                title={`Previous: ${prevProduct.name}`}
                className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              >
                <ChevronLeft className="h-4 w-4 stroke-[1.6]" />
              </Link>
            )}

            {nextProduct && (
              <Link
                href={`/product/${nextProduct.slug}`}
                aria-label={`Next product: ${nextProduct.name}`}
                title={`Next: ${nextProduct.name}`}
                className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              >
                <ChevronRight className="h-4 w-4 stroke-[1.6]" />
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
