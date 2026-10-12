import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  InstagramGallerySection,
  InstagramGalleryGrid,
  InstagramGalleryItemCard,
} from "@/components/home/instagram-gallery";
import {
  defaultInstagramConfig,
  type InstagramGalleryConfig,
} from "@/config/instagram";

describe("Instagram Gallery Suite", () => {
  describe("InstagramGalleryItemCard", () => {
    it("renders image with alt text and aspect-square container", () => {
      const item = defaultInstagramConfig.items[0];
      render(<InstagramGalleryItemCard item={item} />);

      const img = screen.getByRole("img", { name: item.image.alt });
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toContain(encodeURIComponent(item.image.src));
    });

    it("renders as link if profileUrl or postUrl is provided", () => {
      const item = defaultInstagramConfig.items[0];
      render(
        <InstagramGalleryItemCard
          item={item}
          profileUrl="https://instagram.com/javixjewellery"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://instagram.com/javixjewellery");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("InstagramGalleryGrid", () => {
    it("renders all 6 images with proper responsive grid classes", () => {
      render(
        <InstagramGalleryGrid items={defaultInstagramConfig.items} />
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
  });

  describe("InstagramGallerySection", () => {
    it("renders exact heading 'Follow Us on Instagram' and configurable handle", () => {
      render(<InstagramGallerySection config={defaultInstagramConfig} />);

      const heading = screen.getByRole("heading", {
        name: "Follow Us on Instagram",
        level: 2,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", "instagram-gallery-heading");

      const handle = screen.getByTestId("instagram-handle-text");
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveTextContent("@yourjavixhandle");
    });

    it("renders handle as link when profileUrl is configured", () => {
      const configWithUrl: InstagramGalleryConfig = {
        ...defaultInstagramConfig,
        profileUrl: "https://instagram.com/javixjewellery",
      };
      render(<InstagramGallerySection config={configWithUrl} />);

      const link = screen.getByTestId("instagram-handle-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://instagram.com/javixjewellery");
    });

    it("handles empty items array gracefully", () => {
      const emptyConfig: InstagramGalleryConfig = {
        ...defaultInstagramConfig,
        items: [],
      };
      const { container } = render(
        <InstagramGallerySection config={emptyConfig} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("supports custom heading and handle override", () => {
      const customConfig: InstagramGalleryConfig = {
        ...defaultInstagramConfig,
        heading: "Follow JAVIX on Instagram",
        handle: "@javixofficial",
      };
      render(<InstagramGallerySection config={customConfig} />);

      expect(
        screen.getByRole("heading", {
          name: "Follow JAVIX on Instagram",
          level: 2,
        })
      ).toBeInTheDocument();
      expect(screen.getByText("@javixofficial")).toBeInTheDocument();
    });
  });
});
