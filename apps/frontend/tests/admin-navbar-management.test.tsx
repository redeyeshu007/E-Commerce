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
  version: 2,
  updatedAt: new Date().toISOString(),
  updatedBy: "admin@peralagae.com",
};

const mockHistory: NavbarHistoryItem[] = [
  {
    id: "hist_live",
    section: "full",
    snapshot: { ...mockInitialSettings, version: 2 },
    description: "Current live published configuration",
    version: 2,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_1",
    section: "full",
    snapshot: {
      ...mockInitialSettings,
      topBar: {
        ...mockInitialSettings.topBar,
        text: "FALL SPECIAL SALE 30% OFF",
      },
      secondNavbar: {
        ...mockInitialSettings.secondNavbar,
        promoText: "Fall Collection Exclusive Offer",
      },
      version: 1,
    },
    description: "Initial baseline published configuration",
    version: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_top_only",
    section: "top_bar",
    snapshot: {
      ...mockInitialSettings,
      topBar: {
        ...mockInitialSettings.topBar,
        text: "EXCLUSIVE TOP BAR ANNOUNCEMENT",
      },
      version: 3,
    },
    description: "Top bar update only",
    version: 3,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    createdBy: "editor@peralagae.com",
  },
  {
    id: "hist_second_only",
    section: "second_navbar",
    snapshot: {
      ...mockInitialSettings,
      secondNavbar: {
        ...mockInitialSettings.secondNavbar,
        promoText: "EXCLUSIVE SECOND NAVBAR BANNER",
      },
      version: 4,
    },
    description: "Second navbar update only",
    version: 4,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    createdBy: "editor@peralagae.com",
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
    it("renders page title, description, and two management tabs without standalone history tab", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Navbar Management" })).toBeInTheDocument();
        expect(
          screen.getByText(/manage the storefront announcement bar and secondary navigation bar/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^top bar/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /version history/i })).not.toBeInTheDocument();
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
    it("populates existing announcement text and displays live storefront preview without device toggle controls", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/announcement text/i) as HTMLTextAreaElement;
        expect(textarea.value).toBe("SUMMER SALE, Get 40% Off for all products.");
        expect(screen.getByText("Live Storefront Preview")).toBeInTheDocument();
        expect(screen.queryByTitle(/desktop view/i)).not.toBeInTheDocument();
        expect(screen.queryByTitle(/mobile view/i)).not.toBeInTheDocument();
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

  describe("4. Top Bar Tab — Inline Version History & Restore Workflow", () => {
    it("displays Top Bar Version History automatically below settings without navigating away", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      // Shows Top Bar versions
      expect(screen.getByText(/EXCLUSIVE TOP BAR ANNOUNCEMENT/i)).toBeInTheDocument();
      expect(screen.getByText(/FALL SPECIAL SALE 30% OFF/i)).toBeInTheDocument();
      // Does NOT show Second Navbar exclusive version in Top Bar history
      expect(screen.queryByText(/EXCLUSIVE SECOND NAVBAR BANNER/i)).not.toBeInTheDocument();

      // Identifies current live version
      expect(screen.getByText("Current Live: v2")).toBeInTheDocument();
      expect(screen.getByText("Active Live")).toBeInTheDocument();
    });

    it("does not render preview action buttons in Top Bar version history rows", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /^preview$/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/preview top bar version/i)).not.toBeInTheDocument();
    });

    it("opens confirmation dialog for Top Bar restore and cancels safely without changes", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByRole("button", { name: /^restore$/i });
      await userEvent.click(restoreButtons[0]);

      expect(screen.getByRole("heading", { name: "Restore This Version?" })).toBeInTheDocument();
      expect(
        screen.getByText(/you are about to restore this previous version of the top bar/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/the selected content will replace the current published content on the live peralagae website/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/your current live version will be saved in history before the restoration/i)
      ).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
      await userEvent.click(cancelBtn);

      expect(screen.queryByRole("heading", { name: "Restore This Version?" })).not.toBeInTheDocument();
    });

    it("restores Top Bar version via API upon Confirm & Publish", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialSettings,
        topBar: {
          ...mockInitialSettings.topBar,
          text: "FALL SPECIAL SALE 30% OFF",
        },
        version: 5,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByRole("button", { name: /^restore$/i });
      await userEvent.click(restoreButtons[0]); // restore hist_1

      const confirmBtn = screen.getByRole("button", { name: /confirm & publish/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(restoreSpy).toHaveBeenCalledWith("hist_1", "top_bar");
        expect(screen.getByText(/version 1 of the top bar successfully restored/i)).toBeInTheDocument();
      });
    });

    it("displays clean empty state when no Top Bar version history exists", async () => {
      vi.spyOn(navbarAdminService, "fetchAdminNavbarHistory").mockResolvedValue([]);

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      expect(screen.getByText("No previous Top Bar versions recorded yet.")).toBeInTheDocument();
      expect(
        screen.getByText("History will appear after the first successful publication.")
      ).toBeInTheDocument();
    });
  });

  describe("5. Second Navbar Tab — Inline Version History & Restore Workflow", () => {
    it("displays Second Navbar Version History automatically inside Second Navbar tab", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      expect(screen.getByRole("heading", { name: "Second Navbar Version History" })).toBeInTheDocument();
      // Shows Second Navbar versions
      expect(screen.getByText(/EXCLUSIVE SECOND NAVBAR BANNER/i)).toBeInTheDocument();
      expect(screen.getByText(/Fall Collection Exclusive Offer/i)).toBeInTheDocument();
      // Does NOT show Top Bar exclusive version
      expect(screen.queryByText("EXCLUSIVE TOP BAR ANNOUNCEMENT")).not.toBeInTheDocument();
    });

    it("does not render preview action buttons in Second Navbar version history rows", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      expect(screen.getByRole("heading", { name: "Second Navbar Version History" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^preview$/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/preview second navbar version/i)).not.toBeInTheDocument();
    });

    it("opens confirmation dialog for Second Navbar restore and calls API with section='second_navbar'", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialSettings,
        secondNavbar: {
          ...mockInitialSettings.secondNavbar,
          promoText: "Fall Collection Exclusive Offer",
        },
        version: 5,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      const restoreButtons = screen.getAllByRole("button", { name: /^restore$/i });
      await userEvent.click(restoreButtons[0]); // restore hist_1

      expect(screen.getByRole("heading", { name: "Restore This Version?" })).toBeInTheDocument();
      expect(
        screen.getByText(/you are about to restore this previous version of the second navbar/i)
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /confirm & publish/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(restoreSpy).toHaveBeenCalledWith("hist_1", "second_navbar");
        expect(screen.getByText(/version 1 of the second navbar successfully restored/i)).toBeInTheDocument();
      });
    });

    it("displays clean empty state when no Second Navbar version history exists", async () => {
      vi.spyOn(navbarAdminService, "fetchAdminNavbarHistory").mockResolvedValue([]);

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      expect(screen.getByText("No previous Second Navbar versions recorded yet.")).toBeInTheDocument();
      expect(
        screen.getByText("History will appear after the first successful publication.")
      ).toBeInTheDocument();
    });
  });
});
