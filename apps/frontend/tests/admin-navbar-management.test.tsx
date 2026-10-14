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
  topBarVersion: 2,
  secondNavbarVersion: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "admin@peralagae.com",
};

const mockTopBarHistory: NavbarHistoryItem[] = [
  {
    id: "hist_top_2",
    section: "TOP_BAR",
    snapshot: { ...mockInitialSettings, topBarVersion: 2 },
    description: "Top bar update v2",
    version: 2,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_top_1",
    section: "TOP_BAR",
    snapshot: {
      ...mockInitialSettings,
      topBar: {
        ...mockInitialSettings.topBar,
        text: "FALL SPECIAL SALE 30% OFF",
      },
      topBarVersion: 1,
    },
    description: "Initial baseline Top Bar",
    version: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "admin@peralagae.com",
  },
];

const mockSecondNavbarHistory: NavbarHistoryItem[] = [
  {
    id: "hist_sec_1",
    section: "SECOND_NAVBAR",
    snapshot: { ...mockInitialSettings, secondNavbarVersion: 1 },
    description: "Initial baseline Second Navbar promo",
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_sec_older",
    section: "SECOND_NAVBAR",
    snapshot: {
      ...mockInitialSettings,
      secondNavbar: {
        ...mockInitialSettings.secondNavbar,
        promoText: "Old Festive Discount 20%",
      },
      secondNavbarVersion: 0,
    },
    description: "Older Second Navbar promo",
    version: 0,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
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
    vi.spyOn(navbarAdminService, "fetchAdminNavbarHistory").mockImplementation(async (section?: string) => {
      if (section === "top_bar") return mockTopBarHistory;
      if (section === "second_navbar") return mockSecondNavbarHistory;
      return [...mockTopBarHistory, ...mockSecondNavbarHistory];
    });
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
        topBarVersion: 3,
        version: 3,
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
        expect(screen.getByText(/top bar published successfully as v3/i)).toBeInTheDocument();
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

  describe("3. Second Navbar Management — Promotional Message Only", () => {
    it("renders ONLY Promotional Message editor and removes phone, CTA, and secondary links controls", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      // Promotional message input is present and populated
      const promoInput = screen.getByLabelText(/promotional message/i) as HTMLInputElement;
      expect(promoInput).toBeInTheDocument();
      expect(promoInput.value).toBe("Summer Sale 15% off!");

      // Removed fields must NOT exist in the editing interface
      expect(screen.queryByLabelText(/contact phone number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/phone link destination/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/show phone/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cta label/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cta url/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/secondary navigation links/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /add link/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/move up/i)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/remove link/i)).not.toBeInTheDocument();

      // Live Storefront preview still renders phone, CTA, and secondary links from active settings
      expect(screen.getByText("+91 98765 43210")).toBeInTheDocument();
      expect(screen.getByText("Shop Now!")).toBeInTheDocument();
      expect(screen.getByText("Find a Store")).toBeInTheDocument();
      expect(screen.getByText("FAQs")).toBeInTheDocument();
      expect(screen.getByText("Subscribe")).toBeInTheDocument();
    });

    it("displays character counter and updates live preview dynamically as administrator types", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      // Character counter matches initial length
      expect(screen.getByText("20/120")).toBeInTheDocument();

      const promoInput = screen.getByLabelText(/promotional message/i);
      await userEvent.clear(promoInput);
      await userEvent.type(promoInput, "Akshaya Tritiya Gold Offer");

      expect(screen.getByText("26/120")).toBeInTheDocument();
      expect(screen.getByText(/previewing unsaved changes/i)).toBeInTheDocument();
    });

    it("resets promotional message when cancel changes is clicked", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      const promoInput = screen.getByLabelText(/promotional message/i) as HTMLInputElement;
      await userEvent.clear(promoInput);
      await userEvent.type(promoInput, "Unsaved temporary promo");

      const cancelBtn = screen.getByRole("button", { name: /cancel changes/i });
      await userEvent.click(cancelBtn);

      expect(promoInput.value).toBe("Summer Sale 15% off!");
      expect(screen.getByText(/second navbar changes discarded/i)).toBeInTheDocument();
    });

    it("publishes updated promotional message via updateAdminSecondNavbar without altering other fields", async () => {
      const updateSecondSpy = vi.spyOn(navbarAdminService, "updateAdminSecondNavbar").mockResolvedValue({
        ...mockInitialSettings,
        secondNavbar: {
          ...mockInitialSettings.secondNavbar,
          promoText: "Diwali Dhamaka 25% Off Jewellery",
        },
        secondNavbarVersion: 2,
        version: 2,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      const promoInput = screen.getByLabelText(/promotional message/i);
      await userEvent.clear(promoInput);
      await userEvent.type(promoInput, "Diwali Dhamaka 25% Off Jewellery");

      const saveBtn = screen.getByRole("button", { name: /save & publish changes/i });
      await userEvent.click(saveBtn);

      await waitFor(() => {
        expect(updateSecondSpy).toHaveBeenCalledWith({
          promoText: "Diwali Dhamaka 25% Off Jewellery",
        });
        expect(
          screen.getByText(/second navbar published successfully as v2/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("4. Top Bar Tab — Inline Version History & Independent Current Live", () => {
    it("displays Top Bar Version History with its own Current Live indicator", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Top Bar Version History" })).toBeInTheDocument();
      });

      // Top Bar specific indicator
      expect(screen.getByText("Current Live: v2")).toBeInTheDocument();
      expect(screen.getByText("Active Live")).toBeInTheDocument();
      expect(screen.getByText(/FALL SPECIAL SALE 30% OFF/i)).toBeInTheDocument();

      // Does not show Second Navbar snapshots
      expect(screen.queryByText(/Summer Sale 15% off!/i)).not.toBeInTheDocument();
    });

    it("restores Top Bar version via API upon Confirm & Publish", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialSettings,
        topBar: {
          ...mockInitialSettings.topBar,
          text: "FALL SPECIAL SALE 30% OFF",
        },
        topBarVersion: 3,
        version: 3,
      });

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

      const confirmBtn = screen.getByRole("button", { name: /confirm & publish/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(restoreSpy).toHaveBeenCalledWith("hist_top_1", "top_bar");
        expect(screen.getByText(/version 1 of the top bar successfully restored/i)).toBeInTheDocument();
      });
    });
  });

  describe("5. Second Navbar Tab — Inline Version History & Independent Current Live", () => {
    it("displays Second Navbar Version History with promotional message only and independent Current Live: v1", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      expect(screen.getByRole("heading", { name: "Second Navbar Version History" })).toBeInTheDocument();

      // Second Navbar specific Current Live indicator reflecting v1
      expect(screen.getByText("Current Live: v1")).toBeInTheDocument();

      // Content summary shows promotional message
      expect(screen.getByText(/Old Festive Discount 20%/i)).toBeInTheDocument();

      // Summary does NOT show phone or link count strings
      expect(screen.queryByText(/secondary link\(s\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Phone: \+91/i)).not.toBeInTheDocument();

      // Does not show Top Bar snapshots
      expect(screen.queryByText(/FALL SPECIAL SALE 30% OFF/i)).not.toBeInTheDocument();
    });

    it("restores Second Navbar version with section='second_navbar' and preserves Top Bar", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialSettings,
        secondNavbar: {
          ...mockInitialSettings.secondNavbar,
          promoText: "Old Festive Discount 20%",
        },
        secondNavbarVersion: 2,
        version: 2,
      });

      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /^second navbar/i }));

      const restoreButtons = screen.getAllByRole("button", { name: /^restore$/i });
      await userEvent.click(restoreButtons[0]);

      expect(screen.getByRole("heading", { name: "Restore This Version?" })).toBeInTheDocument();
      expect(
        screen.getByText(/you are about to restore this previous version of the second navbar/i)
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /confirm & publish/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(restoreSpy).toHaveBeenCalledWith("hist_sec_older", "second_navbar");
        expect(
          screen.getByText(/version 0 of the second navbar successfully restored/i)
        ).toBeInTheDocument();
      });
    });
  });
});
