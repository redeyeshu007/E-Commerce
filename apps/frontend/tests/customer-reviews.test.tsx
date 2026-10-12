import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
      let selectedPage = 0;
      render(
        <ReviewPagination
          totalPages={4}
          activePage={0}
          onPageSelect={(page) => {
            selectedPage = page;
          }}
        />
      );

      const tablist = screen.getByRole("tablist", {
        name: "Customer reviews pages",
      });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");

      fireEvent.click(tabs[2]);
      expect(selectedPage).toBe(2);
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

  describe("CustomerReviewsSection", () => {
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

    it("renders first page reviews by default on desktop", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      // First page contains first 3 reviews on desktop
      expect(screen.getByText("Beautiful Gold Craftsmanship")).toBeInTheDocument();
      expect(screen.getByText("Arjun Kumar")).toBeInTheDocument();

      expect(screen.getByText("Elegant and Timeless")).toBeInTheDocument();
      expect(screen.getByText("Priya Raman")).toBeInTheDocument();

      expect(screen.getByText("A Beautiful Gift")).toBeInTheDocument();
      expect(screen.getByText("Karthik Subramanian")).toBeInTheDocument();
    });

    it("switches pages when clicking a pagination dot", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(1);

      // Click second dot (page 1)
      fireEvent.click(tabs[1]);

      expect(screen.getByText("Lovely Traditional Design")).toBeInTheDocument();
      expect(screen.getByText("Meena Lakshmi")).toBeInTheDocument();
    });

    it("navigates via arrow keys on the carousel container", () => {
      render(<CustomerReviewsSection config={defaultReviewsConfig} />);

      const section = screen.getByTestId("customer-reviews-section");

      // Press ArrowRight to move to page 1
      fireEvent.keyDown(section, { key: "ArrowRight" });
      expect(screen.getByText("Lovely Traditional Design")).toBeInTheDocument();

      // Press ArrowLeft to move back to page 0
      fireEvent.keyDown(section, { key: "ArrowLeft" });
      expect(screen.getByText("Beautiful Gold Craftsmanship")).toBeInTheDocument();
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
      expect(screen.getByText("Spectacular Service")).toBeInTheDocument();
    });

    it("automatically loops to the next page when autoRotate is enabled and pauses on hover", () => {
      vi.useFakeTimers();
      render(
        <CustomerReviewsSection
          config={{
            ...defaultReviewsConfig,
            autoRotate: true,
            autoRotateIntervalMs: 3000,
          }}
        />
      );

      // Initially on page 0
      expect(screen.getByText("Beautiful Gold Craftsmanship")).toBeInTheDocument();

      // Advance timers by 3000ms
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Lovely Traditional Design")).toBeInTheDocument();

      // Pause on mouse enter
      const section = screen.getByTestId("customer-reviews-section");
      fireEvent.mouseEnter(section);

      // Advance timers while hovered — should NOT advance
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Lovely Traditional Design")).toBeInTheDocument();

      // Mouse leave resumes auto-rotation
      fireEvent.mouseLeave(section);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Beautiful Finishing")).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
