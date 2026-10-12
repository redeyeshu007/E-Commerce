import { test, expect } from "@playwright/test";

test.describe("JAVIX Customer Reviews Section E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders Customer Reviews section following Editorial Collections with smooth infinite marquee", async ({
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

    // Verify the infinite marquee track is present and moving
    const marqueeTrack = reviewsSection.getByTestId("reviews-marquee-track");
    await expect(marqueeTrack).toBeVisible();
    await expect(marqueeTrack).toHaveClass(/reviews-marquee-track/);

    // Verify review cards in track
    const card1 = reviewsSection.getByTestId("review-card-rev-1").first();
    await expect(card1).toBeVisible();
    await expect(card1.getByRole("heading", { level: 3 })).toHaveText(
      "Beautiful Gold Craftsmanship"
    );
    await expect(card1.getByText("Arjun Kumar")).toBeVisible();
    await expect(
      card1.getByRole("img", { name: "Rated 5 out of 5 stars" })
    ).toBeVisible();

    // Check no horizontal overflow on body/html
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Mobile: renders infinite marquee smoothly without horizontal overflow", async ({
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

    // Marquee track is present
    const marqueeTrack = reviewsSection.getByTestId("reviews-marquee-track");
    await expect(marqueeTrack).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
