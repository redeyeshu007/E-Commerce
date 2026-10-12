import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Instagram Gallery and Newsletter Sections E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
  });

  test("Desktop: renders Instagram Gallery and Newsletter sections in exact homepage order", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const reviewsSection = page.locator(
      'section[aria-labelledby="customer-reviews-heading"]'
    );
    await expect(reviewsSection).toBeVisible();

    const instagramSection = page.locator(
      'section[aria-labelledby="instagram-gallery-heading"]'
    );
    await expect(instagramSection).toBeVisible();

    const newsletterSection = page.locator(
      'section[aria-labelledby="newsletter-heading"]'
    );
    await expect(newsletterSection).toBeVisible();

    // Verify DOM sequence: Customer Reviews -> Instagram Gallery -> Newsletter
    const isCorrectSequence = await page.evaluate(() => {
      const cr = document.querySelector(
        'section[aria-labelledby="customer-reviews-heading"]'
      );
      const ig = document.querySelector(
        'section[aria-labelledby="instagram-gallery-heading"]'
      );
      const nl = document.querySelector(
        'section[aria-labelledby="newsletter-heading"]'
      );
      return (
        cr &&
        ig &&
        nl &&
        cr.nextElementSibling === ig &&
        ig.nextElementSibling === nl
      );
    });
    expect(isCorrectSequence).toBe(true);

    // --- SECTION 1: INSTAGRAM GALLERY ---
    const igHeading = instagramSection.locator("#instagram-gallery-heading");
    await expect(igHeading).toHaveText("Follow Us on Instagram");

    const igHandle = instagramSection.getByTestId("instagram-handle-text");
    await expect(igHandle).toHaveText("@peralagaeofficial");

    // Exactly 6 images rendered in gallery
    const igImages = instagramSection.getByRole("img");
    await expect(igImages).toHaveCount(6);

    // --- SECTION 2: NEWSLETTER SUBSCRIPTION ---
    const nlHeading = newsletterSection.locator("#newsletter-heading");
    await expect(nlHeading).toHaveText("Sign up now & get 10% off");

    const nlDescription = newsletterSection.getByTestId(
      "newsletter-description"
    );
    await expect(nlDescription).toHaveText(
      "A little luxury, delivered straight to your inbox."
    );

    const emailInput = newsletterSection.getByPlaceholder("Email Address");
    await expect(emailInput).toBeVisible();

    const subscribeBtn = newsletterSection.getByRole("button", {
      name: "SUBSCRIBE",
    });
    await expect(subscribeBtn).toBeVisible();

    // Test validation on invalid email
    await emailInput.fill("invalid-email-address");
    await subscribeBtn.click();

    const errorAlert = newsletterSection.getByRole("alert");
    await expect(errorAlert).toHaveText("Please enter a valid email address.");

    // Fill valid email and verify clean backend boundary notice
    await emailInput.fill("customer@example.com");
    await subscribeBtn.click();

    const statusNotice = newsletterSection.getByTestId("newsletter-status");
    await expect(statusNotice).toBeVisible();

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Mobile: renders Instagram Gallery and Newsletter comfortably without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const instagramSection = page.locator(
      'section[aria-labelledby="instagram-gallery-heading"]'
    );
    await expect(instagramSection).toBeVisible();

    const newsletterSection = page.locator(
      'section[aria-labelledby="newsletter-heading"]'
    );
    await expect(newsletterSection).toBeVisible();

    // Gallery images are visible on mobile
    const igImages = instagramSection.getByRole("img");
    await expect(igImages).toHaveCount(6);

    // Newsletter input and button are visible and accessible
    const emailInput = newsletterSection.getByPlaceholder("Email Address");
    await expect(emailInput).toBeVisible();

    const subscribeBtn = newsletterSection.getByRole("button", {
      name: "SUBSCRIBE",
    });
    await expect(subscribeBtn).toBeVisible();

    // Check no horizontal scrollbar on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
