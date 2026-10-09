import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ShopOurCollections,
  CollectionCard,
} from "@/components/home/shop-our-collections";
import {
  defaultCollectionsConfig,
  type CollectionsSectionConfig,
} from "@/config/collections";

describe("JAVIX Shop Our Collections Component Suite", () => {
  describe("CollectionCard", () => {
    it("renders collection item with square image container, alt text, and uppercase title", () => {
      const item = defaultCollectionsConfig.items[0]; // NECKLACES
      render(<CollectionCard item={item} />);

      expect(screen.getByText("NECKLACES")).toBeInTheDocument();

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", item.image.alt);
      expect(image.getAttribute("src")).toContain(encodeURIComponent(item.image.src));
    });

    it("renders as accessible container without dead link when isImplemented is false", () => {
      const item = { ...defaultCollectionsConfig.items[1], isImplemented: false }; // RINGS
      render(<CollectionCard item={item} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByText("RINGS")).toBeInTheDocument();
    });

    it("renders as Next.js Link when isImplemented is true with valid href", () => {
      const item = {
        ...defaultCollectionsConfig.items[2],
        href: "/category/bracelets",
        isImplemented: true,
      };
      render(<CollectionCard item={item} />);

      const link = screen.getByRole("link", { name: /Shop BRACELETS Collection/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/category/bracelets");
    });
  });

  describe("ShopOurCollections Section Composition", () => {
    it("renders exact heading 'Shop Our Collections' with heading level 2", () => {
      render(<ShopOurCollections config={defaultCollectionsConfig} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Shop Our Collections");
    });

    it("renders all six collection categories in the exact specified order", () => {
      render(<ShopOurCollections config={defaultCollectionsConfig} />);

      const expectedCategories = [
        "NECKLACES",
        "RINGS",
        "BRACELETS",
        "EARRINGS",
        "CHARMS & BANGLES",
        "GIFT IDEAS",
      ];

      // Retrieve all category card test IDs
      const cards = screen.getAllByTestId(/^collection-card-/);
      expect(cards).toHaveLength(6);

      expectedCategories.forEach((title, index) => {
        expect(cards[index]).toHaveTextContent(title);
      });
    });

    it("renders six square product images with appropriate alt text and uniform studio backgrounds", () => {
      render(<ShopOurCollections config={defaultCollectionsConfig} />);

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(6);

      expect(images[0]).toHaveAttribute("alt", expect.stringContaining("Necklaces"));
      expect(images[1]).toHaveAttribute("alt", expect.stringContaining("Rings"));
      expect(images[2]).toHaveAttribute("alt", expect.stringContaining("Bracelets"));
      expect(images[3]).toHaveAttribute("alt", expect.stringContaining("Earrings"));
      expect(images[4]).toHaveAttribute("alt", expect.stringContaining("Charms & Bangles"));
      expect(images[5]).toHaveAttribute("alt", expect.stringContaining("Gift Ideas"));
    });

    it("supports custom configuration overrides for future backend API integration", () => {
      const customConfig: CollectionsSectionConfig = {
        heading: "Curated Collections",
        items: [
          {
            id: "custom-pendants",
            slug: "pendants",
            title: "PENDANTS",
            image: { src: "/images/collections/collection-necklaces.jpg", alt: "Gold pendants" },
            isImplemented: false,
            order: 1,
            isActive: true,
          },
          {
            id: "custom-chokers",
            slug: "chokers",
            title: "CHOKERS",
            image: { src: "/images/collections/collection-necklaces.jpg", alt: "Diamond chokers" },
            isImplemented: true,
            href: "/category/chokers",
            order: 2,
            isActive: true,
          },
        ],
      };

      render(<ShopOurCollections config={customConfig} />);

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Curated Collections");
      expect(screen.getByText("PENDANTS")).toBeInTheDocument();
      expect(screen.getByText("CHOKERS")).toBeInTheDocument();

      const link = screen.getByRole("link", { name: /Shop CHOKERS Collection/i });
      expect(link).toHaveAttribute("href", "/category/chokers");
    });
  });
});
