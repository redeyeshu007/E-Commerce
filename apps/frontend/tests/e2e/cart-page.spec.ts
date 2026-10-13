import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Cart Page & Recommendations E2E Suite", () => {
  test("Empty Cart: displays breadcrumb, empty state message, Continue Shopping CTA, and curated recommendations", async ({
    page,
  }) => {
    // Clear localStorage to ensure empty cart
    await page.goto("/cart");
    await page.evaluate(() => {
      localStorage.removeItem("peralagae_cart_items");
      localStorage.removeItem("javix_cart_items");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 1. Breadcrumbs
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/shop");
    await expect(breadcrumb.getByText("Cart", { exact: true })).toBeVisible();

    // 2. Main Page Heading
    const heading = page.getByRole("heading", { level: 1, name: "Cart" });
    await expect(heading).toBeVisible();

    // 3. Empty Cart State
    const emptyState = page.getByTestId("cart-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText("Your Cart Is Empty")).toBeVisible();
    await expect(
      emptyState.getByRole("link", { name: /Continue Shopping/i })
    ).toHaveAttribute("href", "/shop");

    // 4. “You May Be Interested In…” Section with Fallback Catalogue Cards
    const recsSection = page.getByTestId("cart-recommendations-section");
    await expect(recsSection).toBeVisible();
    await expect(
      recsSection.getByRole("heading", { name: /You May Be Interested In…/i })
    ).toBeVisible();

    const recCards = recsSection.locator('article[data-testid^="product-card-"]');
    await expect(recCards).toHaveCount(4);
  });

  test("Active Cart Flow: displays items, updates quantity, recalculates totals, and applies coupons", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Navigate to Shop and Add First Item
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    const firstCard = page.locator('article[data-testid^="product-card-"]').first();
    await firstCard.hover();
    const addToCartBtn = firstCard.getByRole("button", { name: /Add.*to cart/i });
    await addToCartBtn.click({ force: true });

    // 2. Navigate to Cart Page
    await page.goto("/cart");
    await page.waitForLoadState("domcontentloaded");

    // 3. Verify Cart Table and Cart Totals Panel
    const totalsPanel = page.getByTestId("cart-totals-panel");
    await expect(totalsPanel).toBeVisible();
    await expect(totalsPanel.getByRole("heading", { name: /Cart Totals/i })).toBeVisible();

    // Free shipping indicated
    await expect(totalsPanel.getByText(/Free/i)).toBeVisible();

    // 4. Quantity Increment
    const quantityDisplay = page.locator('[data-testid^="quantity-"]').first();
    await expect(quantityDisplay).toHaveText("1");

    const increaseBtn = page.getByRole("button", { name: /Increase quantity/i }).first();
    await increaseBtn.click();
    await expect(quantityDisplay).toHaveText("2");

    // 5. Quantity Decrement
    const decreaseBtn = page.getByRole("button", { name: /Decrease quantity/i }).first();
    await decreaseBtn.click();
    await expect(quantityDisplay).toHaveText("1");
    // Decrement button now disabled
    await expect(decreaseBtn).toBeDisabled();

    // 6. Promotional Coupon Application
    const couponInput = page.getByPlaceholder(/Coupon code/i);
    await couponInput.fill("SUMMER15");
    const applyCouponBtn = page.getByRole("button", { name: /Apply Coupon/i });
    await applyCouponBtn.click();

    // Applied coupon badge and discount row appear
    await expect(page.getByTestId("applied-coupon-banner")).toBeVisible();
    await expect(page.getByTestId("cart-discount-row")).toBeVisible();

    // 7. Remove Coupon
    const removeCouponBtn = page.getByRole("button", { name: /Remove applied coupon/i });
    await removeCouponBtn.click();
    await expect(page.getByTestId("cart-discount-row")).not.toBeVisible();

    // 8. Checkout CTA Button
    const checkoutBtn = page.getByTestId("proceed-to-checkout-btn");
    await expect(checkoutBtn).toBeVisible();
    await expect(checkoutBtn).toHaveAttribute("href", "/checkout");

    // 9. Remove Item from Cart restores Empty State
    const removeItemBtn = page.getByRole("button", { name: /Remove.*from cart/i }).first();
    await removeItemBtn.click();

    await expect(page.getByTestId("cart-empty-state")).toBeVisible();
  });

  test("Mobile: price and quantity controls are fully legible without clipping or horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    // 1. Add item to cart from shop
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    const firstCard = page.locator('article[data-testid^="product-card-"]').first();
    await firstCard.hover();
    const addToCartBtn = firstCard.getByRole("button", { name: /Add.*to cart/i });
    await addToCartBtn.click({ force: true });

    // Wait for added feedback / persistence
    await page.waitForTimeout(500);

    // 2. Open Cart Page on 360px mobile viewport
    await page.goto("/cart");
    await page.waitForLoadState("domcontentloaded");

    // 3. Verify card elements are properly visible
    const cartCard = page.locator('[data-testid^="cart-item-card-"]').first();
    await expect(cartCard).toBeVisible();

    // Check quantity control and price
    const quantityControl = cartCard.locator('[data-testid^="quantity-"]');
    await expect(quantityControl).toBeVisible();

    const priceText = cartCard.locator("text=₹").last();
    await expect(priceText).toBeVisible();

    // Verify card does not cause horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
