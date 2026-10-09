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

export interface BadgesConfig {
  cartCount: number;
  wishlistCount: number;
}

export interface CategoryItem {
  id: string;
  label: string;
  href: string;
}

export interface NavigationConfig {
  announcement: AnnouncementConfig;
  utility: UtilityConfig;
  brand: BrandConfig;
  primaryNav: PrimaryNavItem[];
  categories?: CategoryItem[];
  actions: ActionItem[];
  badges: BadgesConfig;
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
  categories: [
    { id: "new-products", label: "New Products", href: "/shop?filter=new" },
    { id: "today-on-sale", label: "Today On Sale", href: "/shop?filter=sale" },
    { id: "special-offer", label: "Special Offer!", href: "/shop?filter=special" },
    { id: "necklaces", label: "Necklaces", href: "/category/necklaces" },
    { id: "rings", label: "Rings", href: "/category/rings" },
    { id: "bracelets", label: "Bracelets", href: "/category/bracelets" },
    { id: "earrings", label: "Earnings", href: "/category/earrings" },
    { id: "charm-dangles", label: "Charm & Dangles", href: "/category/charms" },
    { id: "watches", label: "Watches", href: "/category/watches" },
    { id: "gift-ideas", label: "Gift Ideas", href: "/category/gifts" },
  ],
  actions: [
    { id: "search", label: "Search", isImplemented: false },
    { id: "account", label: "Account", href: "/account", isImplemented: false },
    { id: "wishlist", label: "Wishlist", href: "/wishlist", isImplemented: false },
    { id: "cart", label: "Cart", href: "/cart", isImplemented: false },
  ],
  badges: {
    cartCount: 0,
    wishlistCount: 0,
  },
};
