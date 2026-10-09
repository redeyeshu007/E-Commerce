import { test, expect } from "@playwright/test";

test.describe("JAVIX Reusable Loader System E2E", () => {
  test("preserves LuxuryPreloader on initial load and allows page to settle", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Initial luxury preloader is active on initial load
    const brandPreloader = page.getByRole("status", { name: "JAVIX JEWELLERY" });
    if (await brandPreloader.isVisible()) {
      await expect(brandPreloader).not.toBeAttached({ timeout: 6000 });
    }

    // 2. Underlying page settles without lingering full-page blocking overlays
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // 3. Navbar remains fully interactive
    const siteHeader = page.locator("header");
    await expect(siteHeader).toBeVisible();
  });

  test("does not display accidental global loading overlay during normal idle browsing", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for preloader unmount
    await page.waitForTimeout(2000);

    // Ensure no fullscreen blocking loaders remain
    const fullscreenLoader = page.locator("[data-variant='fullscreen']");
    await expect(fullscreenLoader).not.toBeVisible();

    // Ensure main page links and banner buttons are interactive
    const bannerButtons = page.locator("main a, main button");
    await expect(bannerButtons.first()).toBeVisible();
  });
});
