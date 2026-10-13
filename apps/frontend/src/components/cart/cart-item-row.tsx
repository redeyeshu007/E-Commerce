"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "@/providers/storefront-provider";
import { formatInr } from "@/lib/utils";

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  layout?: "table-row" | "card";
}

/**
 * CartItemRow Component — PERALAGAE
 *
 * Renders individual cart items with thumbnail, name, unit price,
 * accessible quantity selector, line subtotal, and remove button.
 *
 * Supports both desktop table-row and mobile card layouts.
 */
export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  layout = "table-row",
}: CartItemRowProps) {
  const { product, quantity } = item;
  const lineSubtotal = product.priceInr * quantity;

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(product.id, quantity + 1);
  };

  /* -------------------------------------------------------------------------
   * MOBILE CARD VIEW (< lg)
   * ------------------------------------------------------------------------- */
  if (layout === "card") {
    return (
      <div
        data-testid={`cart-item-card-${product.id}`}
        className="relative flex gap-4 p-4 border border-[#EBEBEB] bg-white transition-all hover:border-[#CCCCCC]"
      >
        {/* Remove Button (Top Right) */}
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${product.name} from cart`}
          className="absolute top-3 right-3 p-1.5 text-[#888888] hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Thumbnail */}
        <div className="relative h-24 w-24 flex-shrink-0 bg-[#F4F4F4] overflow-hidden">
          <Link href={`/product/${product.slug}`} aria-label={product.name}>
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              sizes="96px"
              className="object-cover"
            />
          </Link>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between pr-6">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#888888]">
              {product.category}
            </span>
            <h3 className="text-sm font-medium text-[#111111] leading-snug line-clamp-2 mt-0.5">
              <Link href={`/product/${product.slug}`} className="hover:underline">
                {product.name}
              </Link>
            </h3>
            <p className="text-xs text-[#555555] mt-1 font-medium">
              Unit: {formatInr(product.priceInr)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
            {/* Quantity Selector */}
            <div className="flex items-center border border-[#DDDDDD] bg-white">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                aria-label={`Decrease quantity of ${product.name}`}
                className="flex h-7 w-7 items-center justify-center text-[#555555] hover:text-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span
                data-testid={`quantity-${product.id}`}
                className="flex h-7 w-8 items-center justify-center text-xs font-medium text-[#111111]"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                aria-label={`Increase quantity of ${product.name}`}
                className="flex h-7 w-7 items-center justify-center text-[#555555] hover:text-black hover:bg-neutral-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <span className="text-xs font-semibold text-[#111111]">
                {formatInr(lineSubtotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------
   * DESKTOP TABLE ROW VIEW (lg+)
   * ------------------------------------------------------------------------- */
  return (
    <tr
      data-testid={`cart-item-row-${product.id}`}
      className="border-b border-[#EBEBEB] hover:bg-[#FAFAFA] transition-colors"
    >
      {/* 1. Product Thumbnail & Name */}
      <td className="py-4 pl-0 pr-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 bg-[#F4F4F4] overflow-hidden border border-[#EAEAEA]">
            <Link href={`/product/${product.slug}`} aria-label={product.name}>
              <Image
                src={product.image.src}
                alt={product.image.alt}
                fill
                sizes="80px"
                className="object-cover"
              />
            </Link>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#888888]">
              {product.category}
            </span>
            <Link
              href={`/product/${product.slug}`}
              className="text-sm font-medium text-[#111111] hover:underline transition-colors mt-0.5 line-clamp-2"
            >
              {product.name}
            </Link>
          </div>
        </div>
      </td>

      {/* 2. Unit Price */}
      <td className="py-4 px-4 text-sm text-[#444444] text-center whitespace-nowrap font-medium">
        {formatInr(product.priceInr)}
      </td>

      {/* 3. Quantity Controls */}
      <td className="py-4 px-4 text-center">
        <div className="inline-flex items-center border border-[#CCCCCC] bg-white">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={quantity <= 1}
            aria-label={`Decrease quantity of ${product.name}`}
            className="flex h-8 w-8 items-center justify-center text-[#555555] hover:text-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span
            data-testid={`quantity-${product.id}`}
            aria-label={`Quantity for ${product.name}`}
            className="flex h-8 w-10 items-center justify-center text-xs font-semibold text-[#111111] select-none"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            aria-label={`Increase quantity of ${product.name}`}
            className="flex h-8 w-8 items-center justify-center text-[#555555] hover:text-black hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* 4. Subtotal */}
      <td className="py-4 px-4 text-sm font-semibold text-[#111111] text-right whitespace-nowrap">
        {formatInr(lineSubtotal)}
      </td>

      {/* 5. Remove Action */}
      <td className="py-4 pl-4 pr-0 text-right">
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${product.name} from cart`}
          className="p-1.5 text-[#888888] hover:text-[#D9383A] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <X className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
