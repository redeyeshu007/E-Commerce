import { test, expect } from "@playwright/test";

test.describe("JAVIX Shop Our Collections E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders 6 collection items in a single horizontal row directly below hero banners", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const heroSection = page.locator('section[aria-label="Promotional Collections"]');
    const collectionsSection = page.locator('section[aria-labelledby="shop-our-collections-heading"]');

    await expect(heroSection).toBeVisible();
    await expect(collectionsSection).toBeVisible();

    // Verify Collections section is positioned directly beneath Hero banners
    const heroBox = await heroSection.boundingBox();
    const collectionsBox = await collectionsSection.boundingBox();

    expect(heroBox).not.toBeNull();
    expect(collectionsBox).not.toBeNull();

    if (heroBox && collectionsBox) {
      expect(collectionsBox.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 10);
    }

    // Verify centered heading
    const heading = collectionsSection.locator("#shop-our-collections-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Shop Our Collections");

    // Verify exact 6 collection cards
    const expectedCategories = [
      { slug: "necklaces", title: "NECKLACES" },
      { slug: "rings", title: "RINGS" },
      { slug: "bracelets", title: "BRACELETS" },
      { slug: "earrings", title: "EARRINGS" },
      { slug: "charms-bangles", title: "CHARMS & BANGLES" },
      { slug: "gift-ideas", title: "GIFT IDEAS" },
    ];

    const cardBoxes = [];

    for (let i = 0; i < expectedCategories.length; i++) {
      const cat = expectedCategories[i];
      const card = page.getByTestId(`collection-card-${cat.slug}`);
      await expect(card).toBeVisible();
      await expect(card.locator("span", { hasText: cat.title })).toBeVisible();

      // Verify image exists
      const img = card.locator("img");
      await expect(img).toBeVisible();

      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        cardBoxes.push(box);
      }
    }

    expect(cardBoxes).toHaveLength(6);

    // Verify all 6 cards are aligned in a single horizontal row on desktop (y coordinates approximately equal)
    const firstY = cardBoxes[0].y;
    for (let i = 1; i < cardBoxes.length; i++) {
      expect(Math.abs(cardBoxes[i].y - firstY)).toBeLessThanOrEqual(5);
      // Items are ordered from left to right
      expect(cardBoxes[i].x).toBeGreaterThan(cardBoxes[i - 1].x);
    }
  });

  test("Mobile: renders responsive grid without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const collectionsSection = page.locator('section[aria-labelledby="shop-our-collections-heading"]');
    await expect(collectionsSection).toBeVisible();

    const necklacesCard = page.getByTestId("collection-card-necklaces");
    const ringsCard = page.getByTestId("collection-card-rings");
    const braceletsCard = page.getByTestId("collection-card-bracelets");

    await expect(necklacesCard).toBeVisible();
    await expect(ringsCard).toBeVisible();
    await expect(braceletsCard).toBeVisible();

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("Visual Verification: captures desktop, tablet, and mobile screenshots", async ({ page }) => {
    const artifactDir = "C:/Users/Sudharsan/.gemini/antigravity-ide/brain/be7d25b3-ebfa-4962-a3f1-e44b1d49cbc9";

    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.waitForTimeout(500);
    const collectionsSection = page.locator('section[aria-labelledby="shop-our-collections-heading"]');
    await collectionsSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifactDir}/collections_desktop.png` });

    // 2. Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await collectionsSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifactDir}/collections_tablet.png` });

    // 3. Mobile Viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await collectionsSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifactDir}/collections_mobile.png` });
  });
});
