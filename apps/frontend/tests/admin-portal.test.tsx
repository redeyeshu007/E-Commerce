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

describe("PERALAGAE Admin Authentication & Minimal Dashboard Shell Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin Login Page (/admin/login)", () => {
    it("renders brand name, ADMIN label, heading, inputs, and Login button", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByText("PERALAGAE")).toBeInTheDocument();
        expect(screen.getByText("ADMIN")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Admin Login" })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
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
      await userEvent.click(screen.getByRole("button", { name: /^login$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
      });
    });

    it("redirects to /admin/dashboard on successful login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));
      vi.spyOn(adminAuthService, "loginAdmin").mockResolvedValue({
        token: "fake-jwt-token",
        admin: { email: "javixtech@gmail.com", role: "admin" },
      });

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/admin email/i), "javixtech@gmail.com");
      await userEvent.type(screen.getByLabelText(/^password/i), "ValidPassword123!");
      await userEvent.click(screen.getByRole("button", { name: /^login$/i }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/dashboard");
      });
    });
  });

  describe("2. Minimal Admin Top Navbar & Protected Dashboard Shell (/admin/dashboard)", () => {
    it("redirects to /admin/login when session is not authenticated", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("renders minimal navbar (PERALAGAE, ADMIN, Logout) and empty dashboard content area", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        // Navbar elements
        expect(screen.getByText("PERALAGAE")).toBeInTheDocument();
        expect(screen.getByText("ADMIN")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

        // Dashboard shell content
        expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();
        expect(
          screen.getByText("Welcome to the PERALAGAE administration panel.")
        ).toBeInTheDocument();
      });

      // Strict navbar and dashboard restrictions: no business modules, menus, or cards
      expect(screen.queryByText(/products/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/orders/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/customers/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/analytics/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/revenue/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });

    it("logs out through backend and redirects to /admin/login when logout is clicked", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
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
