import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  AppLoader,
  InlineLoader,
  SectionLoader,
  FullscreenLoader,
} from "@/components/shared/app-loader";

describe("AppLoader Centralized Loading Component", () => {
  it("renders with role='status' and aria-live='polite' for accessibility", () => {
    render(<AppLoader label="Loading diamonds..." />);

    const loader = screen.getByRole("status");
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute("aria-live", "polite");
    expect(loader).toHaveAttribute("aria-label", "Loading diamonds...");
  });

  it("renders screen-reader text when label is provided", () => {
    render(<AppLoader label="Fetching products..." />);

    const srText = screen.getByText("Fetching products...");
    expect(srText).toHaveClass("sr-only");
  });

  it("renders visible message beneath the loader when provided", () => {
    render(<AppLoader message="Please wait while we prepare your order..." />);

    expect(
      screen.getByText("Please wait while we prepare your order..."),
    ).toBeInTheDocument();
  });

  it("renders section variant by default and via SectionLoader helper", () => {
    render(<AppLoader />);
    const loader = screen.getByTestId("app-loader");
    expect(loader).toHaveAttribute("data-variant", "section");
    expect(loader.className).toContain("min-h-[200px]");

    render(<SectionLoader data-testid="section-helper-loader" />);
    const sectionHelper = screen.getByTestId("section-helper-loader");
    expect(sectionHelper).toHaveAttribute("data-variant", "section");
  });

  it("renders inline variant with compact styling", () => {
    render(<InlineLoader message="Saving..." />);
    const loader = screen.getByTestId("app-loader");
    expect(loader).toHaveAttribute("data-variant", "inline");
    expect(loader.className).toContain("inline-flex");
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders fullscreen variant with overlay styling", () => {
    render(<FullscreenLoader message="Processing checkout..." />);
    const loader = screen.getByTestId("app-loader");
    expect(loader).toHaveAttribute("data-variant", "fullscreen");
    expect(loader.className).toContain("fixed inset-0");
  });
});
