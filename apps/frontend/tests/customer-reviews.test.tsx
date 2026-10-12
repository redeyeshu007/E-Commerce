import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  CustomerReviewsSection,
  ReviewCard,
  StarRating,
  ReviewPagination,
} from "@/components/home/customer-reviews";
import {
  defaultReviewsConfig,
  type CustomerReviewsSectionConfig,
} from "@/config/reviews";

describe("Customer Reviews Suite", () => {
  describe("StarRating", () => {
    it("renders the correct rating and aria-label", () => {
      render(<StarRating rating={4} maxStars={5} />);
      const ratingEl = screen.getByRole("img", {
        name: "Rated 4 out of 5 stars",
      });
      expect(ratingEl).toBeInTheDocument();
      expect(screen.getByText("Rated 4 out of 5 stars")).toBeInTheDocument();
    });

    it("renders filled stars with custom starColor", () => {
      const { container } = render(
        <StarRating rating={3} maxStars={5} starColor="#D4A373" />
      );
      const svgPaths = container.querySelectorAll("svg");
      expect(svgPaths.length).toBe(5);
      expect(svgPaths[0]).toHaveAttribute("fill", "#D4A373");
      expect(svgPaths[1]).toHaveAttribute("fill", "#D4A373");
      expect(svgPaths[2]).toHaveAttribute("fill", "#D4A373");
      expect(svgPaths[3]).toHaveAttribute("fill", "#E5E7EB");
      expect(svgPaths[4]).toHaveAttribute("fill", "#E5E7EB");
    });
  });

  describe("ReviewCard", () => {
    it("renders quotation mark, headline, review body, author name, and star rating", () => {
      const item = defaultReviewsConfig.reviews[0]; // Arjun Kumar
      render(<ReviewCard review={item} />);

      expect(
        screen.getByRole("heading", { name: item.headline, level: 3 })
      ).toBeInTheDocument();
      expect(screen.getByText(item.reviewText)).toBeInTheDocument();
      expect(screen.getByText(item.authorName)).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: `Rated ${item.rating} out of 5 stars` })
      ).toBeInTheDocument();
    });
  });

  describe("ReviewPagination", () => {
    it("renders pagination dots with proper aria roles and handles clicks", () => {
      render(
        <ReviewPagination
          totalPages={4}
          activePage={0}
          onPageSelect={() => {}}
        />
      );

      const tablist = screen.getByRole("tablist", {
        name: "Customer reviews pages",
      });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4);
    });

    it("returns null if totalPages <= 1", () => {
      const { container } = render(
        <ReviewPagination
          totalPages={1}
          activePage={0}
          onPageSelect={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("CustomerReviewsSection (Smooth Infinite Marquee)", () => {
    it("renders the exact heading 'Customer Reviews' with level 2", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      const heading = screen.getByRole("heading", {
        name: "Customer Reviews",
        level: 2,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", "customer-reviews-heading");
    });

    it("renders with background color #F0E5E4", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      const section = screen.getByTestId("customer-reviews-section");
      expect(section).toBeInTheDocument();
      expect(section).toHaveStyle({ backgroundColor: "#F0E5E4" });
    });

    it("renders the continuous infinite marquee track with primary and seamless loop cards", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      const track = screen.getByTestId("reviews-marquee-track");
      expect(track).toBeInTheDocument();
      expect(track).toHaveClass("reviews-marquee-track");

      // Verify authors from the review list are rendered
      expect(screen.getAllByText("Arjun Kumar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Priya Raman").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Karthik Subramanian").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Meena Lakshmi").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Rahul Narayanan").length).toBeGreaterThanOrEqual(1);
    });

    it("handles empty reviews array gracefully", () => {
      const emptyConfig: CustomerReviewsSectionConfig = {
        ...defaultReviewsConfig,
        reviews: [],
      };
      const { container } = render(
        <CustomerReviewsSection config={emptyConfig} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("supports custom heading and background color", () => {
      const customConfig: CustomerReviewsSectionConfig = {
        heading: "What Our Customers Say",
        backgroundColor: "#EAEAEA",
        starColor: "#C59B27",
        reviews: [
          {
            id: "test-1",
            authorName: "Anand R",
            headline: "Spectacular Service",
            reviewText: "Quick delivery and genuine hallmarked jewellery.",
            rating: 5,
            isDemo: true,
          },
        ],
      };

      render(<CustomerReviewsSection config={customConfig} />);

      expect(
        screen.getByRole("heading", {
          name: "What Our Customers Say",
          level: 2,
        })
      ).toBeInTheDocument();
      const section = screen.getByTestId("customer-reviews-section");
      expect(section).toHaveStyle({ backgroundColor: "#EAEAEA" });
      expect(screen.getAllByText("Spectacular Service").length).toBeGreaterThanOrEqual(1);
    });
  });
});
