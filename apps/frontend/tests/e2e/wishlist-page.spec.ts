import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Wishlist Page E2E Suite", () => {
  test("Empty Wishlist: displays hero banner, breadcrumbs, and empty state CTA", async ({
    page,
  }) => {
    // Clear localStorage to ensure empty wishlist
    await page.goto("/wishlist");
    await page.evaluate(() => {
      localStorage.removeItem("peralagae_wishlist_ids");
      localStorage.removeItem("javix_wishlist_ids");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 1. Breadcrumb & Hero Banner
    const heroBanner = page.getByTestId("wishlist-hero-banner");
    await expect(heroBanner).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByText("Wishlist", { exact: true })).toBeVisible();

    // 2. Main Page Heading
    const heading = page.getByRole("heading", { level: 1, name: "Wishlist" });
    await expect(heading).toBeVisible();

    // 3. Empty Wishlist State
    const emptyState = page.getByTestId("wishlist-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText("Your Wishlist Is Empty")).toBeVisible();
    await expect(
      emptyState.getByRole("link", { name: /Continue Shopping/i })
    ).toHaveAttribute("href", "/shop");
  });

  test("Active Wishlist Flow: adds from shop, views on wishlist, adds to cart, and removes", async ({
    page,
  }) => {
    // Clear state
    await page.goto("/shop");
    await page.evaluate(() => {
      localStorage.removeItem("peralagae_wishlist_ids");
      localStorage.removeItem("javix_wishlist_ids");
      localStorage.removeItem("peralagae_cart_items");
      localStorage.removeItem("javix_cart_items");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 1. Add first product to wishlist from shop
    const firstProductCard = page.locator('article[data-testid^="product-card-"]').first();
    await firstProductCard.hover();
    const wishlistHeartBtn = firstProductCard.getByRole("button", { name: /wishlist/i });
    await wishlistHeartBtn.click();

    // Wait for state change
    await page.waitForTimeout(500);

    // 2. Navigate to /wishlist
    await page.goto("/wishlist");
    await page.waitForLoadState("domcontentloaded");

    // 3. Verify product row in wishlist table
    const wishlistRows = page.locator('tr[data-testid^="wishlist-row-"]');
    await expect(wishlistRows.first()).toBeVisible();

    // 4. Click Add to Cart from wishlist
    const addToCartBtn = page.locator('button[data-testid^="add-to-cart-wishlist-"]').first();
    await addToCartBtn.click();

    // Verify feedback
    await expect(addToCartBtn).toContainText(/Added/i);

    // Verify cart count badge
    const cartBadge = page.getByTestId("cart-badge").first();
    await expect(cartBadge).toHaveText("1");

    // 5. Remove item from wishlist
    const removeBtn = page.locator('button[data-testid^="remove-wishlist-"]').first();
    await removeBtn.click();

    // 6. Verify empty state renders
    await expect(page.getByTestId("wishlist-empty-state")).toBeVisible();
  });

  test("Mobile: Wishlist cards are responsive and legible without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    // Seed 1 wishlist item directly in localStorage
    await page.goto("/wishlist");
    await page.evaluate(() => {
      localStorage.setItem("peralagae_wishlist_ids", JSON.stringify(["prod-solitaire-pendant"]));
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Check mobile card is visible
    const mobileCard = page.getByTestId("wishlist-card-prod-solitaire-pendant");
    await expect(mobileCard).toBeVisible();

    // Check no horizontal scrollbar / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
