import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { AnimatedTabTitle } from "@/components/shared/animated-tab-title";

describe("AnimatedTabTitle Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.title = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates document title with Title Case frames (no full uppercase)", () => {
    render(<AnimatedTabTitle baseTitle="Peralagae Jewellery" intervalMs={200} />);

    // Initial frame
    expect(document.title).toBe("Peralagae");

    // Advance to frame 2
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(document.title).toBe("Peralagae ⟡ Jewellery");

    // Advance to settled frame
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(document.title).toBe("Peralagae Jewellery");

    // Ensure title is NOT full uppercase
    expect(document.title).not.toBe("PERALAGAE JEWELLERY");
    expect(document.title).not.toBe("PERALAGAE");
  });

  it("updates the favicon link to /icon.svg (Peralagae logo)", () => {
    render(<AnimatedTabTitle baseTitle="Peralagae Jewellery" />);

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    expect(link).not.toBeNull();
    expect(link?.href).toContain("/icon.svg");
    expect(link?.type).toBe("image/svg+xml");
  });

  it("restores base title on unmount", () => {
    const { unmount } = render(<AnimatedTabTitle baseTitle="Peralagae Jewellery" intervalMs={500} />);

    unmount();
    expect(document.title).toBe("Peralagae Jewellery");
  });
});
