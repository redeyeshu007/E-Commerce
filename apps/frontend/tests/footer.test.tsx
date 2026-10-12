import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  SiteFooter,
  FooterLinkGroup,
  FooterAccordionSection,
  BackToTopButton,
} from "@/components/layout/footer";
import { defaultFooterConfig } from "@/config/footer";

describe("PERALAGAE Footer Unit Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SiteFooter", () => {
    it("renders the footer landmark with contentinfo role and container", () => {
      render(<SiteFooter />);

      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute("data-testid", "site-footer");
    });

    it("renders Column 1: PERALAGAE brand name and approved tagline", () => {
      render(<SiteFooter />);

      const brandLink = screen.getByRole("link", { name: /^PERALAGAE$/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute("href", "/");

      const logoImg = screen.getByRole("img", { name: /^PERALAGAE$/i });
      expect(logoImg).toBeInTheDocument();

      expect(
        screen.getByText("Designed in India. Crafted with timeless elegance.")
      ).toBeInTheDocument();
    });

    it("renders Column 2: Explore Peralagae with exact 6 links", () => {
      render(<SiteFooter />);

      const exploreHeading = screen.getByText("Explore Peralagae");
      expect(exploreHeading).toBeInTheDocument();

      const expectedLinks = [
        { label: "Shop Our Collections", href: "/#shop-our-collections" },
        { label: "New Arrivals", href: "/#new-collection" },
        { label: "Necklaces", href: "/#shop-our-collections" },
        { label: "Rings", href: "/#shop-our-collections" },
        { label: "Bracelets", href: "/#shop-our-collections" },
        { label: "Earrings", href: "/#shop-our-collections" },
      ];

      expectedLinks.forEach(({ label, href }) => {
        const link = screen.getByRole("link", { name: label });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", href);
      });
    });

    it("renders Column 3: Shopping & More with exact 5 links", () => {
      render(<SiteFooter />);

      const shoppingHeading = screen.getByText("Shopping & More");
      expect(shoppingHeading).toBeInTheDocument();

      const expectedLinks = [
        { label: "Charms & Bangles", href: "/#shop-our-collections" },
        { label: "Gift Ideas", href: "/#shop-our-collections" },
        { label: "Find Store", href: "/#store-locator" },
        { label: "Services", href: "/#store-locator" },
        { label: "Subscribe", href: "/#newsletter-section" },
      ];

      expectedLinks.forEach(({ label, href }) => {
        const link = screen.getByRole("link", { name: label });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", href);
      });
    });

    it("renders Column 4: Store Details with phone, address, and email", () => {
      render(<SiteFooter />);

      const storeHeading = screen.getByText("Store Details");
      expect(storeHeading).toBeInTheDocument();

      expect(screen.getByText("Need Any Help?")).toBeInTheDocument();
      expect(screen.getByText("123 45678 90")).toBeInTheDocument();
      expect(
        screen.getByText(/502 New Design Str, Melbourne, Australia/i)
      ).toBeInTheDocument();
      expect(screen.getByText("contact@peralagae.com")).toBeInTheDocument();
    });

    it("renders Column 5: Follow Us with social media links", () => {
      render(<SiteFooter />);

      const followHeading = screen.getByText("Follow Us");
      expect(followHeading).toBeInTheDocument();

      expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
        "href",
        "https://facebook.com"
      );
      expect(screen.getByRole("link", { name: "X (Twitter)" })).toHaveAttribute(
        "href",
        "https://x.com"
      );
      expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
        "href",
        "https://instagram.com"
      );
      expect(screen.queryByRole("link", { name: "Pinterest" })).not.toBeInTheDocument();
    });

    it("renders left copyright notice and right developer attribution without payment icons", () => {
      render(<SiteFooter />);

      const copyright = screen.getByTestId("footer-copyright");
      expect(copyright).toBeInTheDocument();
      expect(copyright).toHaveTextContent(
        "© 2026 PERALAGAE. All Rights Reserved."
      );

      const developer = screen.getByTestId("footer-developer");
      expect(developer).toBeInTheDocument();
      expect(developer).toHaveTextContent("Design and Developed by Javix");
      const devLink = screen.getByRole("link", { name: "Javix" });
      expect(devLink).toHaveAttribute("href", "https://javixtechnologies.com/");

      expect(screen.queryByTestId("footer-payment-methods")).not.toBeInTheDocument();
    });

    it("does not render back-to-top arrow button in SiteFooter by default", () => {
      render(<SiteFooter />);
      expect(screen.queryByTestId("back-to-top-button")).not.toBeInTheDocument();
    });
  });

  describe("FooterAccordionSection mobile collapsible", () => {
    it("toggles aria-expanded and grid-rows when clicked on mobile", () => {
      render(
        <FooterAccordionSection id="test-accordion" title="Test Section">
          <div>Accordion inner content</div>
        </FooterAccordionSection>
      );

      const trigger = screen.getByTestId("accordion-trigger-test-accordion");
      const content = screen.getByTestId("accordion-content-test-accordion");

      // Initially closed
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(content).toHaveClass("grid-rows-[0fr]");

      // Click to open
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(content).toHaveClass("grid-rows-[1fr]");

      // Click to close
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(content).toHaveClass("grid-rows-[0fr]");
    });
  });

  describe("FooterLinkGroup anchor scrolling", () => {
    it("scrolls into view when an internal anchor link is clicked and element exists", () => {
      const mockElement = document.createElement("div");
      mockElement.id = "shop-our-collections";
      mockElement.scrollIntoView = vi.fn();
      document.body.appendChild(mockElement);

      const column = defaultFooterConfig.explorePeralagae;
      render(<FooterLinkGroup column={column} />);

      const necklacesLink = screen.getByRole("link", { name: "Necklaces" });
      fireEvent.click(necklacesLink);

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
      });

      document.body.removeChild(mockElement);
    });
  });

  describe("BackToTopButton", () => {
    it("is not rendered when window scrollY is <= 300", () => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      render(<BackToTopButton />);

      expect(screen.queryByTestId("back-to-top-button")).not.toBeInTheDocument();
    });

    it("renders when window scrollY exceeds 300", () => {
      Object.defineProperty(window, "scrollY", { value: 450, writable: true });
      render(<BackToTopButton />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByTestId("back-to-top-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Back to top");
    });

    it("smoothly scrolls window to top when clicked", () => {
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });
      render(<BackToTopButton />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByTestId("back-to-top-button");
      fireEvent.click(button);

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: "smooth",
      });
    });
  });
});
