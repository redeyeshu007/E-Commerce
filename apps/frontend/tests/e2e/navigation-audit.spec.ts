import { test, expect } from "@playwright/test";

test.describe("Navigation Audit & Validation Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("peralagae_newsletter_dismissed", "true");
    });
  });

  test("Test A: New Arrivals from Contact", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });
    
    // Confirm on Contact
    const header = page.locator("header");
    const contactLink = header.getByRole("link", { name: "Contact", exact: true });
    await expect(contactLink).toHaveAttribute("aria-current", "page");
    await expect(page.locator("h1, h2").filter({ hasText: "Contact Us" })).toBeVisible();

    // Click New Arrivals
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });
    await newArrivalsLink.click();

    // Confirm homepage appears and Contact Us is NOT displayed
    await page.waitForURL(/\/#new-arrivals/);
    await expect(page.locator("h1, h2").filter({ hasText: "Contact Us" })).not.toBeVisible();
    await expect(page.locator("#new-arrivals")).toBeVisible();
    await expect(page.locator("#new-collection-heading")).toBeInViewport();

    // Confirm active state
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");
    await expect(contactLink).not.toHaveAttribute("aria-current");
  });

  test("Test B: New Arrivals from Shop", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    const header = page.locator("header");
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });
    await newArrivalsLink.click();

    await page.waitForURL(/\/#new-arrivals/);
    await expect(page.locator("#new-arrivals")).toBeVisible();
    await expect(page.locator("#new-collection-heading")).toBeInViewport();
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");
  });

  test("Test C: Direct URL with #new-arrivals and Refresh", async ({ page }) => {
    await page.goto("/#new-arrivals");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });
    
    await expect(page.locator("#new-arrivals")).toBeVisible();
    await expect(page.locator("#new-collection-heading")).toBeInViewport();

    // Refresh
    await page.reload();
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    await expect(page.locator("#new-arrivals")).toBeVisible();
    await expect(page.locator("#new-collection-heading")).toBeInViewport();
  });

  test("Test D: Repeated Navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    const header = page.locator("header");
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });
    const contactLink = header.getByRole("link", { name: "Contact", exact: true });

    // Click repeatedly
    await newArrivalsLink.click();
    await newArrivalsLink.click();
    await expect(page).toHaveURL(/\/#new-arrivals/);
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");

    // Navigate to Contact
    await contactLink.click();
    await page.waitForURL("**/contact");
    await expect(contactLink).toHaveAttribute("aria-current", "page");
    await expect(newArrivalsLink).not.toHaveAttribute("aria-current");

    // Navigate back to New Arrivals
    await newArrivalsLink.click();
    await page.waitForURL(/\/#new-arrivals/);
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");
    await expect(contactLink).not.toHaveAttribute("aria-current");
    await expect(page.locator("#new-collection-heading")).toBeInViewport();
  });

  test("Test E: Browser History (Back and Forward)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    const header = page.locator("header");
    const shopLink = header.getByRole("link", { name: "Shop", exact: true });
    const contactLink = header.getByRole("link", { name: "Contact", exact: true });
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });

    // 1. Go to Shop
    await shopLink.click();
    await page.waitForURL("**/shop");
    await expect(shopLink).toHaveAttribute("aria-current", "page");

    // 2. Go to Contact
    await contactLink.click();
    await page.waitForURL("**/contact");
    await expect(contactLink).toHaveAttribute("aria-current", "page");

    // 3. Go to New Arrivals
    await newArrivalsLink.click();
    await page.waitForURL(/\/#new-arrivals/);
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");

    // 4. Back -> should be Contact
    await page.goBack();
    await page.waitForURL("**/contact");
    await expect(contactLink).toHaveAttribute("aria-current", "page");
    await expect(newArrivalsLink).not.toHaveAttribute("aria-current");

    // 5. Back -> should be Shop
    await page.goBack();
    await page.waitForURL("**/shop");
    await expect(shopLink).toHaveAttribute("aria-current", "page");

    // 6. Forward -> Contact
    await page.goForward();
    await page.waitForURL("**/contact");
    await expect(contactLink).toHaveAttribute("aria-current", "page");

    // 7. Forward -> New Arrivals
    await page.goForward();
    await page.waitForURL(/\/#new-arrivals/);
    await expect(newArrivalsLink).toHaveAttribute("aria-current", "page");
  });

  test("Test E2: Home -> New Arrivals -> Contact -> Back", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    const header = page.locator("header");
    const contactLink = header.getByRole("link", { name: "Contact", exact: true });
    const newArrivalsLink = header.getByRole("link", { name: "New Arrivals", exact: true });

    // 1. Click New Arrivals while on homepage
    await newArrivalsLink.click();
    await page.waitForTimeout(600);

    // 2. Click Contact
    await contactLink.click();
    await page.waitForURL("**/contact");
    await expect(page.locator("h1, h2").filter({ hasText: "Contact Us" })).toBeVisible();

    // 3. Click Browser Back
    await page.goBack();
    await page.waitForTimeout(600);

    // Check what page is visible and what URL is!
    console.log("Current URL after Back:", page.url());
    const isContactVisible = await page.locator("h1, h2").filter({ hasText: "Contact Us" }).isVisible();
    console.log("Is Contact Us visible after Back?:", isContactVisible);
    
    // The page should NOT display Contact Us!
    await expect(page.locator("h1, h2").filter({ hasText: "Contact Us" })).not.toBeVisible();
    await expect(page.locator("#new-arrivals")).toBeVisible();
  });

  test("Test F: Other Header Actions (Find a Store, FAQs, Subscribe, Search, Account, Wishlist, Cart)", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({ timeout: 6000 });

    const header = page.locator("header");

    // 1. Find a Store from /contact: navigates to homepage and scrolls to #store-locator
    const findStoreLink = header.getByRole("link", { name: "Find a Store" });
    await expect(findStoreLink).toBeVisible();
    await findStoreLink.click();
    await page.waitForURL(/\/#store-locator/);
    await expect(page.locator("#store-locator")).toBeVisible();
    await expect(page.locator("#store-locator-heading")).toBeInViewport();

    // 2. FAQs is static item
    const utility = page.locator("div[role='region'][aria-label*='Utility navigation']");
    await expect(utility.getByText("FAQs")).toBeVisible();
    await expect(utility.getByRole("link", { name: "FAQs" })).toHaveCount(0);

    // 3. Subscribe: opens newsletter popup modal
    const subscribeLink = header.getByRole("link", { name: "Subscribe" });
    await subscribeLink.click();
    const newsletterPopup = page.getByTestId("newsletter-popup-content");
    await expect(newsletterPopup).toBeVisible();
    const closeNewsletterBtn = page.getByTestId("newsletter-popup-close-btn");
    await closeNewsletterBtn.click();
    await expect(newsletterPopup).not.toBeVisible();

    // 4. Search: opens search overlay
    const searchBtn = header.getByRole("button", { name: "Search" });
    await searchBtn.click();
    const searchOverlay = page.getByTestId("search-overlay-content");
    await expect(searchOverlay).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchOverlay).not.toBeVisible();

    // 5. Account: opens auth modal
    const accountBtn = header.getByRole("button", { name: "Account" });
    await accountBtn.click();
    const authModal = page.getByTestId("auth-modal-content");
    await expect(authModal).toBeVisible();
    const closeAuthBtn = page.getByTestId("auth-modal-close-button");
    await closeAuthBtn.click();
    await expect(authModal).not.toBeVisible();

    // 6. Wishlist: navigates to /wishlist
    const wishlistLink = header.getByRole("link", { name: "Wishlist" });
    await wishlistLink.click();
    await page.waitForURL("**/wishlist");
    await expect(page.locator("h1").filter({ hasText: "Wishlist" })).toBeVisible();

    // 7. Cart: navigates to /cart
    const cartLink = page.locator("header").getByRole("link", { name: "Cart" }).first();
    await cartLink.click();
    await page.waitForURL("**/cart");
    await expect(page.locator("h1, h2").filter({ hasText: /Cart/i }).first()).toBeVisible();
  });
});
