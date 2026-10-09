import { test, expect } from "@playwright/test";

test.describe("JAVIX Premium Navbar E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the custom luxury preloader to finish and unmount cleanly
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 6000 });
  });

  test("renders the three-row header with announcement, utility, and main navbar on desktop", async ({
    page,
  }) => {
    const header = page.locator("header[role='banner']");
    await expect(header).toBeVisible();

    // Row 1: Announcement Bar
    const announcement = page.locator("aside[aria-label='Promotional Announcement']");
    await expect(announcement).toBeVisible();
    await expect(announcement).toContainText("SUMMER SALE, Get 40% Off for all products.");

    // Row 2: Utility Bar
    const utility = page.locator("div[role='region'][aria-label*='Utility navigation']");
    await expect(utility).toBeVisible();
    await expect(utility).toContainText("English");
    await expect(utility).toContainText("₹");
    await expect(utility).toContainText("Rupees (INR)");
    await expect(utility).not.toContainText("$");

    // Row 3: Main Navbar Brand
    const brand = page.locator("a[aria-label*='JAVIX Fine Jewellery']");
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText("JAVIX");

    // Desktop Primary Nav items
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByText("Shop", { exact: true })).toBeVisible();
    await expect(page.getByText("Contact", { exact: true })).toBeVisible();
    await expect(page.getByText("New Arrivals", { exact: true })).toBeVisible();

    // Action buttons visible on desktop
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Wishlist" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cart" }).first()).toBeVisible();
  });

  test("dismisses announcement bar upon clicking close button", async ({ page }) => {
    const announcement = page.locator("aside[aria-label='Promotional Announcement']");
    await expect(announcement).toBeVisible();

    const closeBtn = page.getByRole("button", { name: "Close announcement bar" });
    await closeBtn.click();

    await expect(announcement).not.toBeAttached();
  });

  test("renders mobile view matching reference: top bar (Menu | JAVIX | Cart) and sticky bottom bar", async ({
    page,
  }) => {
    // Set viewport to mobile screen (iPhone / Android)
    await page.setViewportSize({ width: 375, height: 667 });

    // 0. Top announcement bar wraps cleanly and utility bar (English & INR) is hidden on mobile
    const utility = page.locator("div[role='region'][aria-label*='Utility navigation']");
    await expect(utility).toBeHidden();

    const announcement = page.locator("aside[aria-label='Promotional Announcement']");
    await expect(announcement).toBeVisible();
    await expect(announcement).toContainText("SUMMER SALE,");
    await expect(announcement).toContainText("Get 40% Off for all products.");

    // 1. Mobile Top Header:
    // Left: Hamburger menu button
    const hamburgerBtn = page.getByRole("button", { name: "Open navigation menu" });
    await expect(hamburgerBtn).toBeVisible();

    // Center: JAVIX brand
    const brand = page.locator("a[aria-label*='JAVIX Fine Jewellery']");
    await expect(brand).toBeVisible();

    // Right: Cart icon with "0" badge
    const cartBadge = page.getByTestId("cart-badge").filter({ visible: true });
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText("0");

    // 2. Mobile Sticky Bottom Navigation Bar:
    const bottomNav = page.locator("nav[aria-label='Mobile Bottom Navigation']");
    await expect(bottomNav).toBeVisible();

    // Contains HOME, SEARCH, WISHLIST, ACCOUNT
    await expect(bottomNav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Wishlist" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Account" })).toBeVisible();

    // Wishlist has "0" count badge
    const wishlistBadge = page.getByTestId("mobile-wishlist-badge");
    await expect(wishlistBadge).toBeVisible();
    await expect(wishlistBadge).toHaveText("0");

    // 3. Drawer toggle and keyboard escape dismissal
    await hamburgerBtn.click();
    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("JAVIX");

    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeAttached();
  });
});
