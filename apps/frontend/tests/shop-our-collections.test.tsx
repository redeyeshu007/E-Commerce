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

describe("PERALAGAE Shop Our Collections Component Suite", () => {
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

    it("renders default collection items as links pointing to /shop with category filters", () => {
      render(<ShopOurCollections config={defaultCollectionsConfig} />);

      const links = screen.getAllByRole("link", { name: /^Shop .* Collection$/i });
      expect(links).toHaveLength(6);
      expect(links[0]).toHaveAttribute("href", "/shop?category=necklaces");
      expect(links[1]).toHaveAttribute("href", "/shop?category=rings");
      expect(links[2]).toHaveAttribute("href", "/shop?category=bracelets");
      expect(links[3]).toHaveAttribute("href", "/shop?category=earrings");
      expect(links[4]).toHaveAttribute("href", "/shop?category=charms-bangles");
      expect(links[5]).toHaveAttribute("href", "/shop?category=gift-ideas");
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

    it("activates horizontal carousel mode with navigation controls when more than 6 categories exist", () => {
      const sevenItemsConfig: CollectionsSectionConfig = {
        heading: "Shop Our Collections",
        items: [
          ...defaultCollectionsConfig.items,
          {
            id: "cat-anklets",
            slug: "anklets",
            title: "ANKLETS",
            image: { src: "/images/collections/collection-bracelets.jpg", alt: "Anklets Collection" },
            isImplemented: true,
            href: "/shop?category=anklets",
            order: 7,
            isActive: true,
          },
        ],
      };

      render(<ShopOurCollections config={sevenItemsConfig} />);

      // Carousel region should be rendered
      const carousel = screen.getByRole("region", { name: /Collections carousel/i });
      expect(carousel).toBeInTheDocument();

      // Navigation arrows should be present
      expect(screen.getByRole("button", { name: /Previous categories/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next categories/i })).toBeInTheDocument();

      // All 7 items rendered
      const cards = screen.getAllByTestId(/^collection-card-/);
      expect(cards).toHaveLength(7);
      expect(screen.getByText("ANKLETS")).toBeInTheDocument();
    });
  });
});

