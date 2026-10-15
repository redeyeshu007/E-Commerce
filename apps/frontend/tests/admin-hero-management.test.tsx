import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminHeroPage from "@/app/admin/hero/page";
import * as adminAuthService from "@/services/admin-auth-service";
import * as heroAdminService from "@/services/hero-admin-service";
import { defaultHeroSettingsData, type HeroSettingsData } from "@/types/hero";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/hero",
}));

const mockInitialHeroSettings: HeroSettingsData = {
  ...defaultHeroSettingsData,
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "admin@peralagae.com",
};

describe("Admin Hero Images Management Component Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
      id: "admin-1",
      email: "admin@peralagae.com",
      role: "admin",
    });

    vi.spyOn(heroAdminService, "fetchAdminHeroSettings").mockResolvedValue(
      mockInitialHeroSettings
    );

    vi.spyOn(heroAdminService, "updateAdminHeroSettings").mockImplementation(
      async (payload) => ({
        ...mockInitialHeroSettings,
        heroImage1: {
          ...mockInitialHeroSettings.heroImage1,
          ...payload.heroImage1,
        },
        heroImage2: {
          ...mockInitialHeroSettings.heroImage2,
          ...payload.heroImage2,
        },
        heroImage3: {
          ...mockInitialHeroSettings.heroImage3,
          ...payload.heroImage3,
        },
        version: mockInitialHeroSettings.version + 1,
      })
    );

    vi.spyOn(heroAdminService, "uploadAdminHeroImage").mockResolvedValue({
      url: "/uploads/hero/hero-new-uploaded.jpg",
      filename: "hero-new-uploaded.jpg",
      mimetype: "image/jpeg",
      size: 102400,
    });
  });

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminHeroPage />
      </QueryClientProvider>
    );
  }

  describe("1. Initial Rendering & Layout Inspection", () => {
    it("renders page heading, version indicator, and guidance banner", async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Hero Images Management" })
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Version 1")).toBeInTheDocument();
      expect(
        screen.getByText(/Independently customize the 3 homepage promotional hero slots/i)
      ).toBeInTheDocument();
    });

    it("displays exactly three cards for the three hero slots", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      });

      expect(screen.getByTestId("hero-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("hero-card-3")).toBeInTheDocument();

      expect(screen.getByText("Card 1 — Hero Image 1")).toBeInTheDocument();
      expect(screen.getByText("Card 2 — Hero Image 2")).toBeInTheDocument();
      expect(screen.getByText("Card 3 — Hero Image 3")).toBeInTheDocument();
    });

    it("displays read-only recommended dimensions and aspect ratios based on actual implementation", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      });

      // Card 1 spec pill
      expect(screen.getByText(/896 × 1200 px \(~3:4 Portrait\)/i)).toBeInTheDocument();

      // Card 2 & 3 spec pills
      const landscapePills = screen.getAllByText(/1376 × 768 px \(~16:9 Landscape\)/i);
      expect(landscapePills).toHaveLength(2);
    });

    it("only Card 1 has a short description textarea, Card 2 and 3 do NOT", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      });

      // Hero 1 description exists
      expect(screen.getByTestId("hero1-description-input")).toBeInTheDocument();

      // Card 2 and Card 3 must not have description inputs
      expect(screen.queryByTestId("hero2-description-input")).not.toBeInTheDocument();
      expect(screen.queryByTestId("hero3-description-input")).not.toBeInTheDocument();
    });
  });

  describe("2. Independent Slot Editing", () => {
    it("editing Hero Image 1 headline does NOT modify Hero Image 2 or 3 inputs", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero1-normal-headline-input")).toBeInTheDocument();
      });

      const hero1Input = screen.getByTestId("hero1-normal-headline-input");
      const hero2Input = screen.getByTestId("hero2-normal-headline-input");
      const hero3Input = screen.getByTestId("hero3-normal-headline-input");

      expect(hero1Input).toHaveValue("Necklaces &");
      expect(hero2Input).toHaveValue("Just Lunched");
      expect(hero3Input).toHaveValue("Jewelry &");

      await user.clear(hero1Input);
      await user.type(hero1Input, "Handmade Rings &");

      expect(hero1Input).toHaveValue("Handmade Rings &");
      expect(hero2Input).toHaveValue("Just Lunched");
      expect(hero3Input).toHaveValue("Jewelry &");
    });
  });

  describe("3. Cancel Changes Action", () => {
    it("discards unsaved modifications and reverts inputs to saved values", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero1-bold-headline-input")).toBeInTheDocument();
      });

      const hero1Bold = screen.getByTestId("hero1-bold-headline-input");
      const cancelBtn = screen.getByTestId("hero-cancel-changes-button");

      expect(cancelBtn).toBeDisabled();

      await user.clear(hero1Bold);
      await user.type(hero1Bold, "Diamond Necklaces");

      expect(cancelBtn).not.toBeDisabled();

      await user.click(cancelBtn);

      expect(hero1Bold).toHaveValue("Body Jewels");
      expect(cancelBtn).toBeDisabled();
      expect(
        screen.getByText(/Unsaved changes discarded\. Form reverted to last published configuration\./i)
      ).toBeInTheDocument();
    });
  });

  describe("4. Image Upload & Client-Side Validation", () => {
    it("displays error message when an invalid file type is selected", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      });

      const invalidFile = new File(["fake text"], "report.txt", { type: "text/plain" });
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

    it("displays error message when a file exceeding 5MB is selected", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-2")).toBeInTheDocument();
      });

      // Create a 6MB dummy file
      const bigBuffer = new Uint8Array(6 * 1024 * 1024);
      const oversizedFile = new File([bigBuffer], "large-image.jpg", { type: "image/jpeg" });
      const fileInput = document.getElementById("hero-image-2-upload") as HTMLInputElement;

      await user.upload(fileInput, oversizedFile);

      expect(screen.getByText(/exceeds the maximum 5MB limit/i)).toBeInTheDocument();
    });

    it("displays 'Pending Publish Preview' badge when a valid replacement image is selected", async () => {
      const user = userEvent.setup();
      window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/hero-test-blob");
      window.URL.revokeObjectURL = vi.fn();

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero-card-1")).toBeInTheDocument();
      });

      const validImage = new File(["dummy image bits"], "valid-hero.jpg", {
        type: "image/jpeg",
      });
      const fileInput = document.getElementById("hero-image-1-upload") as HTMLInputElement;

      await user.upload(fileInput, validImage);

      expect(screen.getByText("Pending Publish Preview")).toBeInTheDocument();
    });
  });

  describe("5. Save & Publish Changes Workflow", () => {
    it("calls upload service for pending files, saves settings, and updates version", async () => {
      const user = userEvent.setup();
      window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/hero-test-blob");
      window.URL.revokeObjectURL = vi.fn();

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId("hero1-bold-headline-input")).toBeInTheDocument();
      });

      // Change Headline
      const hero1Bold = screen.getByTestId("hero1-bold-headline-input");
      await user.clear(hero1Bold);
      await user.type(hero1Bold, "New Diamond Collection");

      // Attach new image
      const validImage = new File(["dummy image bits"], "valid-hero.jpg", {
        type: "image/jpeg",
      });
      const fileInput = document.getElementById("hero-image-1-upload") as HTMLInputElement;
      await user.upload(fileInput, validImage);

      // Click Save & Publish Changes
      const saveBtn = screen.getByTestId("hero-save-publish-button");
      await user.click(saveBtn);

      await waitFor(() => {
        expect(heroAdminService.uploadAdminHeroImage).toHaveBeenCalledWith(validImage);
      });

      await waitFor(() => {
        expect(heroAdminService.updateAdminHeroSettings).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/Hero banner changes published successfully \(v2\)/i)
      ).toBeInTheDocument();
    });
  });

  describe("6. Authentication Guard", () => {
    it("redirects unauthenticated visitor to /?auth=login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(
        new Error("Session expired")
      );

      renderPage();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
      });
    });
  });
});
