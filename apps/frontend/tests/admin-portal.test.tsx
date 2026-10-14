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

describe("PERALAGAE Admin Authentication, Dashboard & Sidebar Suite", () => {
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

    it("renders menu icon, brand, ADMIN label, Logout button, and empty dashboard content area", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        // Navbar elements
        expect(
          screen.getByRole("button", { name: /open navigation menu/i })
        ).toBeInTheDocument();
        expect(screen.getAllByText("PERALAGAE")[0]).toBeInTheDocument();
        expect(screen.getAllByText("ADMIN")[0]).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

        // Dashboard shell content
        expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();
        expect(
          screen.getByText(
            "The Admin Dashboard will be implemented once all project features are completed."
          )
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

  describe("3. Admin Navigation Sidebar Drawer", () => {
    it("opens the slide-out navigation drawer when the menu button is clicked", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /open navigation menu/i })
        ).toBeInTheDocument();
      });

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
      await userEvent.click(menuButton);

      // Drawer is open
      const drawer = screen.getByTestId("admin-sidebar-drawer");
      expect(drawer).toHaveClass("translate-x-0");

      // Drawer contains PERALAGAE ADMIN and Dashboard item
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();

      // STRICT SCOPE: No Products, Orders, Customers, or Settings in drawer
      expect(screen.queryByRole("link", { name: /products/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /orders/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /customers/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /analytics/i })).not.toBeInTheDocument();
    });

    it("closes the drawer when the close button is clicked", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /open navigation menu/i })
        ).toBeInTheDocument();
      });

      // Open drawer
      await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
      const drawer = screen.getByTestId("admin-sidebar-drawer");
      expect(drawer).toHaveClass("translate-x-0");

      // Click close button
      const closeButton = screen.getByTestId("admin-sidebar-close-button");
      await userEvent.click(closeButton);

      expect(drawer).toHaveClass("-translate-x-full");
    });

    it("closes the drawer when the semi-transparent backdrop is clicked", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /open navigation menu/i })
        ).toBeInTheDocument();
      });

      // Open drawer
      await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
      const drawer = screen.getByTestId("admin-sidebar-drawer");
      expect(drawer).toHaveClass("translate-x-0");

      // Click backdrop
      const backdrop = screen.getByTestId("admin-sidebar-backdrop");
      await userEvent.click(backdrop);

      expect(drawer).toHaveClass("-translate-x-full");
    });

    it("closes the drawer when the Escape key is pressed", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /open navigation menu/i })
        ).toBeInTheDocument();
      });

      // Open drawer
      await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
      const drawer = screen.getByTestId("admin-sidebar-drawer");
      expect(drawer).toHaveClass("translate-x-0");

      // Press Escape
      await userEvent.keyboard("{Escape}");

      expect(drawer).toHaveClass("-translate-x-full");
    });
  });
});
