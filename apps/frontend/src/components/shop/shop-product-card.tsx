"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { formatInr } from "@/lib/utils";
import { useStorefront } from "@/providers/storefront-provider";

export interface ShopProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  className?: string;
}

/**
 * ShopProductCard Component — PERALAGAE
 *
 * Supports two distinct presentation modes:
 * 1. "grid" mode: Classic square luxury catalogue card with slide-up Add to Cart and Wishlist heart.
 * 2. "list" mode: Wide horizontal layout showing expanded product description, materials, sizes, and direct action buttons.
 */
export function ShopProductCard({
  product,
  viewMode = "grid",
  className = "",
}: ShopProductCardProps) {
  const { isWishlisted, toggleWishlist, addToCart } = useStorefront();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorite = isWishlisted(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  /* -------------------------------------------------------------------------
   * LIST VIEW PRESENTATION (1 Item per row)
   * ------------------------------------------------------------------------- */
  if (viewMode === "list") {
    return (
      <article
        data-testid={`product-card-${product.id}`}
        className={`group relative flex flex-col sm:flex-row items-stretch border border-[#EBEBEB] bg-white transition-all duration-300 hover:shadow-md ${className}`}
      >
        {/* Left: Product Thumbnail Container */}
        <div className="relative aspect-square w-full sm:w-56 md:w-64 flex-none overflow-hidden bg-[#F2F2F2]">
          {product.isHot && (
            <span
              data-testid="badge-hot"
              className="absolute top-3 left-3 z-10 bg-[#D9383A] text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase shadow-sm select-none"
            >
              HOT
            </span>
          )}
          {!product.isHot && product.isNew && (
            <span
              data-testid="badge-new"
              className="absolute top-3 left-3 z-10 bg-[#111111] text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase shadow-sm select-none"
            >
              NEW
            </span>
          )}

          <Link
            href={`/product/${product.slug}`}
            className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            aria-label={product.name}
          >
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Right: Product Details & Action Buttons */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-6 text-left">
          <div>
            {/* Category */}
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.08em] text-[#777777]">
              {product.category}
            </span>

            {/* Product Title */}
            <h3 className="mt-1 text-sm sm:text-base lg:text-lg font-medium text-[#111111] leading-snug">
              <Link
                href={`/product/${product.slug}`}
                className="hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              >
                {product.name}
              </Link>
            </h3>

            {/* Price in INR */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm sm:text-base font-semibold text-[#111111]">
                {formatInr(product.priceInr)}
              </span>
              {product.compareAtPriceInr && (
                <span className="text-xs sm:text-sm text-[#888888] line-through font-normal">
                  {formatInr(product.compareAtPriceInr)}
                </span>
              )}
            </div>

            {/* Description (List view exclusive) */}
            {product.description && (
              <p className="mt-2.5 text-xs sm:text-sm text-[#666666] leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Metadata (Materials & Sizes) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#777777]">
              {product.material && (
                <span className="bg-neutral-100 px-2 py-0.5 rounded-none">
                  {product.material}
                </span>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <span className="bg-neutral-100 px-2 py-0.5 rounded-none">
                  Sizes: {product.sizes.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 flex items-center gap-3 pt-3 border-t border-[#F0F0F0]">
            <button
              type="button"
              onClick={handleAddToCartClick}
              aria-label={`Add ${product.name} to cart`}
              suppressHydrationWarning
              className={`py-2 sm:py-2.5 px-4 sm:px-6 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                justAdded
                  ? "bg-[#111111] text-white"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              aria-pressed={isFavorite}
              suppressHydrationWarning
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                isFavorite
                  ? "border-[#D9383A] text-[#D9383A]"
                  : "border-[#D0D0D0] text-[#444444] hover:text-[#D9383A] hover:border-[#D9383A]"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? "fill-[#D9383A]" : ""}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </article>
    );
  }

  /* -------------------------------------------------------------------------
   * GRID VIEW PRESENTATION (2, 3, or 4 Column Grids)
   * ------------------------------------------------------------------------- */
  return (
    <article
      data-testid={`product-card-${product.id}`}
      className={`group relative flex flex-col w-full text-left bg-white transition-all duration-300 ${className}`}
    >
      {/* 1. Square Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F2F2F2]">
        {/* Product Badge */}
        {product.isHot && (
          <span
            data-testid="badge-hot"
            className="absolute top-3 left-3 z-10 bg-[#D9383A] text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase shadow-sm select-none"
          >
            HOT
          </span>
        )}
        {!product.isHot && product.isNew && (
          <span
            data-testid="badge-new"
            className="absolute top-3 left-3 z-10 bg-[#111111] text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase shadow-sm select-none"
          >
            NEW
          </span>
        )}

        {/* Product Image */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label={product.name}
        >
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Wishlist Action Button on Upper Right */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 flex flex-col gap-1.5 sm:gap-2 opacity-0 sm:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isFavorite}
            suppressHydrationWarning
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white shadow-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              isFavorite ? "text-[#D9383A]" : "text-[#222222] hover:text-[#D9383A]"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? "fill-[#D9383A]" : ""}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Slide-Up Add to Cart Bar */}
        <div className="absolute bottom-0 inset-x-0 z-20 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={handleAddToCartClick}
            aria-label={`Add ${product.name} to cart`}
            suppressHydrationWarning
            className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold tracking-[0.08em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              justAdded
                ? "bg-[#111111] text-white"
                : "bg-white/95 text-[#111111] hover:bg-[#111111] hover:text-white border-t border-[#E5E7EB]"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                <span>Added to Bag</span>
              </>
            ) : (
              <span>Add to Cart</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Text Details Underneath Image */}
      <div className="flex flex-col pt-2.5 sm:pt-3 pb-1 text-center items-center">
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.08em] text-[#777777] mb-1">
          {product.category}
        </span>

        <h3 className="text-xs sm:text-[13.5px] font-normal text-[#111111] leading-snug line-clamp-1 truncate mb-1 max-w-full px-1">
          <Link
            href={`/product/${product.slug}`}
            className="hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5">
          <span className="text-xs sm:text-sm font-semibold text-[#111111]">
            {formatInr(product.priceInr)}
          </span>
          {product.compareAtPriceInr && (
            <span className="text-[11px] sm:text-xs text-[#888888] line-through font-normal">
              {formatInr(product.compareAtPriceInr)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
