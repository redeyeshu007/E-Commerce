import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StorefrontProvider, useStorefront } from "@/providers/storefront-provider";
import { WishlistHero } from "@/components/wishlist/wishlist-hero";
import { WishlistEmptyState } from "@/components/wishlist/wishlist-empty-state";
import { WishlistTable } from "@/components/wishlist/wishlist-table";
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content";
import type { Product } from "@/types/product";

const mockProductA: Product = {
  id: "prod-solitaire-pendant",
  name: "Solitaire Diamond Pendant Necklace",
  slug: "solitaire-diamond-pendant-necklace",
  category: "NECKLACES",
  priceInr: 24999,
  compareAtPriceInr: 29999,
  image: {
    src: "/images/products/product-necklaces-solitaire.jpg",
    alt: "Solitaire Diamond Pendant Necklace",
  },
  inStock: true,
  isAvailable: true,
};

const mockProductB: Product = {
  id: "prod-emerald-necklace",
  name: "Emerald Cascade Necklace",
  slug: "emerald-cascade-necklace",
  category: "NECKLACES",
  priceInr: 42000,
  image: {
    src: "/images/products/product-necklaces-emerald.jpg",
    alt: "Emerald Cascade Necklace",
  },
  inStock: true,
  isAvailable: true,
};

const mockOutOfStockProduct: Product = {
  id: "prod-vintage-ring",
  name: "Vintage Art Deco Ring",
  slug: "vintage-art-deco-ring",
  category: "RINGS",
  priceInr: 58000,
  image: {
    src: "/images/products/product-rings-vintage.jpg",
    alt: "Vintage Art Deco Ring",
  },
  inStock: false,
  isAvailable: false,
};

describe("PERALAGAE Wishlist Page Suite", () => {
  /* -------------------------------------------------------------------------
   * 1. WishlistHero Component
   * ------------------------------------------------------------------------- */
  describe("WishlistHero Component", () => {
    it("renders page title banner with jewellery photography background and breadcrumb", () => {
      render(<WishlistHero title="Wishlist" />);

      const hero = screen.getByTestId("wishlist-hero-banner");
      expect(hero).toBeInTheDocument();

      const heading = screen.getByRole("heading", { level: 1, name: "Wishlist" });
      expect(heading).toBeInTheDocument();

      const image = screen.getByAltText(/PERALAGAE Luxury Jewellery Wishlist Banner/i);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", expect.stringContaining("banner-charm-rings.jpg"));

      const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(nav).toBeInTheDocument();

      const homeLink = screen.getByRole("link", { name: "Home" });
      expect(homeLink).toHaveAttribute("href", "/");

      const wishlistCrumb = screen.getByText("Wishlist", { selector: "span" });
      expect(wishlistCrumb).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------
   * 2. WishlistEmptyState Component
   * ------------------------------------------------------------------------- */
  describe("WishlistEmptyState Component", () => {
    it("renders empty state message, description, and Continue Shopping button", () => {
      render(<WishlistEmptyState />);

      const emptyContainer = screen.getByTestId("wishlist-empty-state");
      expect(emptyContainer).toBeInTheDocument();

      expect(screen.getByText("Your Wishlist Is Empty")).toBeInTheDocument();
      expect(
        screen.getByText(/Save the jewellery you love and find it here whenever you're ready/i)
      ).toBeInTheDocument();

      const cta = screen.getByRole("link", { name: /Continue Shopping/i });
      expect(cta).toHaveAttribute("href", "/shop");
    });
  });

  /* -------------------------------------------------------------------------
   * 3. WishlistTable Component
   * ------------------------------------------------------------------------- */
  describe("WishlistTable Component", () => {
    it("renders desktop table with 6 columns: remove, thumbnail, name, price, stock, action", () => {
      const onRemove = vi.fn();
      const onAddToCart = vi.fn();

      render(
        <WishlistTable
          products={[mockProductA]}
          onRemove={onRemove}
          onAddToCart={onAddToCart}
        />
      );

      // Product details
      expect(screen.getAllByText("Solitaire Diamond Pendant Necklace").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹24,999").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("In Stock").length).toBeGreaterThanOrEqual(1);

      // Desktop table row
      const desktopRow = screen.getByTestId("wishlist-row-prod-solitaire-pendant");
      expect(desktopRow).toBeInTheDocument();

      // Mobile card
      const mobileCard = screen.getByTestId("wishlist-card-prod-solitaire-pendant");
      expect(mobileCard).toBeInTheDocument();

      // Remove button
      const removeBtn = screen.getByTestId("remove-wishlist-prod-solitaire-pendant");
      expect(removeBtn).toHaveAttribute(
        "aria-label",
        "Remove Solitaire Diamond Pendant Necklace from wishlist"
      );
      fireEvent.click(removeBtn);
      expect(onRemove).toHaveBeenCalledWith(mockProductA);

      // Add to Cart button
      const addToCartBtn = screen.getByTestId("add-to-cart-wishlist-prod-solitaire-pendant");
      fireEvent.click(addToCartBtn);
      expect(onAddToCart).toHaveBeenCalledWith(mockProductA);
      expect(screen.getByText("Added")).toBeInTheDocument();
    });

    it("displays Out of Stock badge and disables Add to Cart button for unavailable products", () => {
      const onRemove = vi.fn();
      const onAddToCart = vi.fn();

      render(
        <WishlistTable
          products={[mockOutOfStockProduct]}
          onRemove={onRemove}
          onAddToCart={onAddToCart}
        />
      );

      // Out of Stock badge
      expect(screen.getAllByText("Out of Stock").length).toBeGreaterThanOrEqual(1);

      // Add to cart disabled
      const disabledBtn = screen.getByTestId("out-of-stock-wishlist-prod-vintage-ring");
      expect(disabledBtn).toBeDisabled();

      fireEvent.click(disabledBtn);
      expect(onAddToCart).not.toHaveBeenCalled();
    });
  });

  /* -------------------------------------------------------------------------
   * 4. WishlistPageContent Component Integration
   * ------------------------------------------------------------------------- */
  describe("WishlistPageContent Component", () => {
    it("renders empty state when storefront wishlist is empty", () => {
      render(
        <StorefrontProvider>
          <WishlistPageContent catalogue={[mockProductA]} />
        </StorefrontProvider>
      );

      expect(screen.getByRole("heading", { level: 1, name: "Wishlist" })).toBeInTheDocument();
      expect(screen.getByTestId("wishlist-empty-state")).toBeInTheDocument();
    });

    it("renders saved wishlist items when products are added to wishlist state", () => {
      function TestWrapper() {
        const { toggleWishlist } = useStorefront();
        return (
          <div>
            <button
              type="button"
              data-testid="add-mock-wishlist-btn"
              onClick={() => toggleWishlist(mockProductA)}
            >
              Add To Wishlist
            </button>
            <WishlistPageContent catalogue={[mockProductA, mockProductB]} />
          </div>
        );
      }

      render(
        <StorefrontProvider>
          <TestWrapper />
        </StorefrontProvider>
      );

      // Initially empty
      expect(screen.getByTestId("wishlist-empty-state")).toBeInTheDocument();

      // Add to wishlist
      act(() => {
        fireEvent.click(screen.getByTestId("add-mock-wishlist-btn"));
      });

      // Now renders table row
      expect(screen.queryByTestId("wishlist-empty-state")).not.toBeInTheDocument();
      expect(screen.getByTestId("wishlist-row-prod-solitaire-pendant")).toBeInTheDocument();
      expect(screen.getAllByText("Solitaire Diamond Pendant Necklace").length).toBeGreaterThanOrEqual(1);
    });
  });
});
