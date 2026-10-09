"use client";

import React from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag } from "lucide-react";
import type { ActionItem } from "@/config/navigation";

export interface NavbarActionsProps {
  actions?: ActionItem[];
  onSearchClick?: () => void;
  onAccountClick?: () => void;
  onWishlistClick?: () => void;
  onCartClick?: () => void;
}

const ICON_STROKE_WIDTH = 1.4;
const ICON_CLASS_NAME = "h-5 w-5";

/**
 * 1. Search Action Button
 */
export function SearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      <Search className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
    </button>
  );
}

/**
 * 2. Account Action Button
 */
export function AccountButton({
  href,
  isImplemented = false,
  onClick,
}: {
  href?: string;
  isImplemented?: boolean;
  onClick?: () => void;
}) {
  if (isImplemented && href) {
    return (
      <Link
        href={href}
        aria-label="Account"
        className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        <User className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Account"
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      <User className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
    </button>
  );
}

/**
 * 3. Wishlist Action Button
 */
export function WishlistButton({
  href,
  isImplemented = false,
  onClick,
}: {
  href?: string;
  isImplemented?: boolean;
  onClick?: () => void;
}) {
  if (isImplemented && href) {
    return (
      <Link
        href={href}
        aria-label="Wishlist"
        className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        <Heart className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Wishlist"
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      <Heart className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
    </button>
  );
}

/**
 * 4. Cart Action Button
 */
export function CartButton({
  href,
  isImplemented = false,
  onClick,
}: {
  href?: string;
  isImplemented?: boolean;
  onClick?: () => void;
}) {
  if (isImplemented && href) {
    return (
      <Link
        href={href}
        aria-label="Cart"
        className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        <ShoppingBag
          className={ICON_CLASS_NAME}
          strokeWidth={ICON_STROKE_WIDTH}
          aria-hidden="true"
        />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cart"
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      <ShoppingBag className={ICON_CLASS_NAME} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
    </button>
  );
}

/**
 * Right Group: Action icons (Search, Account, Wishlist, Cart in exact order).
 *
 * Characteristics:
 * - Minimalist outline style with consistent stroke weights.
 * - Accessible labels for screen readers.
 * - Handles unimplemented actions gracefully without fake feedback or dummy toasts.
 */
export function NavbarActions({
  actions,
  onSearchClick,
  onAccountClick,
  onWishlistClick,
  onCartClick,
}: NavbarActionsProps) {
  const accountAction = actions?.find((a) => a.id === "account");
  const wishlistAction = actions?.find((a) => a.id === "wishlist");
  const cartAction = actions?.find((a) => a.id === "cart");

  return (
    <div
      className="flex items-center space-x-1 sm:space-x-2"
      role="group"
      aria-label="Customer actions"
    >
      <SearchButton onClick={onSearchClick} />
      <AccountButton
        href={accountAction?.href}
        isImplemented={accountAction?.isImplemented}
        onClick={onAccountClick}
      />
      <WishlistButton
        href={wishlistAction?.href}
        isImplemented={wishlistAction?.isImplemented}
        onClick={onWishlistClick}
      />
      <CartButton
        href={cartAction?.href}
        isImplemented={cartAction?.isImplemented}
        onClick={onCartClick}
      />
    </div>
  );
}
