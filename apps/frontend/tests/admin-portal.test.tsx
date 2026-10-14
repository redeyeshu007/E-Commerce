import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminLoginPage from "@/app/admin/login/page";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import * as adminAuthService from "@/services/admin-auth-service";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/login",
}));

describe("PERALAGAE Admin Authentication & Portal Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin Login Page (/admin/login)", () => {
    it("renders brand name, admin login heading, inputs, and submit button", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByText("PERALAGAE")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Admin Login" })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in to admin portal/i })).toBeInTheDocument();
    });

    it("toggles password visibility between password and text", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      await userEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });

    it("displays error message when submitted with invalid credentials", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));
      vi.spyOn(adminAuthService, "loginAdmin").mockRejectedValue(
        new Error("Invalid email or password")
      );

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/admin email/i), "wrong@peralagae.com");
      await userEvent.type(screen.getByLabelText(/^password/i), "wrongpass");
      await userEvent.click(screen.getByRole("button", { name: /sign in to admin portal/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
      });
    });

    it("redirects to /admin/dashboard on successful login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));
      vi.spyOn(adminAuthService, "loginAdmin").mockResolvedValue({
        token: "fake-jwt-token",
        admin: { email: "admin@peralagae.com", role: "admin" },
      });

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/admin email/i), "admin@peralagae.com");
      await userEvent.type(screen.getByLabelText(/^password/i), "ValidPassword123!");
      await userEvent.click(screen.getByRole("button", { name: /sign in to admin portal/i }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/dashboard");
      });
    });
  });

  describe("2. Protected Admin Dashboard (/admin/dashboard)", () => {
    it("redirects to /admin/login when session is not authenticated", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("renders dashboard heading, welcome message, and logout button when authenticated", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "admin@peralagae.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();
      });

      expect(screen.getAllByText(/admin@peralagae.com/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Phase 1 authentication complete/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

      // Ensure no business modules or widgets are present
      expect(screen.queryByText(/products/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/orders/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/customers/i)).not.toBeInTheDocument();
    });

    it("logs out and redirects to /admin/login when logout is clicked", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "admin@peralagae.com",
        role: "admin",
      });
      const logoutSpy = vi.spyOn(adminAuthService, "logoutAdmin").mockResolvedValue();

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /logout/i }));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith("/admin/login");
      });
    });
  });
});
