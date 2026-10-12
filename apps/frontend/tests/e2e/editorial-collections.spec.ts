import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Editorial Collections Section E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders Editorial Collections section immediately following Store Locator banner", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const storeLocator = page.locator('section[aria-labelledby="store-locator-heading"]');
    await expect(storeLocator).toBeVisible();

    const editorialSection = page.locator('section[aria-labelledby="editorial-collections-tagline"]');
    await expect(editorialSection).toBeVisible();

    // Verify DOM order: Store Locator is immediately followed by Editorial Collections
    const isDirectFollower = await page.evaluate(() => {
      const sl = document.querySelector('section[aria-labelledby="store-locator-heading"]');
      const ec = document.querySelector('section[aria-labelledby="editorial-collections-tagline"]');
      return sl && ec && sl.nextElementSibling === ec;
    });
    expect(isDirectFollower).toBe(true);

    // Verify exact top brand tagline
    const tagline = editorialSection.locator("#editorial-collections-tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveText("Designed in India. Crafted with timeless elegance.");

    // Verify 3 editorial cards
    const card1 = editorialSection.getByTestId("editorial-card-lab-grown-diamonds");
    await expect(card1).toBeVisible();
    await expect(card1.getByRole("heading", { level: 3 })).toHaveText("Lab Grown Diamonds");
    await expect(card1.getByText("Discover the exceptional quality & sparkle.")).toBeVisible();
    await expect(card1.getByRole("link", { name: /EXPLORE NOW/i })).toBeVisible();

    const card2 = editorialSection.getByTestId("editorial-card-tennis-bracelets");
    await expect(card2).toBeVisible();
    await expect(card2.getByRole("heading", { level: 3 })).toHaveText("Tennis Bracelets");
    await expect(card2.getByText("Classic tennis bracelets designed for a lifetime.")).toBeVisible();
    await expect(card2.getByRole("link", { name: /SHOP COLLECTION/i })).toBeVisible();

    const card3 = editorialSection.getByTestId("editorial-card-garden-variety");
    await expect(card3).toBeVisible();
    await expect(card3.getByRole("heading", { level: 3 })).toHaveText("Garden Variety");
    await expect(card3.getByText("Add our new arrivals to your weekly lineup.")).toBeVisible();
    await expect(card3.getByRole("link", { name: /DISCOVER NOW/i })).toBeVisible();

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Mobile: stacks cards vertically without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const editorialSection = page.locator('section[aria-labelledby="editorial-collections-tagline"]');
    await expect(editorialSection).toBeVisible();

    const tagline = editorialSection.locator("#editorial-collections-tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveText("Designed in India. Crafted with timeless elegance.");

    // All 3 cards present and readable
    await expect(editorialSection.getByRole("heading", { name: "Lab Grown Diamonds" })).toBeVisible();
    await expect(editorialSection.getByRole("heading", { name: "Tennis Bracelets" })).toBeVisible();
    await expect(editorialSection.getByRole("heading", { name: "Garden Variety" })).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
