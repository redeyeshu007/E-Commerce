import { test, expect } from "@playwright/test";

test.describe("JAVIX JEWELLERY Footer E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for luxury preloader to complete
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 10000 });
  });

  test("Desktop: renders five columns matching reference screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const footer = page.locator('footer[data-testid="site-footer"]');
    await expect(footer).toBeVisible();

    // Column 1: JAVIX JEWELLERY Brand & Tagline
    const brandColumn = footer.getByTestId("footer-brand-column");
    await expect(brandColumn).toBeVisible();
    await expect(brandColumn.getByRole("link", { name: "JAVIX JEWELLERY", exact: true })).toBeVisible();
    await expect(
      brandColumn.getByText("Designed in India. Crafted with timeless elegance.")
    ).toBeVisible();

    // Column 2: Explore JAVIX (Replaced "About Alukas")
    const exploreCol = footer.getByTestId("footer-column-explore-javix");
    await expect(exploreCol).toBeVisible();
    await expect(exploreCol.getByRole("heading", { name: "Explore JAVIX", exact: true })).toBeVisible();

    const expectedExploreLinks = [
      { name: "Shop Our Collections", href: "/#shop-our-collections" },
      { name: "New Arrivals", href: "/#new-collection" },
      { name: "Necklaces", href: "/#shop-our-collections" },
      { name: "Rings", href: "/#shop-our-collections" },
      { name: "Bracelets", href: "/#shop-our-collections" },
      { name: "Earrings", href: "/#shop-our-collections" },
    ];

    for (const { name, href } of expectedExploreLinks) {
      const link = exploreCol.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }

    // Column 3: Shopping & More (Replaced "Our Company")
    const shoppingCol = footer.getByTestId("footer-column-shopping-and-more");
    await expect(shoppingCol).toBeVisible();
    await expect(shoppingCol.getByRole("heading", { name: "Shopping & More", exact: true })).toBeVisible();

    const expectedShoppingLinks = [
      { name: "Charms & Bangles", href: "/#shop-our-collections" },
      { name: "Gift Ideas", href: "/#shop-our-collections" },
      { name: "Find Store", href: "/#store-locator" },
      { name: "Services", href: "/#store-locator" },
      { name: "Subscribe", href: "/#newsletter-section" },
    ];

    for (const { name, href } of expectedShoppingLinks) {
      const link = shoppingCol.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }

    // Column 4: Store Details
    const storeCol = footer.getByTestId("footer-column-store-details");
    await expect(storeCol).toBeVisible();
    await expect(storeCol.getByRole("heading", { name: "Store Details", exact: true })).toBeVisible();
    await expect(storeCol.getByText("Need Any Help?")).toBeVisible();
    await expect(storeCol.getByText("123 45678 90")).toBeVisible();
    await expect(storeCol.getByText(/502 New Design Str, Melbourne, Australia/i)).toBeVisible();
    await expect(storeCol.getByText("contact@javixjewellery.com")).toBeVisible();

    // Column 5: Follow Us
    const followCol = footer.getByTestId("footer-column-follow-us");
    await expect(followCol).toBeVisible();
    await expect(followCol.getByRole("heading", { name: "Follow Us", exact: true })).toBeVisible();
    await expect(followCol.getByRole("link", { name: "Facebook", exact: true })).toBeVisible();
    await expect(followCol.getByRole("link", { name: "X (Twitter)", exact: true })).toBeVisible();
    await expect(followCol.getByRole("link", { name: "Pinterest", exact: true })).toBeVisible();
    await expect(followCol.getByRole("link", { name: "Instagram", exact: true })).toBeVisible();

    // Payment Methods Row
    const paymentMethods = footer.getByTestId("footer-payment-methods");
    await expect(paymentMethods).toBeVisible();
    await expect(paymentMethods.getByRole("img", { name: "Maestro" })).toBeVisible();
    await expect(paymentMethods.getByRole("img", { name: "PayPal" })).toBeVisible();
    await expect(paymentMethods.getByRole("img", { name: "Visa" })).toBeVisible();
    await expect(paymentMethods.getByRole("img", { name: "MasterCard" })).toBeVisible();

    // Copyright
    const copyright = footer.getByTestId("footer-copyright");
    await expect(copyright).toBeVisible();
    await expect(copyright).toHaveText("© 2026 JAVIX JEWELLERY. All Rights Reserved.");

    // Check no horizontal scrollbar / overflow on footer
    const footerOverflow = await page.evaluate(() => {
      const footerEl = document.querySelector('footer[data-testid="site-footer"]');
      if (!footerEl) return false;
      return footerEl.scrollWidth > document.documentElement.clientWidth;
    });
    expect(footerOverflow).toBe(false);
  });

  test("Desktop: Back-to-top button appears on scroll and returns to top", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    // Initially at top: back-to-top button should not be attached/visible
    const backToTopBtn = page.getByTestId("back-to-top-button");
    await expect(backToTopBtn).not.toBeVisible();

    // Scroll down 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(backToTopBtn).toBeVisible({ timeout: 5000 });

    // Click back-to-top button
    await backToTopBtn.click();

    // Verify scrolled back to top
    await expect.poll(async () => {
      return await page.evaluate(() => window.scrollY);
    }, { timeout: 5000 }).toBeLessThan(10);
  });

  test("Mobile: reflows gracefully without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const footer = page.locator('footer[data-testid="site-footer"]');
    await expect(footer).toBeVisible();

    // Both columns 2 and 3 visible on mobile
    await expect(footer.getByTestId("footer-column-explore-javix")).toBeVisible();
    await expect(footer.getByTestId("footer-column-shopping-and-more")).toBeVisible();

    // Check footer itself does not overflow
    const footerOverflow = await page.evaluate(() => {
      const footerEl = document.querySelector('footer[data-testid="site-footer"]');
      if (!footerEl) return false;
      return footerEl.scrollWidth > document.documentElement.clientWidth;
    });
    expect(footerOverflow).toBe(false);
  });
});
