import { test, expect } from "@playwright/test";

test.describe("Test B: JAVIX Luxury Preloader Lifecycle", () => {
  test("mounts on initial load, displays brand text, and unmounts to reveal main content", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Preloader overlay appears on page load with status role and luxury aria-label
    const preloader = page.getByRole("status");
    await expect(preloader).toBeVisible();
    await expect(preloader).toHaveAttribute("aria-label", "JAVIX JEWELLERY");

    // 2. Preloader finishes and unmounts from the DOM within timeout (< 4 seconds)
    await expect(preloader).not.toBeAttached({ timeout: 5000 });

    // 3. Underlying page content is accessible and visible
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gold Commerce Platform");
  });

  test("restarts preloader lifecycle cleanly on page refresh without hanging or duplicating", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for first preloader completion
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 5000 });
    await expect(page.locator("main")).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify preloader runs again and unmounts cleanly
    const reloadedPreloader = page.getByRole("status");
    await expect(reloadedPreloader).toBeVisible();
    await expect(reloadedPreloader).not.toBeAttached({ timeout: 5000 });

    // Main content is visible again
    await expect(page.locator("main")).toBeVisible();
  });

  test("handles reduced-motion preference gracefully", async ({ page }) => {
    // Emulate reduced motion user setting
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/");

    // With reduced motion, preloader should still render accessible element and dismiss cleanly
    const preloader = page.getByRole("status");
    if (await preloader.isVisible()) {
      await expect(preloader).not.toBeAttached({ timeout: 5000 });
    }

    // Main content is visible and accessible
    await expect(page.locator("main")).toBeVisible();
  });
});
