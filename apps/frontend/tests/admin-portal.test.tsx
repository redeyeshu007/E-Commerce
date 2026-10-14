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
  usePathname: () => "/admin/dashboard",
}));

describe("PERALAGAE Admin Authentication & Minimal Dashboard Shell Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin Login Route Compatibility (/admin/login)", () => {
    it("does NOT render a duplicate or standalone login page UI, and redirects to /?auth=login", async () => {
      const { container } = render(<AdminLoginPage />);

      // Ensure no standalone inputs, headings, or forms are rendered
      expect(screen.queryByRole("heading", { name: "Admin Login" })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/admin email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();

      // Confirms immediate redirection to homepage with modal trigger
      expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
    });
  });

  describe("2. Minimal Admin Top Navbar & Protected Dashboard Shell (/admin/dashboard)", () => {
    it("redirects to /?auth=login when session is not authenticated", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
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

    it("logs out through backend and redirects to /?auth=login when logout is clicked", async () => {
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
        expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
      });
    });
  });
});
