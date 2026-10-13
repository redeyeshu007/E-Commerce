import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Premium Navbar E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the custom luxury preloader to finish and unmount cleanly
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });
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
    await expect(utility).toContainText("+91 98765 43210");
    await expect(utility).toContainText("Summer Sale 15% off!");

    // Utility links in exact order: Find a Store, FAQs, Subscribe
    const utilityLinks = utility.locator("ul[role='list'] li");
    await expect(utilityLinks).toHaveCount(3);
    await expect(utilityLinks.nth(0)).toHaveText("Find a Store");
    await expect(utilityLinks.nth(1)).toHaveText("FAQs");
    await expect(utilityLinks.nth(2)).toHaveText("Subscribe");

    // Valid destinations for Find a Store and Subscribe
    await expect(utility.getByRole("link", { name: "Find a Store" })).toHaveAttribute(
      "href",
      "/#store-locator"
    );
    await expect(utility.getByRole("link", { name: "Subscribe" })).toHaveAttribute(
      "href",
      "/#newsletter-section"
    );
    // FAQs is static navigation (not a link)
    await expect(utility.getByRole("link", { name: "FAQs" })).toHaveCount(0);
    await expect(utility.getByText("FAQs")).toBeVisible();

    // Row 3: Main Navbar Brand
    const brand = page.locator("a[aria-label*='PERALAGAE Fine Jewellery']");
    await expect(brand).toBeVisible();
    await expect(brand.locator("img")).toBeVisible();
    await expect(brand).toHaveText("PERALAGAE");

    // Desktop Primary Nav items
    await expect(header.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(header.getByText("Shop", { exact: true })).toBeVisible();
    await expect(header.getByText("Contact", { exact: true })).toBeVisible();
    await expect(header.getByText("New Arrivals", { exact: true })).toBeVisible();

    // Action buttons / links visible on desktop
    await expect(header.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Account" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Wishlist", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "Cart" }).first()).toBeVisible();
  });

  test("dismisses announcement bar upon clicking close button", async ({ page }) => {
    const announcement = page.locator("aside[aria-label='Promotional Announcement']");
    await expect(announcement).toBeVisible();

    const closeBtn = page.getByRole("button", { name: "Close announcement bar" });
    await closeBtn.click();

    await expect(announcement).not.toBeAttached();
  });

  test("renders mobile view matching reference: top bar (Menu | PERALAGAE | Cart) and sticky bottom bar", async ({
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

    // Center: PERALAGAE brand
    const brand = page.locator("a[aria-label*='PERALAGAE Fine Jewellery']");
    await expect(brand).toBeVisible();
    await expect(brand.locator("img")).toBeVisible();

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
    await expect(bottomNav.getByRole("link", { name: "Wishlist" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Account" })).toBeVisible();

    // Wishlist has "0" count badge
    const wishlistBadge = page.getByTestId("mobile-wishlist-badge");
    await expect(wishlistBadge).toBeVisible();
    await expect(wishlistBadge).toHaveText("0");

    // 3. Drawer toggle, tabs, categories, and keyboard escape dismissal
    await hamburgerBtn.click();
    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("PERALAGAE");

    // Drawer tabs
    const menuTab = drawer.getByRole("tab", { name: "Menu" });
    const categoriesTab = drawer.getByRole("tab", { name: "Categories" });
    await expect(menuTab).toBeVisible();
    await expect(categoriesTab).toBeVisible();

    // Default MENU tab content strictly mirrors navbar links
    await expect(drawer.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Shop" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "New Arrivals" })).toBeVisible();

    // Switch to CATEGORIES tab
    await categoriesTab.click();
    await expect(drawer.getByRole("link", { name: "New Products" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Necklaces" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Earnings" })).toBeVisible();

    // Footer controls
    await expect(drawer.getByText("English")).toBeVisible();
    await expect(drawer.getByText("$ Dollar (US)")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeAttached();
  });

  test("Desktop: Hover animation and route-aware active state across pages", async ({ page }) => {
    // 1. Initial Home Route (/)
    const header = page.locator("header[role='banner']");
    const homeLink = header.getByRole("link", { name: "Home", exact: true });
    const shopLink = header.getByRole("link", { name: "Shop", exact: true });
    const contactLink = header.getByRole("link", { name: "Contact", exact: true });
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });

    // Home is active
    await expect(homeLink).toHaveAttribute("aria-current", "page");
    await expect(homeLink).toHaveClass(/active/);
    await expect(shopLink).not.toHaveAttribute("aria-current");

    // 2. Hover over inactive link (Shop)
    await shopLink.hover();
    // Home retains active underline while Shop is hovered
    await expect(homeLink).toHaveAttribute("aria-current", "page");
    await expect(homeLink).toHaveClass(/active/);

    // 3. Navigate to /shop
    await shopLink.click();
    await page.waitForURL("**/shop");
    await expect(header.getByRole("link", { name: "Shop", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(header.getByRole("link", { name: "Home", exact: true })).not.toHaveAttribute(
      "aria-current"
    );

    // 4. Navigate directly to /contact
    await page.goto("/contact");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });
    await expect(header.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(header.getByRole("link", { name: "Shop", exact: true })).not.toHaveAttribute(
      "aria-current"
    );

    // 5. Navigate to New Arrivals (navigates to homepage and scrolls to #new-arrivals)
    await expect(newArrivalsLink).toHaveAttribute("href", "/#new-arrivals");
    await newArrivalsLink.click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/#new-arrivals/);
    await expect(header.getByRole("link", { name: "New Arrivals", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(header.getByRole("link", { name: "Home", exact: true })).not.toHaveAttribute(
      "aria-current"
    );
    const targetSection = page.locator("#new-arrivals");
    await expect(targetSection).toBeVisible();
  });

  test("Mobile: Active route state is reflected in drawer navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Visit /shop
    await page.goto("/shop");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });

    // Open drawer
    const hamburgerBtn = page.getByRole("button", { name: "Open navigation menu" });
    await hamburgerBtn.click();

    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });
    await expect(drawer).toBeVisible();

    // In drawer, Shop link has aria-current='page' and gold text
    const shopDrawerLink = drawer.getByRole("link", { name: "Shop" });
    await expect(shopDrawerLink).toHaveAttribute("aria-current", "page");
    await expect(shopDrawerLink).toHaveClass(/text-\[#C5A572\]/);
  });

  test("New Arrivals: navigates to existing homepage section from another page and scrolls smoothly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Start on /shop
    await page.goto("/shop");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });

    // 2. Click New Arrivals in navbar
    const header = page.locator("header");
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });
    await newArrivalsLink.click();

    // 3. Verify URL is homepage with hash
    await expect(page).toHaveURL(/\/#new-arrivals/);

    // 4. Verify section exists on homepage and is visible
    const newArrivalsSection = page.locator("#new-arrivals");
    await expect(newArrivalsSection).toBeVisible();

    // 5. Verify heading is in viewport
    const heading = newArrivalsSection.locator("#new-collection-heading");
    await expect(heading).toBeInViewport();
  });

  test("Search: opens glass overlay, performs live query, toggles wishlist, adds to bag, and closes on Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const header = page.locator("header");
    const searchButton = header.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeVisible();

    // 1. Open search overlay
    await searchButton.click();

    const overlay = page.getByTestId("search-overlay-content");
    await expect(overlay).toBeVisible();

    const input = page.getByTestId("search-overlay-input");
    await expect(input).toBeVisible();

    // 2. Type query
    await input.fill("solitaire");

    // 3. Verify results container and matching item
    const resultsContainer = overlay.getByTestId("search-results-container");
    await expect(resultsContainer).toBeVisible();
    await expect(overlay.getByText("Solitaire Diamond Pendant Necklace")).toBeVisible();
    await expect(overlay.getByText("₹24,999")).toBeVisible();

    // 4. Toggle wishlist from search
    const wishlistBtn = overlay.getByTestId("search-wishlist-prod-solitaire-pendant");
    await wishlistBtn.click();

    // Check navbar badge reflects 1
    const wishlistBadge = page.getByTestId("wishlist-badge");
    await expect(wishlistBadge).toHaveText("1");

    // 5. Add to bag from search
    const addToBagBtn = overlay.getByTestId("search-add-to-cart-prod-solitaire-pendant");
    await addToBagBtn.click();
    await expect(addToBagBtn).toContainText("Added");

    // Check navbar cart badge reflects 1
    const cartBadge = page.getByTestId("cart-badge").first();
    await expect(cartBadge).toHaveText("1");

    // 6. Close via Escape key
    await page.keyboard.press("Escape");
    await expect(overlay).not.toBeVisible();
  });

  test("Newsletter: clicking navbar Subscribe link opens popup immediately, validates email, and closes cleanly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const subscribeLink = page.getByTestId("navbar-subscribe-link");
    await expect(subscribeLink).toBeVisible();

    // 1. Click Subscribe in navbar
    await subscribeLink.click();

    // 2. Verify popup is immediately visible
    const popup = page.getByTestId("newsletter-popup-content");
    await expect(popup).toBeVisible();

    await expect(popup.getByText("Join the our family")).toBeVisible();
    await expect(
      popup.getByText(
        "Sign up to get all the latest fashion news, website updates, offers and promos."
      )
    ).toBeVisible();
    await expect(popup.getByText("Do not show this window")).toBeVisible();

    // 3. Test inline email validation
    const emailInput = popup.getByTestId("newsletter-popup-email-input");
    const submitBtn = popup.getByTestId("newsletter-popup-submit-btn");

    await submitBtn.click();
    const errorAlert = popup.getByTestId("newsletter-popup-error");
    await expect(errorAlert).toHaveText("Please enter your email address.");

    await emailInput.fill("invalid-email-address");
    await submitBtn.click();
    await expect(errorAlert).toHaveText("Please enter a valid email address.");

    // 4. Close via close button
    const closeBtn = popup.getByTestId("newsletter-popup-close-btn");
    await closeBtn.click();
    await expect(popup).not.toBeVisible();
  });
});


