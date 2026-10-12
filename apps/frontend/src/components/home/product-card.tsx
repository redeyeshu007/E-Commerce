"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Check } from "lucide-react";
import type { Product } from "@/types/product";
import { formatInr } from "@/lib/utils";
import { useStorefront } from "@/providers/storefront-provider";

export interface ProductCardProps {
  product: Product;
  className?: string;
  onQuickView?: (product: Product) => void;
}

/**
 * ProductCard Component — JAVIX JEWELLERY
 *
 * Implements the luxury jewellery catalogue card matching the reference:
 * - Square image container on uniform light-grey studio background (#F2F2F2)
 * - Upper-left product badge (HOT / NEW)
 * - Upper-right vertical stack action buttons (Wishlist & Quick View)
 * - Slide-up Add to Cart action button on hover
 * - Category label, product name, and formatted Indian Rupee (INR) price
 */
export function ProductCard({ product, className = "", onQuickView }: ProductCardProps) {
  const { isWishlisted, toggleWishlist, addToCart, openQuickView } = useStorefront();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorite = isWishlisted(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      openQuickView(product);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className={`group relative flex flex-col w-full text-left bg-white transition-all duration-300 ${className}`}
    >
      {/* 1. Square Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F2F2F2]">
        {/* Product Badge (HOT or NEW) */}
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

        {/* Action Controls: Vertically stacked circular white buttons on upper-right */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isFavorite}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              isFavorite ? "text-[#D9383A]" : "text-[#222222] hover:text-[#D9383A]"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-[#D9383A]" : ""}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {/* Quick View Button */}
          <button
            type="button"
            onClick={handleQuickViewClick}
            aria-label={`Quick view ${product.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#222222] shadow-md transition-colors duration-200 hover:text-black hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Slide-Up Add to Cart Bar */}
        <div className="absolute bottom-0 inset-x-0 z-20 translate-y-0 sm:translate-y-full sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={handleAddToCartClick}
            aria-label={`Add ${product.name} to cart`}
            className={`w-full py-2.5 px-4 text-xs font-semibold tracking-[0.08em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
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
      <div className="flex flex-col pt-3 pb-1 text-left">
        {/* Category Label */}
        <span className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.08em] text-[#777777] mb-1">
          {product.category}
        </span>

        {/* Product Name */}
        <h3 className="text-xs sm:text-[13.5px] font-normal text-[#111111] leading-snug line-clamp-1 mb-1">
          <Link
            href={`/product/${product.slug}`}
            className="hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            {product.name}
          </Link>
        </h3>

        {/* Indian Rupee Price */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs sm:text-sm font-semibold text-[#111111]">
            {formatInr(product.priceInr)}
          </span>
          {product.compareAtPriceInr && (
            <span className="text-xs text-[#888888] line-through font-normal">
              {formatInr(product.compareAtPriceInr)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
