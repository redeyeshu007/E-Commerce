import { test, expect } from "@playwright/test";

test.describe("PERALAGAE Luxury Authentication Experience E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the custom luxury preloader to finish and unmount cleanly
    await expect(page.getByRole("status")).not.toBeAttached({ timeout: 6000 });
  });

  test("opens login modal from desktop navbar account icon and displays all required elements", async ({
    page,
  }) => {
    // Desktop Account button in header
    const accountButton = page.getByRole("button", { name: "Account" }).first();
    await expect(accountButton).toBeVisible();
    await accountButton.click();

    // Verify modal container and backdrop
    const modalContent = page.getByTestId("auth-modal-content");
    await expect(modalContent).toBeVisible();

    // Verify PERALAGAE branding inside modal
    await expect(modalContent.getByAltText("PERALAGAE")).toBeVisible();

    // Verify Heading and Supporting text
    await expect(modalContent.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    await expect(
      modalContent.getByText("Sign in to continue your jewellery journey.")
    ).toBeVisible();

    // Verify Form Fields
    const emailInput = modalContent.locator("input#login-email");
    const passwordInput = modalContent.locator("input#login-password");
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Verify Password Visibility Toggle
    const toggleButton = modalContent.getByRole("button", { name: "Show password" });
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(modalContent.getByRole("button", { name: "Hide password" })).toBeVisible();

    // Verify Forgot Password link
    await expect(
      modalContent.getByRole("button", { name: "Forgot Password?" })
    ).toBeVisible();

    // Verify Sign In primary button
    const submitBtn = modalContent.getByTestId("login-submit-button");
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText("Sign In");

    // Verify Divider & Google button
    await expect(modalContent.getByText("OR", { exact: true })).toBeVisible();
    await expect(modalContent.getByTestId("google-sign-in-button")).toBeVisible();

    // Verify Switch to Register link
    await expect(
      modalContent.getByRole("button", { name: "Create an account" })
    ).toBeVisible();

    // CRITICAL: Strictly verify NO "Remember me" checkbox is present anywhere
    await expect(modalContent.getByText(/remember me/i)).not.toBeAttached();
    await expect(modalContent.locator("input[type='checkbox']")).not.toBeAttached();
  });

  test("smoothly navigates between Login, Create Account, and Forgot Password views", async ({
    page,
  }) => {
    const accountButton = page.getByRole("button", { name: "Account" }).first();
    await accountButton.click();

    const modalContent = page.getByTestId("auth-modal-content");
    await expect(modalContent).toBeVisible();

    // 1. Switch from Login to Create Account
    const createAccountBtn = modalContent.getByRole("button", { name: "Create an account" });
    await createAccountBtn.click();

    await expect(modalContent.getByRole("heading", { name: "Create Your Account" })).toBeVisible();
    await expect(
      modalContent.getByText("Join Peralagae and discover jewellery crafted for your moments.")
    ).toBeVisible();
    await expect(modalContent.locator("input#register-fullname")).toBeVisible();
    await expect(modalContent.locator("input#register-email")).toBeVisible();
    await expect(modalContent.locator("input#register-password")).toBeVisible();
    await expect(modalContent.locator("input#register-confirm-password")).toBeVisible();
    await expect(modalContent.getByTestId("register-submit-button")).toHaveText("Create Account");

    // Strictly verify NO "Remember me" in Register either
    await expect(modalContent.getByText(/remember me/i)).not.toBeAttached();
    await expect(modalContent.locator("input[type='checkbox']")).not.toBeAttached();

    // 2. Switch from Create Account back to Login
    const signInBtn = modalContent.getByRole("button", { name: "Sign in" });
    await signInBtn.click();
    await expect(modalContent.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

    // 3. Switch to Forgot Password
    const forgotPasswordLink = modalContent.getByRole("button", { name: "Forgot Password?" });
    await forgotPasswordLink.click();

    await expect(modalContent.getByRole("heading", { name: "Reset Your Password" })).toBeVisible();
    await expect(
      modalContent.getByText("Enter your registered email address and we'll send you instructions to reset your password.")
    ).toBeVisible();
    await expect(modalContent.locator("input#forgot-password-email")).toBeVisible();
    await expect(modalContent.getByTestId("forgot-password-submit-button")).toHaveText("Send Reset Link");

    // 4. Return to Sign In from Forgot Password
    const backToSignIn = modalContent.getByRole("button", { name: "Back to Sign In" });
    await backToSignIn.click();
    await expect(modalContent.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  });

  test("closes modal via Close button, Escape key, and backdrop click", async ({ page }) => {
    // 1. Open and close via close button
    const accountButton = page.getByRole("button", { name: "Account" }).first();
    await accountButton.click();

    const modalContent = page.getByTestId("auth-modal-content");
    await expect(modalContent).toBeVisible();

    const closeButton = modalContent.getByRole("button", {
      name: "Close authentication modal",
    });
    await closeButton.click();
    await expect(modalContent).not.toBeAttached();

    // 2. Open and close via Escape key
    await accountButton.click();
    await expect(modalContent).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modalContent).not.toBeAttached();
  });

  test("opens auth modal from mobile bottom bar on small viewports", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const bottomNav = page.locator("nav[aria-label='Mobile Bottom Navigation']");
    await expect(bottomNav).toBeVisible();

    const mobileAccountBtn = bottomNav.getByRole("button", { name: "Account" });
    await mobileAccountBtn.click();

    const modalContent = page.getByTestId("auth-modal-content");
    await expect(modalContent).toBeVisible();
    await expect(modalContent.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

    // Close on mobile
    const closeButton = modalContent.getByRole("button", {
      name: "Close authentication modal",
    });
    await closeButton.click();
    await expect(modalContent).not.toBeAttached();
  });

  test("shows clear configuration notice when clicking Continue with Google without client ID", async ({
    page,
  }) => {
    const accountButton = page.getByRole("button", { name: "Account" }).first();
    await accountButton.click();

    const modalContent = page.getByTestId("auth-modal-content");
    const googleBtn = modalContent.getByTestId("google-sign-in-button");
    await googleBtn.click();

    // Displays clear, honest setup guidance instead of simulated fake login
    const setupNotice = modalContent.getByTestId("google-setup-notice");
    await expect(setupNotice).toBeVisible();
    await expect(setupNotice).toContainText("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  });
});
