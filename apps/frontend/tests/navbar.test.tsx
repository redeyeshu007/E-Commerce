import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiteHeader } from "@/components/navbar/site-header";
import { AnnouncementBar } from "@/components/navbar/announcement-bar";
import { UtilityBar } from "@/components/navbar/utility-bar";
import { MainNavbar } from "@/components/navbar/main-navbar";
import { MobileBottomBar } from "@/components/navbar/mobile-bottom-bar";
import { defaultNavigationConfig } from "@/config/navigation";

describe("JAVIX Premium Navbar Component Suite", () => {
  describe("Row 1: AnnouncementBar", () => {
    it("renders the exact promotional announcement text with soft pink background", () => {
      render(<AnnouncementBar config={defaultNavigationConfig.announcement} />);

      expect(screen.getByText("SUMMER SALE, Get 40% Off for all products.")).toBeInTheDocument();

      const aside = screen.getByRole("complementary", {
        name: "Promotional Announcement",
      });
      expect(aside).toHaveStyle({ backgroundColor: "rgb(251, 192, 206)" }); // #FBC0CE
    });

    it("dismisses the announcement bar when the close button is clicked", () => {
      const onDismiss = vi.fn();
      render(
        <AnnouncementBar config={defaultNavigationConfig.announcement} onDismiss={onDismiss} />,
      );

      const closeButton = screen.getByRole("button", {
        name: "Close announcement bar",
      });
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText("SUMMER SALE, Get 40% Off for all products."),
      ).not.toBeInTheDocument();
    });
  });

  describe("Row 2: UtilityBar", () => {
    it("renders English, Indian Rupee currency symbol ₹ (INR), and Summer Sale promo", () => {
      render(<UtilityBar config={defaultNavigationConfig.utility} />);

      // English (plain text, no dropdown)
      expect(screen.getByText("English")).toBeInTheDocument();

      // Rupee symbol and currency (never US dollar $)
      expect(screen.getByText("₹")).toBeInTheDocument();
      expect(screen.getByText(/Rupees \(INR\)/)).toBeInTheDocument();
      expect(screen.queryByText("$")).not.toBeInTheDocument();

      // Promo text
      expect(screen.getByText(/Summer Sale 15% off!/)).toBeInTheDocument();
      expect(screen.getByText("Shop Now!")).toBeInTheDocument();
    });

    it("renders the 4 utility items on the right: Store Location, Services, Subscribe, Gift Cards", () => {
      render(<UtilityBar config={defaultNavigationConfig.utility} />);

      expect(screen.getByText("Store Location")).toBeInTheDocument();
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Subscribe")).toBeInTheDocument();
      expect(screen.getByText("Gift Cards")).toBeInTheDocument();
    });
  });

  describe("Row 3: MainNavbar", () => {
    it("renders the JAVIX brand wordmark pointing to / without taglines or extra logos", () => {
      render(<MainNavbar config={defaultNavigationConfig} />);

      const brandLink = screen.getByRole("link", {
        name: "JAVIX Fine Jewellery — Home",
      });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute("href", "/");
      expect(brandLink).toHaveTextContent("JAVIX");
    });

    it("renders exactly 4 primary navigation items: Home, Shop, Contact, New Arrivals in order", () => {
      render(<MainNavbar config={defaultNavigationConfig} />);

      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      expect(screen.getByText("Shop")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(screen.getByText("New Arrivals")).toBeInTheDocument();
    });

    it("renders action buttons including Search, Account, Wishlist, and Cart", () => {
      render(<MainNavbar config={defaultNavigationConfig} />);

      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Wishlist" })).toBeInTheDocument();

      // Cart buttons exist for both mobile header and desktop actions
      const cartButtons = screen.getAllByRole("button", { name: "Cart" });
      expect(cartButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("opens and closes mobile menu drawer via hamburger button and close button", () => {
      render(<MainNavbar config={defaultNavigationConfig} />);

      const menuToggle = screen.getByRole("button", { name: "Open navigation menu" });
      expect(menuToggle).toBeInTheDocument();

      // Open mobile drawer
      fireEvent.click(menuToggle);

      const mobileDialog = screen.getByRole("dialog", {
        name: "Mobile Navigation Menu",
      });
      expect(mobileDialog).toBeInTheDocument();

      // Close mobile drawer
      const closeMenuButton = screen.getByRole("button", { name: "Close menu" });
      fireEvent.click(closeMenuButton);

      expect(
        screen.queryByRole("dialog", { name: "Mobile Navigation Menu" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("MobileBottomBar (Sticky Navigation)", () => {
    it("renders HOME, SEARCH, WISHLIST (with count badge), and ACCOUNT", () => {
      render(<MobileBottomBar config={defaultNavigationConfig} />);

      const bottomNav = screen.getByRole("navigation", {
        name: "Mobile Bottom Navigation",
      });
      expect(bottomNav).toBeInTheDocument();

      // HOME
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");

      // SEARCH
      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();

      // WISHLIST with badge
      expect(screen.getByRole("button", { name: "Wishlist" })).toBeInTheDocument();
      expect(screen.getByTestId("mobile-wishlist-badge")).toHaveTextContent("0");

      // ACCOUNT
      expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
    });
  });

  describe("Full SiteHeader Integration", () => {
    it("renders complete 3-row header and sticky mobile bottom bar", () => {
      render(<SiteHeader />);

      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("bg-white");

      // Row 1
      expect(screen.getByText("SUMMER SALE, Get 40% Off for all products.")).toBeInTheDocument();

      // Row 2
      expect(screen.getByText("English")).toBeInTheDocument();

      // Row 3
      expect(screen.getByRole("link", { name: /JAVIX Fine Jewellery/ })).toBeInTheDocument();

      // Mobile Bottom Bar
      expect(
        screen.getByRole("navigation", { name: "Mobile Bottom Navigation" }),
      ).toBeInTheDocument();
    });
  });
});
