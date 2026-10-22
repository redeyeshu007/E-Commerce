import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerAuthService } from "@/services/customer-auth-service";
import { StorefrontProvider, useStorefront } from "@/providers/storefront-provider";
import { RegisterForm } from "@/components/auth/register-form";
import { LoginForm } from "@/components/auth/login-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

describe("Frontend Customer Authentication Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("1. Customer Registration Flow", () => {
    it("submits customer registration with valid credentials and invokes registerCustomer", async () => {
      const registerSpy = vi.spyOn(CustomerAuthService, "register").mockResolvedValue({
        id: "cust-123",
        email: "customer@peralagae.com",
        fullName: "Ananya Sharma",
        role: "customer",
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
      });

      const onSuccess = vi.fn();

      render(
        <StorefrontProvider>
          <RegisterForm onSwitchToLogin={vi.fn()} onSuccess={onSuccess} />
        </StorefrontProvider>
      );

      fireEvent.change(screen.getByLabelText("Full Name"), {
        target: { value: "Ananya Sharma" },
      });
      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "customer@peralagae.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Password$/i), {
        target: { value: "Peralagae2026!" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "Peralagae2026!" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(registerSpy).toHaveBeenCalledWith({
          fullName: "Ananya Sharma",
          email: "customer@peralagae.com",
          password: "Peralagae2026!",
          confirmPassword: "Peralagae2026!",
        });
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("displays error banner when duplicate customer email is returned", async () => {
      vi.spyOn(CustomerAuthService, "register").mockRejectedValue(
        new Error("An account with this email address already exists. Please sign in.")
      );

      render(
        <StorefrontProvider>
          <RegisterForm onSwitchToLogin={vi.fn()} onSuccess={vi.fn()} />
        </StorefrontProvider>
      );

      fireEvent.change(screen.getByLabelText("Full Name"), {
        target: { value: "Ananya Sharma" },
      });
      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "duplicate@peralagae.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Password$/i), {
        target: { value: "Peralagae2026!" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "Peralagae2026!" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByTestId("auth-error-banner")).toHaveTextContent(
          "An account with this email address already exists"
        );
      });
    });
  });

  describe("2. Customer Sign In & Session Persistence", () => {
    it("successfully logs in customer and updates Storefront context", async () => {
      const mockCustomer = {
        id: "cust-456",
        email: "existing@peralagae.com",
        fullName: "Vikram Rathore",
        role: "customer" as const,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(CustomerAuthService, "login").mockResolvedValue(mockCustomer);

      function TestConsumer() {
        const { customer, isAuthenticated } = useStorefront();
        return (
          <div>
            <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "guest"}</span>
            <span data-testid="user-name">{customer?.fullName || "none"}</span>
            <LoginForm onSwitchToRegister={vi.fn()} onSwitchToForgotPassword={vi.fn()} />
          </div>
        );
      }

      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");

      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "existing@peralagae.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "ValidPassword123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
        expect(screen.getByTestId("user-name")).toHaveTextContent("Vikram Rathore");
      });
    });

    it("logs out customer and clears session state", async () => {
      const mockCustomer = {
        id: "cust-789",
        email: "logout@peralagae.com",
        fullName: "Priya Nair",
        role: "customer" as const,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      CustomerAuthService.setStoredCustomer(mockCustomer);
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(mockCustomer);
      const logoutSpy = vi.spyOn(CustomerAuthService, "logout").mockResolvedValue();

      function LogoutTestConsumer() {
        const { isAuthenticated, logoutCustomer } = useStorefront();
        return (
          <div>
            <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "guest"}</span>
            <button type="button" onClick={() => logoutCustomer()} data-testid="logout-btn">
              Sign Out
            </button>
          </div>
        );
      }

      render(
        <StorefrontProvider>
          <LogoutTestConsumer />
        </StorefrontProvider>
      );

      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");

      fireEvent.click(screen.getByTestId("logout-btn"));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
        expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
      });
    });
  });

  describe("3. Forgot Password Form", () => {
    it("submits email and displays privacy-preserving confirmation", async () => {
      // Mock global fetch for forgot password
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "If an account exists with this email address, you will receive password reset instructions.",
        }),
      });

      render(<ForgotPasswordForm onSwitchToLogin={vi.fn()} />);

      fireEvent.change(screen.getByLabelText("Email Address"), {
        target: { value: "forgot@peralagae.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));

      await waitFor(() => {
        expect(screen.getByText("Instructions Sent")).toBeInTheDocument();
        expect(screen.getByText(/If an account is associated with this email/i)).toBeInTheDocument();
      });
    });
  });

  describe("4. Google OAuth Button Configuration Status", () => {
    it("reports configuration requirement when Google credentials are not set", async () => {
      // Mock unconfigured response from backend
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: { code: "GOOGLE_NOT_CONFIGURED" },
          data: { configured: false },
        }),
      });

      render(<GoogleSignInButton />);

      fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

      await waitFor(() => {
        const notice = screen.getByTestId("google-setup-notice");
        expect(notice).toBeInTheDocument();
        expect(notice).toHaveTextContent(/pending environment configuration/i);
      });
    });
  });
});
