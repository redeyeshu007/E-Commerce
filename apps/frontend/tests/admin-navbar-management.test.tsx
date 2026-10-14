import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminNavbarPage from "@/app/admin/navbar/page";
import * as adminAuthService from "@/services/admin-auth-service";
import * as navbarAdminService from "@/services/navbar-admin-service";
import type { NavbarSettingsData, NavbarHistoryItem } from "@/types/navbar";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/navbar",
}));

const mockInitialSettings: NavbarSettingsData = {
  id: "current",
  topBar: {
    text: "SUMMER SALE, Get 40% Off for all products.",
    backgroundColor: "#FBC0CE",
    textColor: "#222222",
    visible: true,
    dismissible: true,
  },
  secondNavbar: {
    phone: "+91 98765 43210",
    phoneHref: "tel:+919876543210",
    promoText: "Summer Sale 15% off!",
    ctaText: "Shop Now!",
    ctaHref: "/shop",
    links: [
      { id: "find-store", label: "Find a Store", href: "/#store-locator", isImplemented: true },
      { id: "faqs", label: "FAQs", href: "/#faqs", isImplemented: false },
      { id: "subscribe", label: "Subscribe", href: "/#newsletter-section", isImplemented: true },
    ],
    showPhone: true,
    showPromotion: true,
    showLinks: true,
  },
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "admin@peralagae.com",
};

const mockHistory: NavbarHistoryItem[] = [
  {
    id: "hist_1",
    section: "full",
    snapshot: { ...mockInitialSettings },
    description: "Initial baseline published configuration",
    version: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "admin@peralagae.com",
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Navbar Management Module (Frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
      email: "admin@peralagae.com",
      role: "admin",
    });
    vi.spyOn(navbarAdminService, "fetchAdminNavbarSettings").mockResolvedValue(mockInitialSettings);
    vi.spyOn(navbarAdminService, "fetchAdminNavbarHistory").mockResolvedValue(mockHistory);
  });

  describe("1. Page Header & Tab Layout", () => {
    it("renders page title, description, and three management tabs", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Navbar Management" })).toBeInTheDocument();
        expect(
          screen.getByText(/manage the storefront announcement bar and secondary navigation bar/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^top bar/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /content history/i })).toBeInTheDocument();
      });
    });

    it("redirects unauthenticated users to /?auth=login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
      });
    });
  });

  describe("2. Top Bar Management", () => {
    it("populates existing announcement text and displays live storefront preview", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/announcement text/i) as HTMLTextAreaElement;
        expect(textarea.value).toBe("SUMMER SALE, Get 40% Off for all products.");
        expect(screen.getByText("Live Storefront Preview")).toBeInTheDocument();
      });
    });

    it("allows updating announcement text, shows unsaved changes badge, and publishes via API", async () => {
      const updateSpy = vi.spyOn(navbarAdminService, "updateAdminTopBar").mockResolvedValue({
        ...mockInitialSettings,
        topBar: {
          ...mockInitialSettings.topBar,
          text: "WINTER FESTIVAL SALE 50% OFF",
        },
        version: 2,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/announcement text/i)).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText(/announcement text/i);
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "WINTER FESTIVAL SALE 50% OFF");

      // Verify unsaved indicator appears
      expect(screen.getByText(/previewing unsaved changes/i)).toBeInTheDocument();

      const saveButton = screen.getByRole("button", { name: /save & publish changes/i });
      expect(saveButton).not.toBeDisabled();
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            text: "WINTER FESTIVAL SALE 50% OFF",
          })
        );
        expect(screen.getByText(/top bar published successfully/i)).toBeInTheDocument();
      });
    });

    it("resets changes when cancel button is clicked", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/announcement text/i)).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText(/announcement text/i) as HTMLTextAreaElement;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Temporary unsaved text");

      const cancelButton = screen.getByRole("button", { name: /cancel changes/i });
      await userEvent.click(cancelButton);

      expect(textarea.value).toBe(mockInitialSettings.topBar.text);
      expect(screen.getByText(/top bar changes discarded/i)).toBeInTheDocument();
    });
  });

  describe("3. Second Navbar Management", () => {
    it("switches to Second Navbar tab and renders phone, promo, and secondary links", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      expect(screen.getByLabelText(/contact phone number/i)).toHaveValue("+91 98765 43210");
      expect(screen.getByLabelText(/promotional message/i)).toHaveValue("Summer Sale 15% off!");
      expect(screen.getByDisplayValue("Find a Store")).toBeInTheDocument();
      expect(screen.getByDisplayValue("FAQs")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Subscribe")).toBeInTheDocument();
    });

    it("allows adding a new secondary link", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      const labelInput = screen.getByPlaceholderText(/new link label/i);
      const hrefInput = screen.getByPlaceholderText(/destination url/i);
      const addBtn = screen.getByRole("button", { name: /add link/i });

      await userEvent.type(labelInput, "Custom Ring Designs");
      await userEvent.type(hrefInput, "/custom-rings");
      await userEvent.click(addBtn);

      expect(screen.getByDisplayValue("Custom Ring Designs")).toBeInTheDocument();
    });
  });

  describe("4. Content History & Version Restoration", () => {
    it("switches to Content History tab and lists historical snapshots", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /content history/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /content history/i }));

      expect(screen.getByText("Content Version History")).toBeInTheDocument();
      expect(screen.getByText("v1 Published")).toBeInTheDocument();
      expect(screen.getByText("Initial baseline published configuration")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /restore/i })).toBeInTheDocument();
    });

    it("opens snapshot preview modal when Preview button is clicked", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /content history/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /content history/i }));
      await userEvent.click(screen.getByRole("button", { name: /preview/i }));

      expect(screen.getByText("Snapshot Preview: v1")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /close preview/i })).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /close preview/i }));
      expect(screen.queryByText("Snapshot Preview: v1")).not.toBeInTheDocument();
    });

    it("opens confirmation dialog and restores version via API", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialSettings,
        version: 2,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /content history/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /content history/i }));
      await userEvent.click(screen.getByRole("button", { name: /restore/i }));

      expect(screen.getByText("Confirm Version Restoration")).toBeInTheDocument();
      expect(
        screen.getByText(/a pre-restore backup will be created automatically/i)
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /confirm & restore/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(restoreSpy).toHaveBeenCalledWith("hist_1");
        expect(screen.getByText(/version 1 successfully restored/i)).toBeInTheDocument();
      });
    });
  });
});
