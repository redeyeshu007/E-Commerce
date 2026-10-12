"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { Product } from "@/types/product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface StorefrontContextValue {
  // Wishlist
  wishlistIds: string[];
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;

  // Cart
  cartItems: CartItem[];
  cartCount: number;
  subtotalInr: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Quick View
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Toast / Feedback
  toastMessage: string | null;
  dismissToast: () => void;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

const STORAGE_KEY_WISHLIST = "peralagae_wishlist_ids";
const STORAGE_KEY_CART = "peralagae_cart_items";
const LEGACY_STORAGE_KEY_WISHLIST = "javix_wishlist_ids";
const LEGACY_STORAGE_KEY_CART = "javix_cart_items";

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore client-side state from localStorage on mount
  useEffect(() => {
    try {
      const storedWishlist =
        localStorage.getItem(STORAGE_KEY_WISHLIST) ??
        localStorage.getItem(LEGACY_STORAGE_KEY_WISHLIST);
      if (storedWishlist) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlistIds(JSON.parse(storedWishlist));
      }
      const storedCart =
        localStorage.getItem(STORAGE_KEY_CART) ??
        localStorage.getItem(LEGACY_STORAGE_KEY_CART);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch {
      // Ignore localStorage serialization errors in private browsing
    }
  }, []);

  // Save wishlist changes to localStorage
  const saveWishlist = useCallback((ids: string[]) => {
    setWishlistIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(ids));
    } catch {
      // Ignore
    }
  }, []);

  // Save cart changes to localStorage
  const saveCart = useCallback((items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (wishlistIds.includes(product.id)) {
        const next = wishlistIds.filter((id) => id !== product.id);
        saveWishlist(next);
        showToast(`Removed from wishlist: ${product.name}`);
      } else {
        const next = [...wishlistIds, product.id];
        saveWishlist(next);
        showToast(`Added to wishlist: ${product.name}`);
      }
    },
    [wishlistIds, saveWishlist, showToast],
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);
      let next: CartItem[];
      if (existingIndex > -1) {
        next = [...cartItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
      } else {
        next = [...cartItems, { id: `cart-${product.id}`, product, quantity }];
      }
      saveCart(next);
      showToast(`Added to bag: ${product.name}`);
    },
    [cartItems, saveCart, showToast],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const next = cartItems.filter((item) => item.product.id !== productId);
      saveCart(next);
    },
    [cartItems, saveCart],
  );

  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const wishlistCount = wishlistIds.length;

  const subtotalInr = useMemo(
    () => cartItems.reduce((total, item) => total + item.product.priceInr * item.quantity, 0),
    [cartItems],
  );

  const value = useMemo<StorefrontContextValue>(
    () => ({
      wishlistIds,
      wishlistCount,
      isWishlisted,
      toggleWishlist,
      cartItems,
      cartCount,
      subtotalInr,
      addToCart,
      removeFromCart,
      clearCart,
      quickViewProduct,
      openQuickView,
      closeQuickView,
      toastMessage,
      dismissToast,
    }),
    [
      wishlistIds,
      wishlistCount,
      isWishlisted,
      toggleWishlist,
      cartItems,
      cartCount,
      subtotalInr,
      addToCart,
      removeFromCart,
      clearCart,
      quickViewProduct,
      openQuickView,
      closeQuickView,
      toastMessage,
      dismissToast,
    ],
  );

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

const defaultStorefrontValue: StorefrontContextValue = {
  wishlistIds: [],
  wishlistCount: 0,
  isWishlisted: () => false,
  toggleWishlist: () => {},
  cartItems: [],
  cartCount: 0,
  subtotalInr: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  quickViewProduct: null,
  openQuickView: () => {},
  closeQuickView: () => {},
  toastMessage: null,
  dismissToast: () => {},
};

export function useStorefront(): StorefrontContextValue {
  const context = useContext(StorefrontContext);
  return context ?? defaultStorefrontValue;
}

