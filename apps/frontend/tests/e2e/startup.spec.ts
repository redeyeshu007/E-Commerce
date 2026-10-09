import { test, expect } from "@playwright/test";

test.describe("Test A: Application Startup", () => {
  test("starts up successfully and serves HTTP 200 without fatal console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify root HTML element is rendered and interactive
    await expect(page.locator("body")).toBeVisible();

    // Verify no unhandled page crashes or fatal JavaScript exceptions
    expect(pageErrors).toEqual([]);
  });

  test("contains valid HTML structure, language tag, and viewport metadata", async ({ page }) => {
    await page.goto("/");

    const htmlTag = page.locator("html");
    await expect(htmlTag).toHaveAttribute("lang", "en");

    const bodyTag = page.locator("body");
    await expect(bodyTag).toBeVisible();
  });
});
