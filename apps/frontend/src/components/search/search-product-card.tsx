"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { formatInr } from "@/lib/utils";
import { useStorefront } from "@/providers/storefront-provider";

export interface SearchProductCardProps {
  product: Product;
  onSelect?: () => void;
  className?: string;
}

export function SearchProductCard({
  product,
  onSelect,
  className = "",
}: SearchProductCardProps) {
  const { isWishlisted, toggleWishlist, addToCart } = useStorefront();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorite = isWishlisted(product.id);
  const isOutOfStock = product.inStock === false || product.isAvailable === false;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  return (
    <article
      data-testid={`search-product-card-${product.id}`}
      className={`group relative flex flex-col justify-between rounded-xl border border-[#EFECE6] bg-white p-2.5 sm:p-3 transition-all duration-300 hover:border-[#C5A572]/40 hover:shadow-md ${className}`}
    >
      {/* 1. Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#F8F6F2]">
        {/* Badges */}
        {product.isHot && (
          <span
            data-testid="badge-hot"
            className="absolute top-2 left-2 z-10 rounded-sm bg-[#D9383A] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white uppercase shadow-xs select-none"
          >
            HOT
          </span>
        )}
        {!product.isHot && product.isNew && (
          <span
            data-testid="badge-new"
            className="absolute top-2 left-2 z-10 rounded-sm bg-[#111111] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white uppercase shadow-xs select-none"
          >
            NEW
          </span>
        )}

        {/* Wishlist Heart Button (Top Right of Image) */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          data-testid={`search-wishlist-${product.id}`}
          className={`absolute top-2 right-2 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-xs transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
            isFavorite ? "text-[#C5A572]" : "text-[#555555] hover:text-[#111111]"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? "fill-[#C5A572] stroke-[#C5A572]" : "stroke-[1.6]"}`}
            aria-hidden="true"
          />
        </button>

        {/* Clickable Product Image */}
        <Link
          href={`/product/${product.slug}`}
          onClick={onSelect}
          className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label={product.name}
        >
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
      </div>

      {/* 2. Product Meta & Information */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between text-left">
        <div>
          {/* Category */}
          <span className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-[#888888] uppercase">
            {product.category}
          </span>

          {/* Title */}
          <h4 className="mt-0.5 line-clamp-1 text-xs sm:text-sm font-medium text-[#111111] transition-colors group-hover:text-[#C5A572]">
            <Link href={`/product/${product.slug}`} onClick={onSelect}>
              {product.name}
            </Link>
          </h4>

          {/* Pricing */}
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-[#111111]">
              {formatInr(product.priceInr)}
            </span>
            {product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr && (
              <span className="text-[10px] sm:text-xs text-[#999999] line-through">
                {formatInr(product.compareAtPriceInr)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Action Button (Add to Cart / Added) */}
        <div className="mt-2.5 pt-1">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-md bg-[#F0EFEA] py-1.5 text-[10px] sm:text-xs font-semibold tracking-wider text-[#999999] uppercase"
            >
              Out of Stock
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCartClick}
              disabled={justAdded}
              aria-label={justAdded ? `Added ${product.name} to cart` : `Add ${product.name} to cart`}
              data-testid={`search-add-to-cart-${product.id}`}
              className={`flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                justAdded
                  ? "bg-[#C5A572] text-white shadow-xs"
                  : "bg-[#111111] text-white hover:bg-[#C5A572]"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" aria-hidden="true" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[1.8]" aria-hidden="true" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
