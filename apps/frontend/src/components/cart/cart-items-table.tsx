"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { CartItem } from "@/providers/storefront-provider";
import { CartItemRow } from "./cart-item-row";

export interface CartItemsTableProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  className?: string;
}

/**
 * CartItemsTable Component — PERALAGAE
 *
 * Renders the full list of products in the customer's cart.
 * - Desktop: Classical fine jewellery tabular format.
 * - Mobile: Clean card list with touch-friendly controls.
 */
export function CartItemsTable({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  className = "",
}: CartItemsTableProps) {
  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Desktop Table View (lg+) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label="Shopping Cart Items">
          <thead>
            <tr className="border-b border-[#E5E5E5] text-xs font-semibold uppercase tracking-wider text-[#777777]">
              <th scope="col" className="py-3.5 pl-0 pr-4 font-semibold">
                Product
              </th>
              <th scope="col" className="py-3.5 px-4 text-center font-semibold">
                Price
              </th>
              <th scope="col" className="py-3.5 px-4 text-center font-semibold">
                Quantity
              </th>
              <th scope="col" className="py-3.5 px-4 text-right font-semibold">
                Subtotal
              </th>
              <th scope="col" className="py-3.5 pl-4 pr-0 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
                layout="table-row"
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (< lg) */}
      <div className="lg:hidden flex flex-col gap-3">
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
            layout="card"
          />
        ))}
      </div>

      {/* Bottom Table Utility Bar: Continue Shopping & Clear Shopping Cart */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#EBEBEB]">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#111111] hover:text-[#555555] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Continue Shopping</span>
        </Link>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#888888] hover:text-[#D9383A] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Shopping Bag</span>
          </button>
        )}
      </div>
    </div>
  );
}
