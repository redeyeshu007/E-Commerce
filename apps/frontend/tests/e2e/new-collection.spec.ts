import { test, expect } from "@playwright/test";

test.describe("JAVIX New Collection E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders New Collection section with heading, 4 cards per row, and INR pricing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const newCollectionSection = page.locator('section[aria-labelledby="new-collection-heading"]');
    await expect(newCollectionSection).toBeVisible();

    // Verify centered heading and subtitle
    const heading = newCollectionSection.locator("#new-collection-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("New Collection");

    const subtitle = newCollectionSection.getByText("Collect your loves with our newest arrivals.");
    await expect(subtitle).toBeVisible();

    // Verify page dots exist (2 pages for 8 items)
    const dots = newCollectionSection.getByRole("tab", { name: /Go to carousel page/i });
    await expect(dots).toHaveCount(2);
    await expect(dots.first()).toHaveAttribute("aria-selected", "true");

    // Verify first 4 items visible
    const firstProduct = page.getByTestId("product-card-prod-solitaire-pendant");
    await expect(firstProduct).toBeVisible();
    await expect(firstProduct.getByText("NECKLACES")).toBeVisible();
    await expect(firstProduct.getByText("Solitaire Diamond Pendant Necklace")).toBeVisible();
    await expect(firstProduct.getByText("₹24,999")).toBeVisible();

    // Verify NEW badge on first product
    await expect(firstProduct.getByTestId("badge-new")).toBeVisible();

    // Verify HOT badge on second product (sculpted gold band)
    const hotProduct = page.getByTestId("product-card-prod-sculpted-gold-ring");
    await expect(hotProduct).toBeVisible();
    await expect(hotProduct.getByTestId("badge-hot")).toBeVisible();
  });

  test("Desktop: arrow controls advance and cycle the carousel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const newCollectionSection = page.locator('section[aria-labelledby="new-collection-heading"]');
    const nextBtn = newCollectionSection.getByRole("button", { name: "Next products" });
    const prevBtn = newCollectionSection.getByRole("button", { name: "Previous products" });
    const dots = newCollectionSection.getByRole("tab", { name: /Go to carousel page/i });

    // Initial state: page 1
    await expect(dots.first()).toHaveAttribute("aria-selected", "true");

    // Click next arrow
    await nextBtn.click();
    await expect(dots.nth(1)).toHaveAttribute("aria-selected", "true");

    // Click previous arrow
    await prevBtn.click();
    await expect(dots.first()).toHaveAttribute("aria-selected", "true");
  });

  test("Interactions: Quick View modal opens, displays details in INR, and closes via Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstProduct = page.getByTestId("product-card-prod-solitaire-pendant");
    await firstProduct.hover();

    const quickViewBtn = firstProduct.getByRole("button", { name: /Quick view/i });
    await expect(quickViewBtn).toBeVisible();
    await quickViewBtn.click();

    // Verify Quick View modal dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Solitaire Diamond Pendant Necklace" })).toBeVisible();
    await expect(dialog.getByText("₹24,999")).toBeVisible();
    await expect(dialog.getByText("18k Yellow Gold & Platinum")).toBeVisible();

    // Close via Escape key
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("Interactions: Add to Cart updates cart count in navbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstProduct = page.getByTestId("product-card-prod-solitaire-pendant");
    await firstProduct.hover();

    const addToCartBtn = firstProduct.getByRole("button", { name: /Add Solitaire Diamond.*to cart/i });
    await addToCartBtn.click();

    // Feedback displayed on card
    await expect(firstProduct.getByText("Added to Bag")).toBeVisible();

    // Verify cart count badge in navbar is 1
    const cartBadge = page.locator('[data-testid="cart-badge"]:visible');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText("1");
  });

  test("Interactions: Wishlist button toggles state and updates navbar badge", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstProduct = page.getByTestId("product-card-prod-solitaire-pendant");
    await firstProduct.hover();

    const wishlistBtn = firstProduct.getByRole("button", { name: /wishlist/i });
    await wishlistBtn.click();

    // Verify wishlist button state changed
    await expect(wishlistBtn).toHaveAttribute("aria-pressed", "true");

    // Verify wishlist count in navbar
    const wishlistBadge = page.getByTestId("wishlist-badge");
    await expect(wishlistBadge).toBeVisible();
    await expect(wishlistBadge).toHaveText("1");
  });

  test("Mobile responsive: renders 2 cards per row, 4 circular dots, and clean layout matching reference", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const newCollectionSection = page.locator('section[aria-labelledby="new-collection-heading"]');
    await expect(newCollectionSection).toBeVisible();

    const heading = newCollectionSection.locator("#new-collection-heading");
    await expect(heading).toBeVisible();

    // Verify side arrows are hidden on mobile
    const prevBtn = newCollectionSection.getByRole("button", { name: "Previous products" });
    const nextBtn = newCollectionSection.getByRole("button", { name: "Next products" });
    await expect(prevBtn).not.toBeVisible();
    await expect(nextBtn).not.toBeVisible();

    // Verify exactly 4 pagination dots on mobile (8 items / 2 per page)
    const dots = newCollectionSection.getByRole("tab", { name: /Go to carousel page/i });
    await expect(dots).toHaveCount(4);
    await expect(dots.first()).toHaveAttribute("aria-selected", "true");

    // Verify 2 product cards are visible side-by-side on mobile
    const firstProduct = page.getByTestId("product-card-prod-solitaire-pendant");
    const secondProduct = page.getByTestId("product-card-prod-sculpted-gold-ring");
    await expect(firstProduct).toBeVisible();
    await expect(secondProduct).toBeVisible();

    const box1 = await firstProduct.boundingBox();
    const box2 = await secondProduct.boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    if (box1 && box2) {
      // Both cards are in the same horizontal row (similar y-coordinate)
      expect(Math.abs(box1.y - box2.y)).toBeLessThan(10);
      // Card 2 is to the right of Card 1
      expect(box2.x).toBeGreaterThan(box1.x);
    }

    // Verify centered text and INR prices
    await expect(firstProduct.getByText("NECKLACES")).toBeVisible();
    await expect(firstProduct.getByText("₹24,999")).toBeVisible();
    await expect(secondProduct.getByText("RINGS")).toBeVisible();
    await expect(secondProduct.getByText("₹18,500")).toBeVisible();

    // Check no horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
  });
});
