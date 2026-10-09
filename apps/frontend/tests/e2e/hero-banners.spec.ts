import { test, expect } from "@playwright/test";

test.describe("JAVIX Hero & Promotional Banners E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders 2-column layout with 1 tall left banner and 2 stacked right banners", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const section = page.locator('section[aria-label="Promotional Collections"]');
    await expect(section).toBeVisible();

    const leftBanner = page.getByTestId("banner-hero-featured-necklaces");
    const rightTopBanner = page.getByTestId("banner-hero-secondary-desk-hals");
    const rightBottomBanner = page.getByTestId("banner-hero-secondary-charm-bracelets");

    await expect(leftBanner).toBeVisible();
    await expect(rightTopBanner).toBeVisible();
    await expect(rightBottomBanner).toBeVisible();

    // Verify 2-column side-by-side positioning
    const leftBox = await leftBanner.boundingBox();
    const rightTopBox = await rightTopBanner.boundingBox();
    const rightBottomBox = await rightBottomBanner.boundingBox();

    expect(leftBox).not.toBeNull();
    expect(rightTopBox).not.toBeNull();
    expect(rightBottomBox).not.toBeNull();

    if (leftBox && rightTopBox && rightBottomBox) {
      // Left banner is to the left of the right banners
      expect(leftBox.x).toBeLessThan(rightTopBox.x);
      // Right top banner is positioned above right bottom banner
      expect(rightTopBox.y).toBeLessThan(rightBottomBox.y);
      // Left banner height is approximately the sum of right banners + gap
      const combinedRightHeight = rightBottomBox.y + rightBottomBox.height - rightTopBox.y;
      expect(Math.abs(leftBox.height - combinedRightHeight)).toBeLessThanOrEqual(5);
    }

    // Verify text content matching exact reference
    await expect(leftBanner.locator("span", { hasText: "Necklaces &" })).toBeVisible();
    await expect(leftBanner.locator("h2")).toContainText("Body Jewels");
    await expect(rightTopBanner.locator("span", { hasText: "Just Lunched" })).toBeVisible();
    await expect(rightTopBanner.locator("h3")).toContainText("Desk The Hals");
    await expect(rightBottomBanner.locator("span", { hasText: "Jewelry &" })).toBeVisible();
    await expect(rightBottomBanner.locator("h3")).toContainText("Charm Bracelets");

    // Verify rectangular outline CTA buttons
    const leftCta = leftBanner.locator("a", { hasText: "Shop Now" });
    await expect(leftCta).toBeVisible();
    await expect(leftCta).toHaveAttribute("href", "/category/necklaces");
  });

  test("Mobile: stacks banners vertically without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const leftBanner = page.getByTestId("banner-hero-featured-necklaces");
    const rightTopBanner = page.getByTestId("banner-hero-secondary-desk-hals");
    const rightBottomBanner = page.getByTestId("banner-hero-secondary-charm-bracelets");

    await expect(leftBanner).toBeVisible();
    await expect(rightTopBanner).toBeVisible();
    await expect(rightBottomBanner).toBeVisible();

    const leftBox = await leftBanner.boundingBox();
    const rightTopBox = await rightTopBanner.boundingBox();
    const rightBottomBox = await rightBottomBanner.boundingBox();

    expect(leftBox).not.toBeNull();
    expect(rightTopBox).not.toBeNull();
    expect(rightBottomBox).not.toBeNull();

    if (leftBox && rightTopBox && rightBottomBox) {
      // In mobile view, banners stack vertically
      expect(leftBox.y).toBeLessThan(rightTopBox.y);
      expect(rightTopBox.y).toBeLessThan(rightBottomBox.y);
    }

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
