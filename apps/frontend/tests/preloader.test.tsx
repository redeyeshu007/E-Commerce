import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { LuxuryPreloader } from "@/components/shared/luxury-preloader";
import { MorphingText } from "@/components/ui/morphing-text";

describe("LuxuryPreloader Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with role='status' and aria-label='JAVIX JEWELLERY'", () => {
    render(<LuxuryPreloader />);
    const preloader = screen.getByRole("status");
    expect(preloader).toBeInTheDocument();
    expect(preloader).toHaveAttribute("aria-label", "JAVIX JEWELLERY");
  });

  it("defaults to pure white background with black text and supports dark theme", () => {
    const { unmount } = render(<LuxuryPreloader />);
    const lightPreloader = screen.getByRole("status");
    expect(lightPreloader).toHaveStyle({ backgroundColor: "#FFFFFF" });
    unmount();

    render(<LuxuryPreloader theme="dark" />);
    const darkPreloader = screen.getByRole("status");
    expect(darkPreloader).toHaveStyle({ backgroundColor: "#000000" });
  });

  it("initializes with Javix text in the morphing element", () => {
    const { container } = render(<LuxuryPreloader />);
    const spans = container.querySelectorAll("span");
    const spanTexts = Array.from(spans).map((s) => s.textContent);
    expect(spanTexts).toContain("Javix");
  });

  it("includes the threshold SVG filter for liquid morphing", () => {
    const { container } = render(<LuxuryPreloader />);
    const filter = container.querySelector("#threshold");
    expect(filter).toBeInTheDocument();
    const feColorMatrix = container.querySelector("feColorMatrix");
    expect(feColorMatrix).toBeInTheDocument();
  });

  it("triggers safety timeout gracefully", () => {
    render(<LuxuryPreloader initialCooldown={0.1} morphTime={0.2} cooldownTime={0.1} />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });
});

describe("MorphingText Component", () => {
  it("renders texts array and threshold filter", () => {
    const { container } = render(<MorphingText texts={["Hello", "World"]} />);
    const filter = container.querySelector("filter#threshold");
    expect(filter).toBeInTheDocument();

    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(2);
    expect(spans[0]?.textContent).toBe("Hello");
  });
});
