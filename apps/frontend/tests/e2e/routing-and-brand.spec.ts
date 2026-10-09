import { test, expect } from "@playwright/test";

test.describe("Test C & E: Routing, Brand Identity & Page Rendering", () => {
  test("displays brand tab title in Title Case (no full uppercase) and points to J monogram favicon", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for initial preloader to finish
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });

    // Verify settled document title is "Javix Jewellery" (Title Case, NOT full uppercase)
    await expect(page).toHaveTitle(/Javix Jewellery/);
    const title = await page.title();
    expect(title).not.toBe("JAVIX JEWELLERY");
    expect(title).not.toBe("JAVIX");

    // Verify favicon link points to J monogram SVG icon
    const iconLink = page.locator("link[rel*='icon']").first();
    await expect(iconLink).toBeAttached();
    const href = await iconLink.getAttribute("href");
    expect(href).toMatch(/icon\.svg/);
  });

  test("serves 404 page gracefully for unknown routes", async ({ page }) => {
    const response = await page.goto("/non-existent-e2e-route-404");

    // Next.js serves 404 status code for undefined routes
    expect(response?.status()).toBe(404);

    // Page renders not-found UI without crashing
    await expect(page.locator("body")).toBeVisible();
  });

  test("contains valid meta description for luxury fine jewellery brand", async ({ page }) => {
    await page.goto("/");

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      "Javix Jewellery — Luxury Gold & Fine Jewellery",
    );
  });
});
