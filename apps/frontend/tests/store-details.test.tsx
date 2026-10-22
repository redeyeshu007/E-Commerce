import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { FooterStoreDetails } from "@/components/layout/footer";
import * as storeDetailsService from "@/services/store-details-service";
import type { StoreDetailsData } from "@/types/store-details";

const mockDetails: StoreDetailsData = {
  id: "current",
  phone: "+1 234 567 8900",
  address: "742 Evergreen Terrace, Springfield, OR",
  email: "concierge@springfieldjewels.com",
  updatedAt: new Date().toISOString(),
  updatedBy: "admin",
};

describe("Store Details Storefront Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading skeleton while fetching from database", () => {
    vi.spyOn(storeDetailsService, "fetchPublicStoreDetails").mockReturnValue(
      new Promise(() => {}) // never resolves to keep in loading state
    );

    render(<FooterStoreDetails />);

    expect(screen.getByTestId("store-details-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Need Any Help?")).toBeInTheDocument();
  });

  it("renders saved phone, address, and email from database API", async () => {
    vi.spyOn(storeDetailsService, "fetchPublicStoreDetails").mockResolvedValue(mockDetails);

    render(<FooterStoreDetails />);

    await waitFor(() => {
      expect(screen.getByText(mockDetails.phone)).toBeInTheDocument();
      expect(screen.getByText(mockDetails.address)).toBeInTheDocument();
      expect(screen.getByText(mockDetails.email)).toBeInTheDocument();
    });
  });

  it("formats phone as clickable tel: link and email as mailto: link", async () => {
    vi.spyOn(storeDetailsService, "fetchPublicStoreDetails").mockResolvedValue(mockDetails);

    render(<FooterStoreDetails />);

    await waitFor(() => {
      const phoneLink = screen.getByRole("link", { name: mockDetails.phone });
      expect(phoneLink).toHaveAttribute("href", "tel:+12345678900");

      const emailLink = screen.getByRole("link", { name: mockDetails.email });
      expect(emailLink).toHaveAttribute("href", `mailto:${mockDetails.email}`);
    });
  });

  it("handles fetch failure gracefully without displaying hardcoded placeholder fake details", async () => {
    vi.spyOn(storeDetailsService, "fetchPublicStoreDetails").mockResolvedValue(null);

    render(<FooterStoreDetails />);

    await waitFor(() => {
      expect(screen.getByTestId("store-details-error")).toBeInTheDocument();
      expect(screen.getByText(/Unable to load store contact details/i)).toBeInTheDocument();
    });

    // Confirms no fake phone or email is displayed
    expect(screen.queryByText("123 45678 90")).toBeNull();
    expect(screen.queryByText("contact@peralagae.com")).toBeNull();
  });

  it("updates live when STORE_DETAILS_UPDATED_EVENT is dispatched", async () => {
    const fetchSpy = vi.spyOn(storeDetailsService, "fetchPublicStoreDetails").mockResolvedValue(mockDetails);

    render(<FooterStoreDetails />);

    await waitFor(() => {
      expect(screen.getByText(mockDetails.phone)).toBeInTheDocument();
    });

    const updatedDetails: StoreDetailsData = {
      ...mockDetails,
      phone: "+44 20 7946 0991",
    };
    fetchSpy.mockResolvedValue(updatedDetails);

    act(() => {
      window.dispatchEvent(new CustomEvent(storeDetailsService.STORE_DETAILS_UPDATED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByText("+44 20 7946 0991")).toBeInTheDocument();
    });
  });
});
