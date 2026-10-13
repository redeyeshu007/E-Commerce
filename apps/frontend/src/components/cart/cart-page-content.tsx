"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useStorefront } from "@/providers/storefront-provider";
import { validateCoupon, calculateDiscount, type Coupon } from "@/services/coupon-service";
import { CartHero } from "./cart-hero";
import { CartItemsTable } from "./cart-items-table";
import { CouponForm } from "./coupon-form";
import { CartTotals } from "./cart-totals";
import { CartEmptyState } from "./cart-empty-state";
import { CartRecommendations } from "./cart-recommendations";

/**
 * CartPageContent Component — PERALAGAE
 *
 * Primary orchestrator for the /cart route.
 * Manages cart state, coupon application, dynamic totals, and recommendations.
 */
export function CartPageContent() {
  const { cartItems, subtotalInr, updateQuantity, removeFromCart, clearCart } =
    useStorefront();

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Recalculate discount whenever subtotal or applied coupon changes
  const discountInr = useMemo(() => {
    return calculateDiscount(appliedCoupon, subtotalInr);
  }, [appliedCoupon, subtotalInr]);

  // Apply Coupon Handler
  const handleApplyCoupon = useCallback(
    (code: string) => {
      const result = validateCoupon(code, subtotalInr);
      if (result.isValid && result.coupon) {
        setAppliedCoupon(result.coupon);
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    },
    [subtotalInr]
  );

  // Remove Coupon Handler
  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const hasItems = cartItems.length > 0;

  return (
    <div className="w-full bg-white text-black min-h-[calc(100vh-200px)]">
      {/* Top Banner / Hero with Background Image & Breadcrumb */}
      <CartHero />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {hasItems ? (
          /* Active Cart: Two Columns on Desktop (lg+) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (Items Table + Coupon Form) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <CartItemsTable
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
              />

              <div className="pt-2">
                <CouponForm
                  appliedCoupon={appliedCoupon}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                />
              </div>
            </div>

            {/* Right Column (Cart Totals Panel) */}
            <div className="lg:col-span-4 sticky top-24">
              <CartTotals
                subtotalInr={subtotalInr}
                discountInr={discountInr}
                appliedCoupon={appliedCoupon}
              />
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <CartEmptyState />
        )}

        {/* “You May Be Interested In…” Section */}
        <CartRecommendations cartItems={cartItems} />
      </main>
    </div>
  );
}
