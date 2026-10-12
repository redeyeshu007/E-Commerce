/**
 * Store Locator Banner Configuration — JAVIX JEWELLERY
 *
 * Configurable settings for the "Find Jewelry Shops Near You" horizontal banner.
 * Allows easy destination updates and content localization without code refactoring.
 */

export interface StoreLocatorBannerConfig {
  /**
   * Main banner heading text.
   * Default: "Find Jewelry Shops Near You"
   */
  heading: string;

  /**
   * Action button text.
   * Default: "Find Store"
   */
  buttonLabel: string;

  /**
   * Target URL or route destination.
   * Default: "/store-location"
   */
  buttonHref: string;

  /**
   * Whether the destination route is currently active / implemented in the frontend.
   * Currently pending backend / store location catalogue deployment.
   */
  isImplemented: boolean;

  /**
   * Background hex color for the banner container.
   * Soft pastel lavender-pink matching Alukas design system reference.
   * Default: "#F8E8F8"
   */
  backgroundColor: string;

  /**
   * Foreground text, icon, and button border hex color.
   * Dark charcoal matching JAVIX editorial palette.
   * Default: "#111111"
   */
  textColor: string;

  /**
   * Hover background color for the button.
   * Default: "#111111"
   */
  buttonHoverBgColor?: string;

  /**
   * Hover text color for the button.
   * Default: "#FFFFFF"
   */
  buttonHoverTextColor?: string;
}

/**
 * Approved default configuration for JAVIX JEWELLERY Store Locator Banner.
 */
export const defaultStoreLocatorConfig: StoreLocatorBannerConfig = {
  heading: "Find Jewelry Shops Near You",
  buttonLabel: "Find Store",
  buttonHref: "/store-location",
  isImplemented: false,
  backgroundColor: "#F8E8F8",
  textColor: "#111111",
  buttonHoverBgColor: "#111111",
  buttonHoverTextColor: "#FFFFFF",
};
