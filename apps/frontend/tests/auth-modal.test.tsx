import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthModal } from "@/components/auth/auth-modal";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SiteHeader } from "@/components/navbar/site-header";
import { StorefrontProvider } from "@/providers/storefront-provider";

describe("PERALAGAE Premium Authentication Experience Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Navbar Account Icon Interaction & Modal Triggering", () => {
    it("opens the auth modal when the desktop Account button is clicked", async () => {
      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      // Initially closed
      expect(screen.queryByTestId("auth-modal-content")).not.toBeInTheDocument();

      // Click desktop Account button
      const accountButtons = screen.getAllByRole("button", { name: "Account" });
      fireEvent.click(accountButtons[0]);

      // Modal is opened
      await waitFor(() => {
        expect(screen.getByTestId("auth-modal-content")).toBeInTheDocument();
      });

      // Renders Welcome Back heading and PERALAGAE branding
      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
      expect(screen.getByAltText("PERALAGAE")).toBeInTheDocument();
    });

    it("opens the auth modal when the mobile sticky bottom bar Account button is clicked", async () => {
      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      const accountButtons = screen.getAllByRole("button", { name: "Account" });
      // Mobile bottom bar button
      fireEvent.click(accountButtons[accountButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByTestId("auth-modal-content")).toBeInTheDocument();
      });
      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    });

    it("closes the modal via the close 'X' button", async () => {
      const onClose = vi.fn();
      render(<AuthModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole("button", {
        name: "Close authentication modal",
      });
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it("closes the modal via Escape key press", async () => {
      const onClose = vi.fn();
      render(<AuthModal isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("locks and restores document body scroll overflow when opening and closing", () => {
      const { rerender } = render(<AuthModal isOpen={true} onClose={vi.fn()} />);
      expect(document.body.style.overflow).toBe("hidden");

      rerender(<AuthModal isOpen={false} onClose={vi.fn()} />);
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("2. Login View & Form Requirements", () => {
    it("renders Welcome Back heading, email input, password input, and Sign In button", () => {
      render(
        <LoginForm
          onSwitchToRegister={vi.fn()}
          onSwitchToForgotPassword={vi.fn()}
        />
      );

      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to continue your jewellery journey.")
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Forgot Password?" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create an account" })).toBeInTheDocument();
    });

    it("STRICT CHECK: does NOT render any 'Remember me' checkbox anywhere in the login interface", () => {
      render(
        <LoginForm
          onSwitchToRegister={vi.fn()}
          onSwitchToForgotPassword={vi.fn()}
        />
      );

      expect(screen.queryByText(/remember me/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("toggles password visibility between masked and plain text", () => {
      render(
        <LoginForm
          onSwitchToRegister={vi.fn()}
          onSwitchToForgotPassword={vi.fn()}
        />
      );

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: "Show password" });
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
      expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("validates empty email and empty password fields with inline error messages", async () => {
      render(
        <LoginForm
          onSwitchToRegister={vi.fn()}
          onSwitchToForgotPassword={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(screen.getByText("Email address is required")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
      });
    });

    it("validates invalid email format with informative feedback", async () => {
      render(
        <LoginForm
          onSwitchToRegister={vi.fn()}
          onSwitchToForgotPassword={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "not-an-email" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "ValidPassword123" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
      });
    });
  });

  describe("3. Create Account (Registration) View & Validation", () => {
    it("renders Create Your Account heading and all required fields without any Remember me checkbox", () => {
      render(
        <RegisterForm
          onSwitchToLogin={vi.fn()}
        />
      );

      expect(screen.getByRole("heading", { name: "Create Your Account" })).toBeInTheDocument();
      expect(
        screen.getByText("Join Peralagae and discover jewellery crafted for your moments.")
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();

      // STRICT CHECK: No Remember me checkbox in registration
      expect(screen.queryByText(/remember me/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("validates full name requirement, email format, and password length/policy", async () => {
      render(<RegisterForm onSwitchToLogin={vi.fn()} />);

      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "A" } });
      fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "invalid" } });
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } });

      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Full name must be at least 2 characters")).toBeInTheDocument();
        expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("validates that confirm password must match password", async () => {
      render(<RegisterForm onSwitchToLogin={vi.fn()} />);

      fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Ananya Krishnan" } });
      fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "ananya@example.com" } });
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "LuxuryGold2026" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "DifferentPassword" } });

      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });
  });

  describe("4. Google Sign-In Integration", () => {
    it("renders official Continue with Google button on login and registration", () => {
      const { rerender } = render(
        <LoginForm onSwitchToRegister={vi.fn()} onSwitchToForgotPassword={vi.fn()} />
      );
      expect(screen.getByTestId("google-sign-in-button")).toBeInTheDocument();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();

      rerender(<RegisterForm onSwitchToLogin={vi.fn()} />);
      expect(screen.getByTestId("google-sign-in-button")).toBeInTheDocument();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("displays informative setup notice when Google OAuth is not configured instead of faking success", async () => {
      render(
        <LoginForm onSwitchToRegister={vi.fn()} onSwitchToForgotPassword={vi.fn()} />
      );

      const googleBtn = screen.getByTestId("google-sign-in-button");
      fireEvent.click(googleBtn);

      await waitFor(() => {
        const notice = screen.getByTestId("google-setup-notice");
        expect(notice).toBeInTheDocument();
        expect(notice).toHaveTextContent(/NEXT_PUBLIC_GOOGLE_CLIENT_ID/);
      });
    });
  });

  describe("5. Forgot Password View & Transition", () => {
    it("renders Reset Your Password heading, email input, and Back to Sign In button", () => {
      render(
        <ForgotPasswordForm onSwitchToLogin={vi.fn()} />
      );

      expect(screen.getByRole("heading", { name: "Reset Your Password" })).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to Sign In" })).toBeInTheDocument();
    });

    it("displays generic privacy-preserving confirmation upon submitting valid email", async () => {
      render(
        <ForgotPasswordForm onSwitchToLogin={vi.fn()} />
      );

      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "registered.user@example.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));

      await waitFor(() => {
        expect(screen.getByText("Instructions Sent")).toBeInTheDocument();
        expect(
          screen.getByText(
            /If an account is associated with this email, you will receive password reset instructions shortly./
          )
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Return to Sign In" })).toBeInTheDocument();
      });
    });
  });

  describe("6. Seamless In-Modal View Transitions", () => {
    it("switches smoothly from Login to Register and back to Login within the same modal", async () => {
      render(<AuthModal isOpen={true} onClose={vi.fn()} initialView="login" />);

      // Initially on Login
      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();

      // Click Create an account
      fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
      expect(screen.getByRole("heading", { name: "Create Your Account" })).toBeInTheDocument();

      // Click Sign in to return
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    });

    it("switches smoothly from Login to Forgot Password and back to Login", async () => {
      render(<AuthModal isOpen={true} onClose={vi.fn()} initialView="login" />);

      // Click Forgot Password?
      fireEvent.click(screen.getByRole("button", { name: "Forgot Password?" }));
      expect(screen.getByRole("heading", { name: "Reset Your Password" })).toBeInTheDocument();

      // Click Back to Sign In
      fireEvent.click(screen.getByRole("button", { name: "Back to Sign In" }));
      expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    });
  });
});
