import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  EditorialCollectionsSection,
  EditorialCollectionsSkeleton,
} from "@/components/home/editorial-collections";
import * as materialService from "@/services/material-service";
import type { MaterialSectionConfig, MaterialItem } from "@/types/material";

describe("PERALAGAE Materials Feature Suite (Frontend)", () => {
  const mockMaterials: MaterialItem[] = [
    {
      id: "mat-gold",
      name: "Gold",
      slug: "gold",
      description: "18k gold",
      order: 0,
      isActive: true,
      productCount: 18,
      createdAt: "2026-10-16T00:00:00.000Z",
      updatedAt: "2026-10-16T00:00:00.000Z",
    },
    {
      id: "mat-diamond",
      name: "Diamond",
      slug: "diamond",
      description: "Brilliant cut diamonds",
      order: 1,
      isActive: true,
      productCount: 0,
      createdAt: "2026-10-16T00:00:00.000Z",
      updatedAt: "2026-10-16T00:00:00.000Z",
    },
    {
      id: "mat-emerald",
      name: "Emerald",
      slug: "emerald",
      description: "Natural emeralds",
      order: 2,
      isActive: true,
      productCount: 0,
      createdAt: "2026-10-16T00:00:00.000Z",
      updatedAt: "2026-10-16T00:00:00.000Z",
    },
  ];

  const mockSectionData: MaterialSectionConfig = {
    id: "current",
    heading: "Designed in India. Crafted with timeless elegance.",
    version: 1,
    updatedAt: "2026-10-16T00:00:00.000Z",
    updatedBy: "admin",
    cards: [
      {
        id: "card-1",
        title: "Lab Grown Diamonds",
        description: "Discover the exceptional quality & sparkle.",
        ctaText: "EXPLORE NOW",
        imageUrl: "/images/editorial/lab-grown-diamonds.jpg",
        imageAlt: "Solitaire diamond ring",
        materialId: "mat-diamond",
        material: {
          id: "mat-diamond",
          name: "Diamond",
          slug: "diamond",
          isActive: true,
        },
        order: 0,
        isActive: true,
      },
      {
        id: "card-2",
        title: "Royal Gold Bands",
        description: "Timeless 18k solid gold bands.",
        ctaText: "SHOP COLLECTION",
        imageUrl: "/images/editorial/tennis-bracelets.jpg",
        imageAlt: "Gold jewellery collection",
        materialId: "mat-gold",
        material: {
          id: "mat-gold",
          name: "Gold",
          slug: "gold",
          isActive: true,
        },
        order: 1,
        isActive: true,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Strict Database-Only Rendering for Materials Editorial Section", () => {
    it("renders loading skeleton while database query is in flight", () => {
      // Mock pending fetch promise
      vi.spyOn(materialService, "fetchPublicMaterialsSection").mockImplementation(
        () => new Promise(() => {})
      );

      render(<EditorialCollectionsSection />);

      const skeleton = screen.getByRole("status", { name: /Loading materials collection/i });
      expect(skeleton).toBeInTheDocument();

      // Ensure NO mock/hardcoded card titles are displayed while loading
      expect(screen.queryByText("Lab Grown Diamonds")).not.toBeInTheDocument();
      expect(screen.queryByText("Tennis Bracelets")).not.toBeInTheDocument();
      expect(screen.queryByText("Garden Variety")).not.toBeInTheDocument();
    });

    it("renders error state with retry button when database request fails", async () => {
      vi.spyOn(materialService, "fetchPublicMaterialsSection").mockResolvedValue(null);

      render(<EditorialCollectionsSection />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText("Unable to Load Materials Collection")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry Loading/i })).toBeInTheDocument();

      // Never display static mock cards on error
      expect(screen.queryByText("Tennis Bracelets")).not.toBeInTheDocument();
    });

    it("renders empty state when database returns 0 active cards", async () => {
      vi.spyOn(materialService, "fetchPublicMaterialsSection").mockResolvedValue({
        id: "current",
        heading: "Boutique Materials Showcase",
        version: 1,
        updatedAt: "2026-10-16T00:00:00.000Z",
        cards: [],
      });

      render(<EditorialCollectionsSection />);

      await waitFor(() => {
        expect(screen.getByText("Boutique Materials Showcase")).toBeInTheDocument();
      });

      expect(screen.getByText("No material collections are currently active.")).toBeInTheDocument();
    });

    it("renders database-backed cards with destination URLs resolved from material relationships", async () => {
      vi.spyOn(materialService, "fetchPublicMaterialsSection").mockResolvedValue(mockSectionData);

      render(<EditorialCollectionsSection initialSection={mockSectionData} />);

      expect(screen.getByText("Designed in India. Crafted with timeless elegance.")).toBeInTheDocument();
      expect(screen.getByText("Lab Grown Diamonds")).toBeInTheDocument();
      expect(screen.getByText("Royal Gold Bands")).toBeInTheDocument();

      // Verify card 1 CTA navigates to the saved Diamond material collection URL
      const cta1 = screen.getByRole("link", { name: /EXPLORE NOW: Lab Grown Diamonds/i });
      expect(cta1).toHaveAttribute("href", "/shop?material=diamond");

      // Verify card 2 CTA navigates to the saved Gold material collection URL
      const cta2 = screen.getByRole("link", { name: /SHOP COLLECTION: Royal Gold Bands/i });
      expect(cta2).toHaveAttribute("href", "/shop?material=gold");
    });
  });

  describe("2. Live Admin Publication Subscription", () => {
    it("refetches and updates section when MATERIAL_SECTION_UPDATED_EVENT is dispatched", async () => {
      render(<EditorialCollectionsSection initialSection={mockSectionData} />);
      expect(screen.getByText("Designed in India. Crafted with timeless elegance.")).toBeInTheDocument();

      const fetchSpy = vi
        .spyOn(materialService, "fetchPublicMaterialsSection")
        .mockResolvedValue({
          ...mockSectionData,
          heading: "Newly Published Collection Tagline",
        });

      // Simulate publishing from admin dashboard
      window.dispatchEvent(new CustomEvent(materialService.MATERIAL_SECTION_UPDATED_EVENT));

      await waitFor(() => {
        expect(screen.getByText("Newly Published Collection Tagline")).toBeInTheDocument();
      });

      expect(fetchSpy).toHaveBeenCalled();
    });
  });
});
