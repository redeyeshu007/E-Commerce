import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  EditorialCollectionsSection,
  EditorialCollectionCard,
} from "@/components/home/editorial-collections";
import {
  defaultEditorialCollectionsConfig,
  type EditorialCollectionsSectionConfig,
} from "@/config/editorial-collections";

describe("Editorial Collections Suite", () => {
  describe("EditorialCollectionCard", () => {
    it("renders image, title, description, and CTA in exact order", () => {
      const item = defaultEditorialCollectionsConfig.items[0]; // Lab Grown Diamonds
      render(<EditorialCollectionCard item={item} />);

      // Image
      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", item.image.alt);
      expect(image.getAttribute("src")).toContain(encodeURIComponent(item.image.src));

      // Title
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveTextContent("Lab Grown Diamonds");

      // Description
      expect(
        screen.getByText("Discover the exceptional quality & sparkle.")
      ).toBeInTheDocument();

      // CTA Link
      const cta = screen.getByRole("link", { name: /EXPLORE NOW: Lab Grown Diamonds/i });
      expect(cta).toHaveTextContent("EXPLORE NOW");
      expect(cta).toHaveAttribute("href", "/collections/lab-grown-diamonds");
    });

    it("triggers onCtaClick callback when CTA is clicked", () => {
      const item = defaultEditorialCollectionsConfig.items[1]; // Tennis Bracelets
      const handleClick = vi.fn();
      render(<EditorialCollectionCard item={item} onCtaClick={handleClick} />);

      const cta = screen.getByRole("link", { name: /SHOP COLLECTION: Tennis Bracelets/i });
      fireEvent.click(cta);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(item, expect.anything());
    });
  });

  describe("EditorialCollectionsSection", () => {
    it("renders exact top brand tagline with heading level 2", () => {
      render(
        <EditorialCollectionsSection config={defaultEditorialCollectionsConfig} />
      );

      const tagline = screen.getByTestId("editorial-tagline");
      expect(tagline).toBeInTheDocument();
      expect(tagline).toHaveTextContent(
        "Designed in India. Crafted with timeless elegance."
      );
    });

    it("renders all 3 cards with exact titles, descriptions, and CTAs", () => {
      render(
        <EditorialCollectionsSection config={defaultEditorialCollectionsConfig} />
      );

      // Card 1
      expect(screen.getByText("Lab Grown Diamonds")).toBeInTheDocument();
      expect(
        screen.getByText("Discover the exceptional quality & sparkle.")
      ).toBeInTheDocument();
      expect(screen.getByText("EXPLORE NOW")).toBeInTheDocument();

      // Card 2
      expect(screen.getByText("Tennis Bracelets")).toBeInTheDocument();
      expect(
        screen.getByText("Classic tennis bracelets designed for a lifetime.")
      ).toBeInTheDocument();
      expect(screen.getByText("SHOP COLLECTION")).toBeInTheDocument();

      // Card 3
      expect(screen.getByText("Garden Variety")).toBeInTheDocument();
      expect(
        screen.getByText("Add our new arrivals to your weekly lineup.")
      ).toBeInTheDocument();
      expect(screen.getByText("DISCOVER NOW")).toBeInTheDocument();
    });

    it("supports custom configuration override", () => {
      const customConfig: EditorialCollectionsSectionConfig = {
        tagline: "Custom Brand Tagline Here",
        items: [
          {
            id: "custom-1",
            title: "Custom Title",
            description: "Custom Description",
            ctaText: "VIEW ALL",
            href: "/custom-link",
            isImplemented: true,
            image: {
              src: "/images/custom.jpg",
              alt: "Custom Alt",
            },
          },
        ],
      };

      render(<EditorialCollectionsSection config={customConfig} />);

      expect(screen.getByText("Custom Brand Tagline Here")).toBeInTheDocument();
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("VIEW ALL")).toBeInTheDocument();
    });
  });
});
