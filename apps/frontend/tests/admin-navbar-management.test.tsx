import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminNavbarPage from "@/app/admin/navbar/page";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import * as adminAuthService from "@/services/admin-auth-service";
import * as navbarAdminService from "@/services/navbar-admin-service";
import * as heroAdminService from "@/services/hero-admin-service";
import * as categoryPublicService from "@/services/category-public-service";
import type { NavbarSettingsData, NavbarHistoryItem } from "@/types/navbar";
import {
  defaultHeroSettingsData,
  type HeroSettingsData,
  type HeroHistoryItem,
} from "@/types/hero";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/navbar",
}));

const mockInitialNavbarSettings: NavbarSettingsData = {
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
    snapshot: { ...mockInitialNavbarSettings, topBarVersion: 2 },
    description: "Top bar update v2",
    version: 2,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_top_1",
    section: "TOP_BAR",
    snapshot: {
      ...mockInitialNavbarSettings,
      topBar: {
        ...mockInitialNavbarSettings.topBar,
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
    snapshot: { ...mockInitialNavbarSettings, secondNavbarVersion: 1 },
    description: "Initial baseline Second Navbar promo",
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist_sec_older",
    section: "SECOND_NAVBAR",
    snapshot: {
      ...mockInitialNavbarSettings,
      secondNavbar: {
        ...mockInitialNavbarSettings.secondNavbar,
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

const mockInitialHeroSettings: HeroSettingsData = {
  ...defaultHeroSettingsData,
  heroImage1Version: 1,
  heroImage2Version: 1,
  heroImage3Version: 1,
  heroImage1: {
    ...defaultHeroSettingsData.heroImage1,
    imageUrl: "/images/hero-1.jpg",
    imageAlt: "Necklaces & Body Jewels - PERALAGAE",
    normalHeadline: "Necklaces &",
    boldHeadline: "Body Jewels",
    description: "Look to our new season collection for girls.",
  },
  heroImage2: {
    ...defaultHeroSettingsData.heroImage2,
    imageUrl: "/images/hero-2.jpg",
    imageAlt: "Just Lunched Bangles - PERALAGAE",
    normalHeadline: "Just Lunched",
    boldHeadline: "Bangles",
  },
  heroImage3: {
    ...defaultHeroSettingsData.heroImage3,
    imageUrl: "/images/hero-3.jpg",
    imageAlt: "Jewelry & Rings - PERALAGAE",
    normalHeadline: "Jewelry &",
    boldHeadline: "Rings",
  },
};

const mockHero1History: HeroHistoryItem[] = [
  {
    id: "h1_v1",
    slotId: "heroImage1",
    version: 1,
    imageUrl: "/images/hero-1.jpg",
    normalHeadline: "Necklaces &",
    boldHeadline: "Body Jewels",
    description: "Look to our new season collection for girls.",
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "h1_v0",
    slotId: "heroImage1",
    version: 0,
    imageUrl: "/images/hero-1-old.jpg",
    normalHeadline: "Vintage Necklaces &",
    boldHeadline: "Fine Jewels",
    description: "Old collection description.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "admin@peralagae.com",
  },
];

const mockHero2History: HeroHistoryItem[] = [
  {
    id: "h2_v1",
    slotId: "heroImage2",
    version: 1,
    imageUrl: "/images/hero-2.jpg",
    normalHeadline: "Just Lunched",
    boldHeadline: "Bangles",
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
];

const mockHero3History: HeroHistoryItem[] = [
  {
    id: "h3_v1",
    slotId: "heroImage3",
    version: 1,
    imageUrl: "/images/hero-3.jpg",
    normalHeadline: "Jewelry &",
    boldHeadline: "Rings",
    createdAt: new Date().toISOString(),
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

    vi.spyOn(categoryPublicService, "fetchPublicCategories").mockResolvedValue([
      { id: "cat-necklaces", name: "NECKLACES", slug: "necklaces", isActive: true },
      { id: "cat-rings", name: "RINGS", slug: "rings", isActive: true },
      { id: "cat-bracelets", name: "BRACELETS", slug: "bracelets", isActive: true },
      { id: "cat-earrings", name: "EARRINGS", slug: "earrings", isActive: true },
      { id: "cat-charms", name: "Charms & Bangles", slug: "charms-bangles", isActive: true },
      { id: "cat-gift", name: "Gift Ideas", slug: "gift-ideas", isActive: true },
    ] as any);

    vi.spyOn(navbarAdminService, "fetchAdminNavbarSettings").mockResolvedValue(
      mockInitialNavbarSettings
    );
    vi.spyOn(navbarAdminService, "fetchAdminNavbarHistory").mockImplementation(
      async (section?: string) => {
        if (section === "top_bar") return mockTopBarHistory;
        if (section === "second_navbar") return mockSecondNavbarHistory;
        return [...mockTopBarHistory, ...mockSecondNavbarHistory];
      }
    );

    vi.spyOn(heroAdminService, "fetchAdminHeroSettings").mockResolvedValue(
      mockInitialHeroSettings
    );
    vi.spyOn(heroAdminService, "fetchAdminHeroHistory").mockImplementation(
      async (slotId?: string) => {
        if (slotId === "heroImage1") return mockHero1History;
        if (slotId === "heroImage2") return mockHero2History;
        if (slotId === "heroImage3") return mockHero3History;
        return [];
      }
    );

    vi.spyOn(heroAdminService, "updateAdminHeroSlot").mockImplementation(
      async (slotId, payload) => ({
        ...mockInitialHeroSettings,
        [slotId]: {
          ...mockInitialHeroSettings[slotId],
          ...payload,
        },
        [`${slotId}Version`]:
          (mockInitialHeroSettings[`${slotId}Version` as keyof HeroSettingsData] as number) + 1,
      })
    );

    vi.spyOn(heroAdminService, "uploadAdminHeroImage").mockResolvedValue({
      url: "/uploads/hero/hero-new-uploaded.jpg",
      filename: "hero-new-uploaded.jpg",
      mimetype: "image/jpeg",
      size: 102400,
    });

    vi.spyOn(heroAdminService, "restoreAdminHeroSlot").mockImplementation(
      async (slotId, _version) => ({
        ...mockInitialHeroSettings,
        [slotId]: {
          ...mockInitialHeroSettings[slotId],
          normalHeadline: "Vintage Necklaces &",
          boldHeadline: "Fine Jewels",
        },
        [`${slotId}Version`]:
          (mockInitialHeroSettings[`${slotId}Version` as keyof HeroSettingsData] as number) + 1,
      })
    );
  });

  describe("1. Page Header & Nested Section Structure", () => {
    it("renders Section A (Top Bar, Second Navbar) and Section B (Hero Image 1, 2, 3) inside Header management", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Header Management" })).toBeInTheDocument();
        expect(
          screen.getByText(/manage the storefront announcement bar, secondary navigation bar, and hero banners/i)
        ).toBeInTheDocument();
      });

      // Section A headers and tabs
      expect(screen.getByText(/section a: navbar settings/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^top bar/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^second navbar/i })).toBeInTheDocument();

      // Section B headers and tabs
      expect(screen.getByText(/section b: hero section/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^hero image 1/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^hero image 2/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^hero image 3/i })).toBeInTheDocument();

      // No separate standalone history tab
      expect(screen.queryByRole("button", { name: /version history/i })).not.toBeInTheDocument();
    });

    it("verifies sidebar navigation contains only Dashboard and Header Management, with NO Hero Images item", () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /header management/i })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /hero/i })).not.toBeInTheDocument();
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
        expect(screen.queryByTitle(/desktop view/i)).not.toBeInTheDocument();
        expect(screen.queryByTitle(/mobile view/i)).not.toBeInTheDocument();
      });
    });

    it("allows updating announcement text, shows unsaved changes badge, and publishes via API", async () => {
      const updateSpy = vi.spyOn(navbarAdminService, "updateAdminTopBar").mockResolvedValue({
        ...mockInitialNavbarSettings,
        topBar: {
          ...mockInitialNavbarSettings.topBar,
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

      expect(textarea.value).toBe(mockInitialNavbarSettings.topBar.text);
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
        ...mockInitialNavbarSettings,
        secondNavbar: {
          ...mockInitialNavbarSettings.secondNavbar,
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

      expect(screen.getByText("Current Live: v2")).toBeInTheDocument();
      expect(screen.getByText("Active Live")).toBeInTheDocument();
      expect(screen.getByText(/FALL SPECIAL SALE 30% OFF/i)).toBeInTheDocument();
      expect(screen.queryByText(/Summer Sale 15% off!/i)).not.toBeInTheDocument();
    });

    it("restores Top Bar version via API upon Confirm & Publish", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialNavbarSettings,
        topBar: {
          ...mockInitialNavbarSettings.topBar,
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
      expect(screen.getByText("Current Live: v1")).toBeInTheDocument();
      expect(screen.getByText(/Old Festive Discount 20%/i)).toBeInTheDocument();
      expect(screen.queryByText(/FALL SPECIAL SALE 30% OFF/i)).not.toBeInTheDocument();
    });

    it("restores Second Navbar version with section='second_navbar' and preserves Top Bar", async () => {
      const restoreSpy = vi.spyOn(navbarAdminService, "restoreAdminNavbarVersion").mockResolvedValue({
        ...mockInitialNavbarSettings,
        secondNavbar: {
          ...mockInitialNavbarSettings.secondNavbar,
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

  describe("6. Section B: Hero Image 1 Tab Management", () => {
    it("exposes permitted fields: Image, Normal headline, Bold headline, and Short description", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-1"));

      expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("hero1-normal-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero1-bold-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero1-category-select")).toBeInTheDocument();
      expect(screen.getByTestId("hero1-description-input")).toBeInTheDocument();
      expect(screen.getByText(/896 × 1200 px/i)).toBeInTheDocument();
    });

    it("displays independent Hero Image 1 Version History with Current Live indicator", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-1"));

      expect(screen.getByRole("heading", { name: "Hero Image 1 Version History" })).toBeInTheDocument();
      expect(screen.getByText("Published live as v1")).toBeInTheDocument();
      expect(screen.getByText(/Necklaces & Body Jewels/i)).toBeInTheDocument();
      expect(screen.getByText(/Vintage Necklaces & Fine Jewels/i)).toBeInTheDocument();
    });

    it("publishes Hero Image 1 updates independently without modifying Hero 2 or Hero 3", async () => {
      const user = userEvent.setup();
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("tab-hero-image-1"));

      const normalInput = screen.getByTestId("hero1-normal-headline-input");
      await user.clear(normalInput);
      await user.type(normalInput, "Exclusive Pendants &");

      const saveBtn = screen.getByTestId("hero1-save-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(heroAdminService.updateAdminHeroSlot).toHaveBeenCalledWith(
          "heroImage1",
          expect.objectContaining({
            normalHeadline: "Exclusive Pendants &",
          })
        );
        expect(screen.getByText(/Hero Image 1 published successfully \(v2\)/i)).toBeInTheDocument();
      });
    });

    it("dynamically populates Category dropdown and saves selected categoryId and categorySlug", async () => {
      const user = userEvent.setup();
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("tab-hero-image-1"));

      const categorySelect = screen.getByTestId("hero1-category-select") as HTMLSelectElement;
      expect(categorySelect).toBeInTheDocument();

      // Verify category options populated dynamically without hardcoded counts or slugs
      expect(screen.getByRole("option", { name: "Necklaces" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Rings" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Bracelets" })).toBeInTheDocument();

      // Change category to Rings
      await user.selectOptions(categorySelect, "cat-rings");
      expect(categorySelect.value).toBe("cat-rings");

      const saveBtn = screen.getByTestId("hero1-save-button");
      expect(saveBtn).not.toBeDisabled();
      await user.click(saveBtn);

      await waitFor(() => {
        expect(heroAdminService.updateAdminHeroSlot).toHaveBeenCalledWith(
          "heroImage1",
          expect.objectContaining({
            categoryId: "cat-rings",
            categorySlug: "rings",
          })
        );
      });
    });

    it("restores historical Hero Image 1 snapshot with confirmation modal and pre-restore backup", async () => {
      const user = userEvent.setup();
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("tab-hero-image-1"));

      const restoreButtons = screen.getAllByRole("button", { name: /^restore$/i });
      await user.click(restoreButtons[0]);

      expect(screen.getByRole("heading", { name: /confirm hero image 1 restoration/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Your current live version will be backed up in history before restoration is completed/i)
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /confirm & publish/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(heroAdminService.restoreAdminHeroSlot).toHaveBeenCalledWith("heroImage1", 0);
        expect(screen.getByText(/hero image 1 restored to historical v0/i)).toBeInTheDocument();
      });
    });
  });

  describe("7. Section B: Hero Image 2 Tab Management", () => {
    it("exposes Image, Normal headline, and Bold headline, but NO description field", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-2")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-2"));

      expect(screen.getByTestId("hero-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("hero2-normal-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero2-bold-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero2-category-select")).toBeInTheDocument();
      // Description must NOT exist on Hero Image 2
      expect(screen.queryByTestId("hero2-description-input")).not.toBeInTheDocument();
      expect(screen.getByText(/1376 × 768 px/i)).toBeInTheDocument();
    });

    it("displays independent Hero Image 2 Version History", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-2")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-2"));

      expect(screen.getByRole("heading", { name: "Hero Image 2 Version History" })).toBeInTheDocument();
      expect(screen.getByText(/Just Lunched Bangles/i)).toBeInTheDocument();
      expect(screen.queryByText(/Vintage Necklaces & Fine Jewels/i)).not.toBeInTheDocument();
    });
  });

  describe("8. Section B: Hero Image 3 Tab Management", () => {
    it("exposes Image, Normal headline, and Bold headline, but NO description field", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-3")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-3"));

      expect(screen.getByTestId("hero-card-3")).toBeInTheDocument();
      expect(screen.getByTestId("hero3-normal-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero3-bold-headline-input")).toBeInTheDocument();
      expect(screen.getByTestId("hero3-category-select")).toBeInTheDocument();
      // Description must NOT exist on Hero Image 3
      expect(screen.queryByTestId("hero3-description-input")).not.toBeInTheDocument();
      expect(screen.getByText(/1376 × 768 px/i)).toBeInTheDocument();
    });

    it("displays independent Hero Image 3 Version History", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-3")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-3"));

      expect(screen.getByRole("heading", { name: "Hero Image 3 Version History" })).toBeInTheDocument();
      expect(screen.getByText(/Jewelry & Rings/i)).toBeInTheDocument();
      expect(screen.queryByText(/Just Lunched Bangles/i)).not.toBeInTheDocument();
    });
  });

  describe("9. Image Upload Client-Side Validation", () => {
    it("validates file format and displays error for invalid types", async () => {
      renderWithClient(<AdminNavbarPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-hero-image-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("tab-hero-image-1"));

      const invalidFile = new File(["dummy text"], "doc.pdf", { type: "application/pdf" });
      const fileInput = document.getElementById("hero-image-1-upload") as HTMLInputElement;

      Object.defineProperty(fileInput, "files", {
        value: [invalidFile],
        writable: true,
      });
      await waitFor(() => {
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(
        screen.getByText(/Invalid file format\. Please upload a JPEG, PNG, or WebP image\./i)
      ).toBeInTheDocument();
    });
  });
});
