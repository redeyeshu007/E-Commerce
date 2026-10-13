import { test, expect, type Page } from "@playwright/test";

/**
 * Helper to ensure the custom PERALAGAE Luxury Preloader has unmounted
 */
async function waitForPreloader(page: Page) {
  await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
    timeout: 7000,
  });
}

test.describe("PERALAGAE Master End-to-End User Journeys & Responsive Viewports", () => {
  test.beforeEach(async ({ page }) => {
    // Reset stored state
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("peralagae_cart_items");
      localStorage.removeItem("peralagae_wishlist_ids");
      localStorage.removeItem("javix_cart_items");
      localStorage.removeItem("javix_wishlist_ids");
    });
  });

  /* =========================================================================
   * JOURNEY 1 — Browse and Purchase Preparation
   * Open Shop → filter products → sort by price → select a product → add to cart → verify cart contents and totals
   * ========================================================================= */
  test("Journey 1 — Browse and purchase preparation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/shop");
    await waitForPreloader(page);

    // 1. Verify Shop hero banner and breadcrumb
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();

    // 2. Filter products by category (e.g. Necklaces)
    const categoryLink = page.locator('aside button:has-text("Necklaces"), aside a:has-text("Necklaces")').first();
    await categoryLink.click();
    await page.waitForTimeout(400);

    // 3. Sort by Price: Low to High
    const sortSelect = page.locator("select#shop-sort-select");
    await sortSelect.selectOption("price-low-to-high");
    await page.waitForTimeout(400);

    // 4. Select a product card and Add to Cart
    const firstProduct = page.locator('article[data-testid^="product-card-"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.hover();
    const addToCartBtn = firstProduct.getByRole("button", { name: /Add.*to cart/i });
    await addToCartBtn.click({ force: true });

    // Verify navbar cart badge updates to 1
    const cartBadge = page.getByTestId("cart-badge").first();
    await expect(cartBadge).toHaveText("1");

    // 5. Navigate to Cart and verify contents & totals
    await page.goto("/cart");
    await waitForPreloader(page);

    const totalsPanel = page.getByTestId("cart-totals-panel");
    await expect(totalsPanel).toBeVisible();
    const subtotalText = await page.getByTestId("cart-subtotal").textContent();
    expect(subtotalText).toContain("₹");

    const finalTotalText = await page.getByTestId("cart-final-total").textContent();
    expect(finalTotalText).toContain("₹");

    // Verify quantity is 1
    const qtyText = page.locator('[data-testid^="quantity-"]').first();
    await expect(qtyText).toHaveText("1");
  });

  /* =========================================================================
   * JOURNEY 2 — Wishlist Lifecycle
   * Open Shop → add to Wishlist → open Wishlist → remove product → verify count & empty state
   * ========================================================================= */
  test("Journey 2 — Wishlist lifecycle", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/shop");
    await waitForPreloader(page);

    // 1. Add first product to Wishlist
    const firstProduct = page.locator('article[data-testid^="product-card-"]').first();
    await firstProduct.hover();
    const wishlistBtn = firstProduct.getByRole("button", { name: /wishlist/i });
    await wishlistBtn.click({ force: true });

    // Verify navbar wishlist badge is 1
    const wishlistBadge = page.getByTestId("wishlist-badge").first();
    await expect(wishlistBadge).toHaveText("1");

    // 2. Navigate to Wishlist page
    await page.goto("/wishlist");
    await waitForPreloader(page);

    // Verify 6-column wishlist table
    const row = page.locator('tr[data-testid^="wishlist-row-"]').first();
    await expect(row).toBeVisible();
    await expect(row.getByText(/In Stock/i)).toBeVisible();

    // 3. Remove product from Wishlist
    const removeBtn = row.locator('button[data-testid^="remove-wishlist-"]');
    await removeBtn.click();

    // 4. Verify Empty State is displayed
    const emptyState = page.getByTestId("wishlist-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText(/Your Wishlist Is Empty/i)).toBeVisible();
  });

  /* =========================================================================
   * JOURNEY 3 — Cart Recommendations & Cross-Selling
   * Add product to Cart → verify recommendations → ensure cart items excluded → add recommended product
   * ========================================================================= */
  test("Journey 3 — Cart recommendations & exclusion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/shop");
    await waitForPreloader(page);

    // Add first item to cart
    const firstCard = page.locator('article[data-testid^="product-card-"]').first();
    const firstCardId = await firstCard.getAttribute("data-testid");
    const addedProductId = firstCardId?.replace("product-card-", "");

    await firstCard.hover();
    await firstCard.getByRole("button", { name: /Add.*to cart/i }).click({ force: true });

    // Navigate to Cart
    await page.goto("/cart");
    await waitForPreloader(page);

    const recsSection = page.getByTestId("cart-recommendations-section");
    await expect(recsSection).toBeVisible();

    // Verify recommendations exclude the currently added product
    if (addedProductId) {
      const duplicateInRecs = recsSection.locator(`[data-testid="product-card-${addedProductId}"]`);
      await expect(duplicateInRecs).not.toBeAttached();
    }

    // Add a recommended product into the cart
    const firstRecCard = recsSection.locator('article[data-testid^="product-card-"]').first();
    await firstRecCard.hover();
    await firstRecCard.getByRole("button", { name: /Add.*to cart/i }).click({ force: true });

    // Wait for cart badge update to 2
    const cartBadge = page.getByTestId("cart-badge").first();
    await expect(cartBadge).toHaveText("2");
  });

  /* =========================================================================
   * JOURNEY 4 — Contact Form & Honest Feedback
   * Open Contact → submit empty form → verify validation → enter valid data → verify honest feedback
   * ========================================================================= */
  test("Journey 4 — Contact form validation and honest submission", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/contact");
    await waitForPreloader(page);

    // Submit empty form to trigger client-side validation
    const submitBtn = page.getByRole("button", { name: "SEND MESSAGE" });
    await submitBtn.click();

    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.getByText("Please enter your email address.")).toBeVisible();
    await expect(page.getByText("Please share your enquiry or message.")).toBeVisible();

    // Fill valid data
    await page.getByLabel(/Full Name/i).fill("Devika Sharma");
    await page.getByLabel(/Email Address/i).fill("devika.sharma@example.com");
    await page.getByLabel(/Phone Number/i).fill("+91 98450 12345");
    await page.getByLabel(/Message/i).fill(
      "Inquiring about 18k solid yellow gold solitaire diamond pendants."
    );

    await submitBtn.click();

    // Verify feedback (Enquiry Captured / honest integration notice)
    await expect(page.getByText(/Enquiry Captured|Thank You/i)).toBeVisible();
  });

  /* =========================================================================
   * JOURNEY 5 — Authentication Modal Lifecycle
   * Open account modal → validate fields → switch to registration → password recovery → close modal
   * ========================================================================= */
  test("Journey 5 — Authentication modal interactions and dismissal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForPreloader(page);

    // Open modal via Account button
    const accountBtn = page.getByRole("button", { name: "Account" }).first();
    await accountBtn.click();

    const modal = page.getByTestId("auth-modal-content");
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

    // Switch to Registration
    await modal.getByRole("button", { name: "Create an account" }).click();
    await expect(modal.getByRole("heading", { name: "Create Your Account" })).toBeVisible();

    // Switch to Forgot Password
    await modal.getByRole("button", { name: "Sign in" }).click();
    await modal.getByRole("button", { name: "Forgot Password?" }).click();
    await expect(modal.getByRole("heading", { name: "Reset Your Password" })).toBeVisible();

    // Return to sign in
    await modal.getByRole("button", { name: "Back to Sign In" }).click();

    // Close modal with Escape key
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeAttached();
  });

  /* =========================================================================
   * JOURNEY 6 & SECTION 4 — Responsive Viewports (Zero Overflow Audit)
   * 375x812, 390x844, 768x1024, 1366x768, 1440x900, 1920x1080
   * ========================================================================= */
  const VIEWPORTS = [
    { name: "Mobile (375x812)", width: 375, height: 812 },
    { name: "Mobile (390x844)", width: 390, height: 844 },
    { name: "Tablet (768x1024)", width: 768, height: 1024 },
    { name: "Laptop (1366x768)", width: 1366, height: 768 },
    { name: "Desktop (1440x900)", width: 1440, height: 900 },
    { name: "Wide Desktop (1920x1080)", width: 1920, height: 1080 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Journey 6 — Responsive viewport check: ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ["/", "/shop", "/cart", "/wishlist", "/contact"]) {
        await page.goto(route);
        await waitForPreloader(page);

        // Strict zero horizontal overflow assertion
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(
          scrollWidth,
          `Horizontal overflow detected on ${route} at ${vp.width}x${vp.height}`
        ).toBeLessThanOrEqual(clientWidth + 1);

        // Verify body and main landmark visibility
        await expect(page.locator("body")).toBeVisible();
      }
    });
  }
});
