import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Shop Page E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    // Wait for page to stabilize
    await page.waitForLoadState("domcontentloaded");
  });

  test("Desktop: renders hero banner, breadcrumbs, sidebar filters, and product grid with INR pricing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Hero banner and breadcrumbs
    const heroHeading = page.getByRole("heading", { level: 1, name: "Shop" });
    await expect(heroHeading).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByText("Shop", { exact: true })).toBeVisible();

    // 2. Sidebar Filters (Categories, Price, Materials, Size)
    const sidebar = page.getByLabel("Product Catalogue Filters");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("button", { name: /Categories/i })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: /Price Filter/i })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: /Materials/i })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: /Size/i })).toBeVisible();

    // 3. Product Toolbar with count
    const toolbar = page.getByRole("region", { name: /catalogue controls/i });
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole("status")).toHaveText(/Showing 1–12 of 24 products/i);

    // 4. Products rendered with Indian Rupee (₹)
    const productCards = page.locator('article[data-testid^="product-card-"]');
    await expect(productCards).toHaveCount(12);

    // Verify first card price format
    const firstPrice = productCards.first().locator("text=₹");
    await expect(firstPrice.first()).toBeVisible();
  });

  test("Interactions: Category filter updates products and product count", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Click on Rings category filter
    const ringsBtn = page.getByLabel("Product Catalogue Filters").getByRole("button", { name: /^Rings/i });
    await ringsBtn.click();

    // Toolbar count should update to Rings count
    const toolbar = page.getByRole("region", { name: /catalogue controls/i });
    const status = toolbar.getByRole("status");
    await expect(status).toHaveText(/Showing 1–5 of 5 products/i);

    // All displayed cards should belong to RINGS category
    const productCards = page.locator('article[data-testid^="product-card-"]');
    await expect(productCards).toHaveCount(5);

    // Clear All Filters should restore original 24 products
    const clearBtn = page.getByRole("button", { name: /Clear All/i });
    await clearBtn.click();
    await expect(status).toHaveText(/Showing 1–12 of 24 products/i);
  });

  test("Interactions: Sorting by Price Low to High rearranges products", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const sortSelect = page.getByLabel("Sort products");
    await sortSelect.selectOption("price-low-to-high");

    // Lowest item in catalogue is Sterling Silver Beaded Bracelet (₹12,500)
    const firstCard = page.locator('article[data-testid^="product-card-"]').first();
    await expect(firstCard).toContainText("Sterling Silver Beaded Bracelet");
    await expect(firstCard).toContainText("₹12,500");
  });

  test("Interactions: View mode switcher toggles to List View with expanded metadata", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const listViewBtn = page.getByRole("button", { name: /List view/i });
    await listViewBtn.click();

    // In list view, product cards have direct Add to Cart button and description
    const firstCard = page.locator('article[data-testid^="product-card-"]').first();
    await expect(firstCard.getByRole("button", { name: /Add.*to cart/i })).toBeVisible();
    await expect(firstCard.locator("p")).toBeVisible();
  });

  test("Mobile responsive: Filters button opens slide-over drawer and closes cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Desktop sidebar hidden on mobile
    const desktopSidebar = page.getByLabel("Product Catalogue Filters");
    await expect(desktopSidebar).not.toBeVisible();

    // Mobile Filters button visible in toolbar
    const filtersBtn = page.getByRole("button", { name: /Open product filters/i });
    await expect(filtersBtn).toBeVisible();
    await filtersBtn.click();

    // Drawer opens
    const drawer = page.getByRole("dialog", { name: /Filter Products Drawer/i });
    await expect(drawer).toBeVisible();

    // Close button dismisses drawer
    const closeBtn = drawer.getByRole("button", { name: /Close filters drawer/i });
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test("Price Filter: Single-track dual-thumb range slider updates products and resets cleanly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const sidebar = page.getByLabel("Product Catalogue Filters");

    // Exactly one slider track
    const track = sidebar.getByTestId("dual-range-slider-track");
    await expect(track).toBeVisible();

    // Exactly two thumbs on that single track
    const minThumb = sidebar.getByRole("slider", { name: "Minimum price" });
    const maxThumb = sidebar.getByRole("slider", { name: "Maximum price" });
    await expect(minThumb).toBeVisible();
    await expect(maxThumb).toBeVisible();

    // Min and Max labels and range text
    await expect(sidebar.getByText(/Min:/i)).toBeVisible();
    await expect(sidebar.getByText(/Max:/i)).toBeVisible();
    await expect(sidebar.getByText("₹12,500 – ₹68,000")).toBeVisible();

    // Focus max thumb and press PageDown repeatedly to lower max price
    await maxThumb.focus();
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageDown");

    // Product count in toolbar should update to reflect reduced range
    const toolbar = page.getByRole("region", { name: /catalogue controls/i });
    const status = toolbar.getByRole("status");
    await expect(status).not.toHaveText(/Showing 1–12 of 24 products/i);

    // Reset Price button appears
    const resetPriceBtn = sidebar.getByRole("button", { name: /Reset Price/i });
    await expect(resetPriceBtn).toBeVisible();

    // Click Reset Price restores default bounds
    await resetPriceBtn.click();
    await expect(status).toHaveText(/Showing 1–12 of 24 products/i);
    await expect(sidebar.getByText("₹12,500 – ₹68,000")).toBeVisible();
    await expect(resetPriceBtn).not.toBeVisible();
  });
});

