import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Contact Page E2E Suite", () => {
  test("Desktop: Renders luxury jewellery banner, 2-column minimal layout, and valid contact details", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/contact");

    // Wait for preloader to finish
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });

    // 1. Hero Banner
    const hero = page.getByTestId("contact-hero-banner");
    await expect(hero).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByText("Contact", { exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { level: 1, name: "Contact Us" })).toBeVisible();
    await expect(
      page.getByText("We're here to help with your jewellery enquiries.")
    ).toBeVisible();

    // 2. Left Column: Minimal Details
    const main = page.getByRole("main");
    await expect(main.getByText("GET IN TOUCH")).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "How Can We Help?" })).toBeVisible();

    // Only 2 authentic contact channels in main content
    const emailLink = main.getByRole("link", { name: "contact@peralagae.com" });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute("href", "mailto:contact@peralagae.com");

    const phoneLink = main.getByRole("link", { name: "+91 98765 43210" });
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute("href", "tel:+919876543210");

    // Old cluttered cards MUST NOT exist
    await expect(page.getByText("Flagship Boutique")).not.toBeVisible();
    await expect(page.getByText("Boutique Hours")).not.toBeVisible();
    await expect(page.getByText("Email Concierge")).not.toBeVisible();

    // 3. Right Column: Contact Form
    await expect(page.getByRole("heading", { level: 3, name: "Send Us a Message" })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/Phone Number/i)).toBeVisible();
    await expect(page.getByLabel(/Message/i)).toBeVisible();

    const submitBtn = page.getByRole("button", { name: "SEND MESSAGE" });
    await expect(submitBtn).toBeVisible();

    // 4. Form Validation: Empty Submission
    await submitBtn.click();
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.getByText("Please enter your email address.")).toBeVisible();
    await expect(page.getByText("Please share your enquiry or message.")).toBeVisible();

    // 5. Valid Submission
    await page.getByLabel(/Full Name/i).fill("Eleanor Vance");
    await page.getByLabel(/Email Address/i).fill("eleanor.vance@example.com");
    await page.getByLabel(/Phone Number/i).fill("+91 98765 43210");
    await page.getByLabel(/Message/i).fill(
      "I would like to inquire about the solitaire diamond engagement ring and bespoke sizing."
    );

    await submitBtn.click();
    await expect(page.getByText("Enquiry Captured")).toBeVisible();
  });

  test("Mobile: Layout stacks gracefully without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/contact");

    // Wait for preloader to finish
    await expect(page.getByRole("status", { name: "PERALAGAE" })).not.toBeAttached({
      timeout: 6000,
    });

    // Verify hero banner title is visible
    await expect(page.getByRole("heading", { level: 1, name: "Contact Us" })).toBeVisible();

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Verify form inputs remain accessible and touch-friendly
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "SEND MESSAGE" })).toBeVisible();
  });
});
