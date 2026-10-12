import { test, expect } from "@playwright/test";

test.describe("JAVIX Customer Reviews Section E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders Customer Reviews section following Editorial Collections with exact styling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const editorialSection = page.locator(
      'section[aria-labelledby="editorial-collections-tagline"]'
    );
    await expect(editorialSection).toBeVisible();

    const reviewsSection = page.locator(
      'section[aria-labelledby="customer-reviews-heading"]'
    );
    await expect(reviewsSection).toBeVisible();

    // Verify DOM order: Editorial Collections is followed immediately by Customer Reviews
    const isDirectFollower = await page.evaluate(() => {
      const ec = document.querySelector(
        'section[aria-labelledby="editorial-collections-tagline"]'
      );
      const cr = document.querySelector(
        'section[aria-labelledby="customer-reviews-heading"]'
      );
      return ec && cr && ec.nextElementSibling === cr;
    });
    expect(isDirectFollower).toBe(true);

    // Verify Section Heading
    const heading = reviewsSection.locator("#customer-reviews-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Customer Reviews");

    // Verify background color is #F0E5E4 (rgb(240, 229, 228))
    const bgColor = await reviewsSection.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe("rgb(240, 229, 228)");

    // Verify 3 visible cards on desktop page 1
    const card1 = reviewsSection.getByTestId("review-card-rev-1");
    await expect(card1).toBeVisible();
    await expect(card1.getByRole("heading", { level: 3 })).toHaveText(
      "Beautiful Gold Craftsmanship"
    );
    await expect(card1.getByText("Arjun Kumar")).toBeVisible();
    await expect(
      card1.getByRole("img", { name: "Rated 5 out of 5 stars" })
    ).toBeVisible();

    const card2 = reviewsSection.getByTestId("review-card-rev-2");
    await expect(card2).toBeVisible();
    await expect(card2.getByRole("heading", { level: 3 })).toHaveText(
      "Elegant and Timeless"
    );
    await expect(card2.getByText("Priya Raman")).toBeVisible();

    const card3 = reviewsSection.getByTestId("review-card-rev-3");
    await expect(card3).toBeVisible();
    await expect(card3.getByRole("heading", { level: 3 })).toHaveText(
      "A Beautiful Gift"
    );
    await expect(card3.getByText("Karthik Subramanian")).toBeVisible();

    // Verify pagination dots
    const paginationTabs = reviewsSection.getByRole("tab");
    const tabCount = await paginationTabs.count();
    expect(tabCount).toBe(4); // 10 items / 3 per page = 4 pages (3, 3, 3, 1)

    // Click dot 2 (index 1) to navigate to page 2
    await paginationTabs.nth(1).click();

    // Page 2 reviews should now be visible
    const card4 = reviewsSection.getByTestId("review-card-rev-4");
    await expect(card4).toBeVisible();
    await expect(card4.getByRole("heading", { level: 3 })).toHaveText(
      "Lovely Traditional Design"
    );
    await expect(card4.getByText("Meena Lakshmi")).toBeVisible();

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Mobile: responsive arrangement without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const reviewsSection = page.locator(
      'section[aria-labelledby="customer-reviews-heading"]'
    );
    await expect(reviewsSection).toBeVisible();

    const heading = reviewsSection.locator("#customer-reviews-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Customer Reviews");

    // Card 1 is visible
    const card1 = reviewsSection.getByTestId("review-card-rev-1");
    await expect(card1).toBeVisible();
    await expect(card1.getByRole("heading", { level: 3 })).toHaveText(
      "Beautiful Gold Craftsmanship"
    );
    await expect(card1.getByText("Arjun Kumar")).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
