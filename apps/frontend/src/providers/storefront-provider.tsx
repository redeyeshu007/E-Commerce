"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import {
  CustomerAuthService,
  type Customer,
  type CustomerShippingProfile,
  type CustomerProfileDetails,
  type SaveProfileInput,
} from "@/services/customer-auth-service";
import type {
  NotificationType,
  NotificationItem,
  NotifyOptions,
  NotifyApi,
} from "@/components/ui/notification";
import { NotificationContainer } from "@/components/ui/notification";

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
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Quick View
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Global Luxury Notifications
  notify: NotifyApi;
  notifications: NotificationItem[];
  showNotification: (type: NotificationType, message: string, options?: NotifyOptions) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Toast / Feedback (Backwards Compatibility)
  toastMessage: string | null;
  dismissToast: () => void;

  // Customer Authentication & Profile
  customer: Customer | null;
  isAuthenticated: boolean;
  isCustomerAuthLoading: boolean;
  isProfileComplete: boolean;
  profile: CustomerShippingProfile | null;
  authReturnUrl: string | null;
  setAuthReturnUrl: (url: string | null) => void;
  loginCustomer: (data: { email: string; password: string }) => Promise<Customer>;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<Customer>;
  logoutCustomer: () => Promise<void>;
  updateProfile: (data: SaveProfileInput) => Promise<CustomerProfileDetails>;
  refreshCustomer: () => Promise<Customer | null>;

  // Authentication Modal
  isAuthModalOpen: boolean;
  authModalView: "login" | "register" | "forgot-password";
  openAuthModal: (view?: "login" | "register" | "forgot-password", returnUrl?: string) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: "login" | "register" | "forgot-password") => void;

  // Search Overlay
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Newsletter Modal
  isNewsletterOpen: boolean;
  openNewsletter: () => void;
  closeNewsletter: () => void;
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isCustomerAuthLoading, setIsCustomerAuthLoading] = useState(true);
  const [authReturnUrl, setAuthReturnUrl] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register" | "forgot-password">("login");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  // Global Luxury Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, message: string, options?: NotifyOptions): string => {
      const now = Date.now();
      const dedupKey = `${type}:${message}:${options?.description ?? ""}`;
      const lastFired = recentNotificationsRef.current.get(dedupKey) ?? 0;

      // Deduplicate identical notifications fired within 1500ms (avoids StrictMode double-triggers)
      if (now - lastFired < 1500) {
        return "";
      }
      recentNotificationsRef.current.set(dedupKey, now);

      // Periodic cleanup of deduplication map
      if (recentNotificationsRef.current.size > 50) {
        for (const [key, timestamp] of recentNotificationsRef.current.entries()) {
          if (now - timestamp > 10000) {
            recentNotificationsRef.current.delete(key);
          }
        }
      }

      const id = `notify-${now}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: NotificationItem = {
        id,
        type,
        message,
        description: options?.description,
        duration: options?.duration,
        action: options?.action,
        createdAt: now,
      };

      setNotifications((prev) => {
        // Maximum 3 visible popups stacked gracefully
        const next = [...prev, newItem];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });

      setToastMessage(message);

      return id;
    },
    []
  );

  const notify = useMemo<NotifyApi>(
    () => ({
      success: (msg, opts) => showNotification("success", msg, opts),
      error: (msg, opts) => showNotification("error", msg, opts),
      warning: (msg, opts) => showNotification("warning", msg, opts),
      info: (msg, opts) => showNotification("info", msg, opts),
      dismiss: dismissNotification,
      clear: clearNotifications,
    }),
    [showNotification, dismissNotification, clearNotifications]
  );

  const showToast = useCallback(
    (msg: string) => {
      showNotification("info", msg);
    },
    [showNotification]
  );

  const dismissToast = useCallback(() => {
    clearNotifications();
    setToastMessage(null);
  }, [clearNotifications]);

  // Verify server session and restore cached customer on mount
  useEffect(() => {
    let isMounted = true;

    // Restore cached customer on client mount for seamless UX without SSR mismatch
    try {
      const cached = CustomerAuthService.getStoredCustomer();
      if (cached && isMounted) {
        setCustomer(cached);
      }
    } catch {
      // Ignore
    }

    CustomerAuthService.getMe()
      .then((verifiedCustomer) => {
        if (isMounted) {
          setCustomer(verifiedCustomer);
          setIsCustomerAuthLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsCustomerAuthLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Support opening login modal when ?auth=login or ?auth=admin is present in the URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get("auth");
      if (authParam === "login" || authParam === "admin") {
        setAuthModalView("login");
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  const router = useRouter();

  const isProfileComplete = Boolean(customer?.isProfileComplete);
  const profile = customer?.profile ?? null;

  const refreshCustomer = useCallback(async () => {
    try {
      const me = await CustomerAuthService.getMe();
      setCustomer(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const updateProfile = useCallback(
    async (data: SaveProfileInput) => {
      const updated = await CustomerAuthService.saveProfile(data);
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              isProfileComplete: updated.isProfileComplete,
              profile: updated.profile,
            }
          : null
      );
      notify.success("Profile saved successfully!", {
        description: "Your profile details and shipping address have been saved.",
      });
      return updated;
    },
    [notify]
  );

  // Mandatory Profile Completion Guard & Google Auth Detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get("authSuccess");

    if (authSuccess === "google") {
      CustomerAuthService.getMe().then((verified) => {
        if (verified) {
          setCustomer(verified);
          if (!verified.isProfileComplete) {
            router.push("/profile/setup");
          } else {
            const url = new URL(window.location.href);
            url.searchParams.delete("authSuccess");
            window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
          }
        }
      });
    }
  }, [router]);

  // Route Guard: Incomplete authenticated customer cannot access storefront until profile is complete
  useEffect(() => {
    if (isCustomerAuthLoading || !customer) return;

    if (!customer.isProfileComplete) {
      const current = typeof window !== "undefined" ? window.location.pathname : "/";
      if (!current.startsWith("/profile/setup") && !current.startsWith("/auth/callback")) {
        const returnTarget = current !== "/" ? `?returnUrl=${encodeURIComponent(current)}` : "";
        router.push(`/profile/setup${returnTarget}`);
      }
    }
  }, [customer, isCustomerAuthLoading, router]);

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

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (wishlistIds.includes(product.id)) {
        const next = wishlistIds.filter((id) => id !== product.id);
        saveWishlist(next);
        notify.info("Removed from wishlist.", {
          description: `"${product.name}" was removed from your wishlist.`,
        });
      } else {
        const next = [...wishlistIds, product.id];
        saveWishlist(next);
        notify.success("Added to wishlist.", {
          description: `"${product.name}" has been saved to your wishlist.`,
        });
      }
    },
    [wishlistIds, saveWishlist, notify],
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (
        product.inStock === false ||
        product.isAvailable === false ||
        (product.stockCount !== undefined && product.stockCount <= 0)
      ) {
        notify.warning("Out of Stock", {
          description: `Sorry, "${product.name}" is currently out of stock.`,
        });
        return;
      }

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
      notify.success("Added to cart successfully.", {
        description: `"${product.name}" has been added to your shopping bag.`,
      });
    },
    [cartItems, saveCart, notify],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const safeQty = Math.max(1, quantity);
      const targetItem = cartItems.find((item) => item.product.id === productId);
      const next = cartItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: safeQty } : item
      );
      saveCart(next);
      notify.success("Cart updated.", {
        description: targetItem ? `Updated quantity for "${targetItem.product.name}".` : undefined,
      });
    },
    [cartItems, saveCart, notify]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const targetItem = cartItems.find((item) => item.product.id === productId);
      const next = cartItems.filter((item) => item.product.id !== productId);
      saveCart(next);
      notify.info("Item removed from cart.", {
        description: targetItem ? `"${targetItem.product.name}" was removed from your bag.` : undefined,
      });
    },
    [cartItems, saveCart, notify],
  );

  const clearCart = useCallback(() => {
    saveCart([]);
    notify.info("Cart cleared.", {
      description: "All items have been removed from your shopping bag.",
    });
  }, [saveCart, notify]);

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

  const openAuthModal = useCallback(
    (view: "login" | "register" | "forgot-password" = "login", returnUrl?: string) => {
      setAuthModalView(view);
      if (returnUrl !== undefined) {
        setAuthReturnUrl(returnUrl);
      }
      setIsAuthModalOpen(true);
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const loginCustomer = useCallback(
    async (credentials: { email: string; password: string }) => {
      const loggedIn = await CustomerAuthService.login(credentials);
      setCustomer(loggedIn);
      notify.success("Signed in successfully", {
        description: `Welcome back, ${loggedIn.fullName}!`,
      });
      return loggedIn;
    },
    [notify],
  );

  const registerCustomer = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword?: string;
    }) => {
      const newCustomer = await CustomerAuthService.register(data);
      setCustomer(newCustomer);
      notify.success("Account created successfully", {
        description: `Welcome to PERALAGAE, ${newCustomer.fullName}!`,
      });
      return newCustomer;
    },
    [notify],
  );

  const logoutCustomer = useCallback(async () => {
    try {
      await CustomerAuthService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setCustomer(null);
      notify.info("Signed out", {
        description: "You have been signed out of your account.",
      });
    }
  }, [notify]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const openNewsletter = useCallback(() => {
    setIsNewsletterOpen(true);
  }, []);

  const closeNewsletter = useCallback(() => {
    setIsNewsletterOpen(false);
  }, []);

  const isAuthenticated = Boolean(customer);

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
      updateQuantity,
      removeFromCart,
      clearCart,
      quickViewProduct,
      openQuickView,
      closeQuickView,
      notify,
      notifications,
      showNotification,
      dismissNotification,
      clearNotifications,
      toastMessage,
      dismissToast,
      customer,
      isAuthenticated,
      isCustomerAuthLoading,
      isProfileComplete,
      profile,
      authReturnUrl,
      setAuthReturnUrl,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
      updateProfile,
      refreshCustomer,
      isAuthModalOpen,
      authModalView,
      openAuthModal,
      closeAuthModal,
      setAuthModalView,
      isSearchOpen,
      openSearch,
      closeSearch,
      isNewsletterOpen,
      openNewsletter,
      closeNewsletter,
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
      updateQuantity,
      removeFromCart,
      clearCart,
      quickViewProduct,
      openQuickView,
      closeQuickView,
      notify,
      notifications,
      showNotification,
      dismissNotification,
      clearNotifications,
      toastMessage,
      dismissToast,
      customer,
      isAuthenticated,
      isCustomerAuthLoading,
      isProfileComplete,
      profile,
      authReturnUrl,
      setAuthReturnUrl,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
      updateProfile,
      refreshCustomer,
      isAuthModalOpen,
      authModalView,
      openAuthModal,
      closeAuthModal,
      setAuthModalView,
      isSearchOpen,
      openSearch,
      closeSearch,
      isNewsletterOpen,
      openNewsletter,
      closeNewsletter,
    ],
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </StorefrontContext.Provider>
  );
}

const defaultNotify: NotifyApi = {
  success: () => "",
  error: () => "",
  warning: () => "",
  info: () => "",
  dismiss: () => {},
  clear: () => {},
};

const defaultStorefrontValue: StorefrontContextValue = {
  wishlistIds: [],
  wishlistCount: 0,
  isWishlisted: () => false,
  toggleWishlist: () => {},
  cartItems: [],
  cartCount: 0,
  subtotalInr: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  quickViewProduct: null,
  openQuickView: () => {},
  closeQuickView: () => {},
  notify: defaultNotify,
  notifications: [],
  showNotification: () => "",
  dismissNotification: () => {},
  clearNotifications: () => {},
  toastMessage: null,
  dismissToast: () => {},
  customer: null,
  isAuthenticated: false,
  isCustomerAuthLoading: false,
  isProfileComplete: false,
  profile: null,
  authReturnUrl: null,
  setAuthReturnUrl: () => {},
  loginCustomer: async () => {
    throw new Error("StorefrontProvider not mounted");
  },
  registerCustomer: async () => {
    throw new Error("StorefrontProvider not mounted");
  },
  logoutCustomer: async () => {},
  updateProfile: async () => {
    throw new Error("StorefrontProvider not mounted");
  },
  refreshCustomer: async () => null,
  isAuthModalOpen: false,
  authModalView: "login",
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setAuthModalView: () => {},
  isSearchOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  isNewsletterOpen: false,
  openNewsletter: () => {},
  closeNewsletter: () => {},
};

export function useStorefront(): StorefrontContextValue {
  const context = useContext(StorefrontContext);
  return context ?? defaultStorefrontValue;
}

export function useNotification(): NotifyApi {
  const { notify } = useStorefront();
  return notify;
}


