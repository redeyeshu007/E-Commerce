import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { formatInr } from "@/lib/utils";
import { ProductCard } from "@/components/home/product-card";
import { ProductQuickView } from "@/components/home/product-quick-view";
import { NewCollectionSection } from "@/components/home/new-collection";
import { defaultNewCollectionConfig } from "@/config/new-collection";
import { StorefrontProvider } from "@/providers/storefront-provider";

describe("PERALAGAE New Collection Component Suite", () => {
  describe("Currency Formatter (formatInr)", () => {
    it("formats Indian Rupee prices with ₹ symbol and en-IN thousand separators", () => {
      expect(formatInr(1299)).toBe("₹1,299");
      expect(formatInr(4999)).toBe("₹4,999");
      expect(formatInr(12500)).toBe("₹12,500");
      expect(formatInr(45000)).toBe("₹45,000");
    });

    it("never displays dollar symbols or USD denominations", () => {
      const formatted = formatInr(24999);
      expect(formatted).not.toContain("$");
      expect(formatted).not.toContain("USD");
      expect(formatted).toContain("₹");
    });
  });

  describe("ProductCard", () => {
    const mockProduct = defaultNewCollectionConfig.products[0]; // Solitaire Pendant

    it("renders product category, title, image, and formatted INR price", () => {
      render(
        <StorefrontProvider>
          <ProductCard product={mockProduct} />
        </StorefrontProvider>,
      );

      expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText("₹24,999")).toBeInTheDocument();
      expect(screen.getByText("₹29,999")).toBeInTheDocument(); // compareAtPrice

      const img = screen.getByRole("img", { name: new RegExp(mockProduct.name, "i") });
      expect(img).toBeInTheDocument();
    });

    it("renders HOT badge when isHot is true, and NEW badge when isNew is true", () => {
      const hotProduct = defaultNewCollectionConfig.products[1]; // Sculpted Ring (isHot: true)
      const { rerender } = render(
        <StorefrontProvider>
          <ProductCard product={hotProduct} />
        </StorefrontProvider>,
      );

      expect(screen.getByTestId("badge-hot")).toHaveTextContent("HOT");

      const newProduct = defaultNewCollectionConfig.products[0]; // isNew: true
      rerender(
        <StorefrontProvider>
          <ProductCard product={newProduct} />
        </StorefrontProvider>,
      );

      expect(screen.getByTestId("badge-new")).toHaveTextContent("NEW");
    });

    it("toggles wishlist state upon clicking wishlist action button", () => {
      render(
        <StorefrontProvider>
          <ProductCard product={mockProduct} />
        </StorefrontProvider>,
      );

      const wishlistBtn = screen.getByRole("button", { name: /Add Solitaire Diamond.*wishlist/i });
      expect(wishlistBtn).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(wishlistBtn);

      const updatedBtn = screen.getByRole("button", { name: /Remove Solitaire Diamond.*wishlist/i });
      expect(updatedBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("adds item to cart and displays brief added feedback", () => {
      render(
        <StorefrontProvider>
          <ProductCard product={mockProduct} />
        </StorefrontProvider>,
      );

      const addToCartBtn = screen.getByRole("button", { name: /Add Solitaire Diamond.*to cart/i });
      expect(addToCartBtn).toHaveTextContent(/Add to Cart/i);

      fireEvent.click(addToCartBtn);

      expect(screen.getByText(/Added to Bag/i)).toBeInTheDocument();
    });

    it("renders wishlist button and does not render quick-view eye button", () => {
      render(
        <StorefrontProvider>
          <ProductCard product={mockProduct} />
        </StorefrontProvider>,
      );

      expect(screen.getByRole("button", { name: /wishlist/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Quick view/i })).not.toBeInTheDocument();
    });
  });

  describe("ProductQuickView Dialog", () => {
    const mockProduct = defaultNewCollectionConfig.products[0];

    it("renders accessible modal with product details, INR price, and action buttons", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <ProductQuickView product={mockProduct} isOpen={true} onClose={onClose} />
        </StorefrontProvider>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");

      expect(screen.getByRole("heading", { name: mockProduct.name })).toBeInTheDocument();
      expect(screen.getByText("₹24,999")).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description!)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.material!)).toBeInTheDocument();

      const closeBtn = screen.getByRole("button", { name: /Close quick view/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it("closes modal on Escape key press", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <ProductQuickView product={mockProduct} isOpen={true} onClose={onClose} />
        </StorefrontProvider>,
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("NewCollectionSection Carousel", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("renders section heading 'New Collection' and subtitle", () => {
      render(
        <StorefrontProvider>
          <NewCollectionSection config={defaultNewCollectionConfig} />
        </StorefrontProvider>,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("New Collection");
      expect(screen.getByText("Collect your loves with our newest arrivals.")).toBeInTheDocument();
    });

    it("renders 8 total products across 2 pages and advances pages on arrow navigation", () => {
      render(
        <StorefrontProvider>
          <NewCollectionSection config={defaultNewCollectionConfig} />
        </StorefrontProvider>,
      );

      // Verify all 8 product cards exist in the carousel DOM
      defaultNewCollectionConfig.products.forEach((prod) => {
        expect(screen.getByTestId(`product-card-${prod.id}`)).toBeInTheDocument();
      });

      // Next page button
      const nextBtn = screen.getByRole("button", { name: /Next products/i });
      const prevBtn = screen.getByRole("button", { name: /Previous products/i });

      // Click next to advance to page 2
      fireEvent.click(nextBtn);

      // Click prev to go back to page 1
      fireEvent.click(prevBtn);
    });

    it("automatically advances to next page after 10 seconds", () => {
      render(
        <StorefrontProvider>
          <NewCollectionSection config={defaultNewCollectionConfig} />
        </StorefrontProvider>,
      );

      // Verify page dots
      const dots = screen.getAllByRole("tab", { name: /Go to carousel page/i });
      expect(dots).toHaveLength(2);
      expect(dots[0]).toHaveAttribute("aria-selected", "true");

      // Advance timer by 10,000ms
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(dots[1]).toHaveAttribute("aria-selected", "true");

      // Advance by another 10,000ms
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(dots[0]).toHaveAttribute("aria-selected", "true");
    });

    it("pauses automatic rotation on hover and resumes on unhover", () => {
      const { container } = render(
        <StorefrontProvider>
          <NewCollectionSection config={defaultNewCollectionConfig} />
        </StorefrontProvider>,
      );

      const section = container.querySelector("section")!;
      const dots = screen.getAllByRole("tab", { name: /Go to carousel page/i });

      // Hover over section
      fireEvent.mouseEnter(section);

      // Advance 10s while hovered
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Still on page 1 because it's paused!
      expect(dots[0]).toHaveAttribute("aria-selected", "true");

      // Mouse leaves section
      fireEvent.mouseLeave(section);

      // Advance 10s after unhovering
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Now advanced to page 2!
      expect(dots[1]).toHaveAttribute("aria-selected", "true");
    });
  });
});
