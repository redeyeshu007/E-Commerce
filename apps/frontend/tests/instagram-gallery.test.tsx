import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  InstagramGallerySection,
  InstagramGalleryGrid,
  InstagramGalleryItemCard,
  InstagramGallerySkeleton,
} from "@/components/home/instagram-gallery";
import * as instagramService from "@/services/instagram-service";
import type { InstagramSectionConfig, InstagramImageItem } from "@/types/instagram";

const mockImages: InstagramImageItem[] = [
  {
    id: "img-1",
    imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg",
    altText: "18k gold rings",
    postUrl: null,
    order: 0,
    isActive: true,
  },
  {
    id: "img-2",
    imageUrl: "/images/instagram/insta-2-diamond-earrings.jpg",
    altText: "Diamond earrings",
    postUrl: "https://instagram.com/p/custom-link",
    order: 1,
    isActive: true,
  },
  {
    id: "img-3",
    imageUrl: "/images/instagram/insta-3-layered-necklaces.jpg",
    altText: "Layered necklaces",
    postUrl: null,
    order: 2,
    isActive: true,
  },
  {
    id: "img-4",
    imageUrl: "/images/instagram/insta-4-solitaire-ring.jpg",
    altText: "Solitaire ring",
    postUrl: null,
    order: 3,
    isActive: true,
  },
  {
    id: "img-5",
    imageUrl: "/images/instagram/insta-5-gold-earrings.jpg",
    altText: "Gold earrings",
    postUrl: null,
    order: 4,
    isActive: true,
  },
  {
    id: "img-6",
    imageUrl: "/images/instagram/insta-6-heritage-necklace.jpg",
    altText: "Heritage necklace",
    postUrl: null,
    order: 5,
    isActive: true,
  },
];

const mockConfig: InstagramSectionConfig = {
  id: "current",
  heading: "Follow Us on Instagram",
  handle: "@peralagaeofficial",
  profileUrl: "https://instagram.com/peralagaeofficial",
  isActive: true,
  version: 1,
  images: mockImages,
};

describe("Instagram Gallery Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("InstagramGallerySkeleton", () => {
    it("renders loading skeleton with pulse placeholders", () => {
      render(<InstagramGallerySkeleton />);
      expect(screen.getByTestId("instagram-gallery-skeleton")).toBeInTheDocument();
    });
  });

  describe("InstagramGalleryItemCard", () => {
    it("renders image with alt text and aspect-square container", () => {
      render(<InstagramGalleryItemCard item={mockImages[0]!} />);

      const img = screen.getByRole("img", { name: mockImages[0]!.altText! });
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toContain(encodeURIComponent(mockImages[0]!.imageUrl));
    });

    it("renders as link if postUrl is provided", () => {
      render(
        <InstagramGalleryItemCard
          item={mockImages[1]!}
          profileUrl="https://instagram.com/peralagaeofficial"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://instagram.com/p/custom-link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("falls back to profileUrl when postUrl is null", () => {
      render(
        <InstagramGalleryItemCard
          item={mockImages[0]!}
          profileUrl="https://instagram.com/peralagaeofficial"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://instagram.com/peralagaeofficial");
    });

    it("sanitizes unsafe javascript: URL schemes", () => {
      const unsafeItem: InstagramImageItem = {
        ...mockImages[0]!,
        postUrl: "javascript:alert('malicious')",
      };

      render(
        <InstagramGalleryItemCard
          item={unsafeItem}
          profileUrl="javascript:alert('bad_profile')"
        />
      );

      // Should not render as link with unsafe javascript: URL
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  describe("InstagramGalleryGrid", () => {
    it("renders all images with responsive grid classes", () => {
      render(
        <InstagramGalleryGrid
          items={mockImages}
          profileUrl="https://instagram.com/peralagaeofficial"
        />
      );

      const grid = screen.getByTestId("instagram-gallery-grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("sm:grid-cols-3");
      expect(grid).toHaveClass("lg:grid-cols-6");

      const images = screen.getAllByRole("img");
      expect(images.length).toBe(6);
    });

    it("supports more than 6 images dynamically", () => {
      const sevenImages = [
        ...mockImages,
        {
          id: "img-7",
          imageUrl: "/images/instagram/insta-7-extra.jpg",
          altText: "Extra diamond ring",
          postUrl: null,
          order: 6,
          isActive: true,
        },
      ];

      render(
        <InstagramGalleryGrid
          items={sevenImages}
          profileUrl="https://instagram.com/peralagaeofficial"
        />
      );

      const images = screen.getAllByRole("img");
      expect(images.length).toBe(7);
    });
  });

  describe("InstagramGallerySection", () => {
    it("renders exact heading 'Follow Us on Instagram' and configurable handle from initialConfig", () => {
      vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(mockConfig);

      render(<InstagramGallerySection initialConfig={mockConfig} />);

      const heading = screen.getByRole("heading", {
        name: "Follow Us on Instagram",
        level: 2,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", "instagram-gallery-heading");

      const handle = screen.getByTestId("instagram-handle-link");
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveTextContent("@peralagaeofficial");
    });

    it("renders handle as link when profileUrl is configured", () => {
      vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(mockConfig);

      render(<InstagramGallerySection initialConfig={mockConfig} />);

      const link = screen.getByTestId("instagram-handle-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://instagram.com/peralagaeofficial");
    });

    it("handles empty items array gracefully without rendering placeholder images", () => {
      const emptyConfig: InstagramSectionConfig = {
        ...mockConfig,
        images: [],
      };
      vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(emptyConfig);

      const { container } = render(
        <InstagramGallerySection initialConfig={emptyConfig} />
      );
      // Empty active images returns null to avoid flashing mock/placeholder images
      expect(container.firstChild).toBeNull();
    });

    it("supports custom heading and handle override from database", () => {
      const customConfig: InstagramSectionConfig = {
        ...mockConfig,
        heading: "Follow PERALAGAE on Instagram",
        handle: "@peralagae_fine_jewels",
      };
      vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(customConfig);

      render(<InstagramGallerySection initialConfig={customConfig} />);

      expect(
        screen.getByRole("heading", {
          name: "Follow PERALAGAE on Instagram",
          level: 2,
        })
      ).toBeInTheDocument();
      expect(screen.getByText("@peralagae_fine_jewels")).toBeInTheDocument();
    });

    it("loads data on mount when no initialConfig is provided", async () => {
      vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(mockConfig);

      render(<InstagramGallerySection />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Follow Us on Instagram" })).toBeInTheDocument();
      });
    });

    it("re-fetches when INSTAGRAM_SECTION_UPDATED_EVENT is dispatched", async () => {
      const fetchSpy = vi.spyOn(instagramService, "fetchPublicInstagramSection").mockResolvedValue(mockConfig);

      render(<InstagramGallerySection initialConfig={mockConfig} />);

      act(() => {
        window.dispatchEvent(new CustomEvent(instagramService.INSTAGRAM_SECTION_UPDATED_EVENT));
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
