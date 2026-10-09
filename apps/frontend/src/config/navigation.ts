/**
 * Navigation & Header Configuration — JAVIX JEWELLERY
 *
 * Configuration-driven architecture allowing easy future integration
 * with backend content management systems or dynamic tenant configurations
 * without rebuilding the UI components.
 */

export interface AnnouncementConfig {
  /** The promotional announcement text */
  text: string;
  /** Background hex color code */
  backgroundColor: string;
  /** Foreground text hex color code */
  textColor: string;
  /** Whether the announcement can be dismissed by the user */
  dismissible: boolean;
}

export interface UtilityPromotionConfig {
  text: string;
  linkText?: string;
  href?: string;
}

export interface UtilityLinkItem {
  id: string;
  label: string;
  href?: string;
  isImplemented: boolean;
}

export interface UtilityConfig {
  language: string;
  currency: string;
  currencySymbol: string;
  promotion: UtilityPromotionConfig;
  links: UtilityLinkItem[];
}

export interface BrandConfig {
  name: string;
  href: string;
}

export interface PrimaryNavItem {
  id: string;
  label: string;
  href: string;
  /** Whether the route destination is currently implemented in the frontend */
  isImplemented: boolean;
}

export type ActionIconType = "search" | "account" | "wishlist" | "cart";

export interface ActionItem {
  id: ActionIconType;
  label: string;
  href?: string;
  /** Whether this action has a concrete route or modal implemented */
  isImplemented: boolean;
}

export interface NavigationConfig {
  announcement: AnnouncementConfig;
  utility: UtilityConfig;
  brand: BrandConfig;
  primaryNav: PrimaryNavItem[];
  actions: ActionItem[];
}

/**
 * Default JAVIX JEWELLERY navigation configuration.
 * Faithfully mirrors the reference proportions, typography, and items.
 */
export const defaultNavigationConfig: NavigationConfig = {
  announcement: {
    text: "SUMMER SALE, Get 40% Off for all products.",
    backgroundColor: "#FBC0CE",
    textColor: "#222222",
    dismissible: true,
  },
  utility: {
    language: "English",
    currency: "Rupees (INR)",
    currencySymbol: "₹",
    promotion: {
      text: "Summer Sale 15% off!",
      linkText: "Shop Now!",
      href: "/shop",
    },
    links: [
      {
        id: "store-location",
        label: "Store Location",
        href: "/store-location",
        isImplemented: false,
      },
      { id: "services", label: "Services", href: "/services", isImplemented: false },
      { id: "subscribe", label: "Subscribe", href: "#subscribe", isImplemented: false },
      { id: "gift-cards", label: "Gift Cards", href: "/gift-cards", isImplemented: false },
    ],
  },
  brand: {
    name: "JAVIX",
    href: "/",
  },
  primaryNav: [
    { id: "home", label: "Home", href: "/", isImplemented: true },
    { id: "shop", label: "Shop", href: "/shop", isImplemented: false },
    { id: "contact", label: "Contact", href: "/contact", isImplemented: false },
    { id: "new-arrivals", label: "New Arrivals", href: "/new-arrivals", isImplemented: false },
  ],
  actions: [
    { id: "search", label: "Search", isImplemented: false },
    { id: "account", label: "Account", href: "/account", isImplemented: false },
    { id: "wishlist", label: "Wishlist", href: "/wishlist", isImplemented: false },
    { id: "cart", label: "Cart", href: "/cart", isImplemented: false },
  ],
};
