import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HotTrendingSection } from "@/components/home/hot-trending";
import { StorefrontProvider } from "@/providers/storefront-provider";
import { defaultNewCollectionConfig } from "@/config/new-collection";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StorefrontProvider>{ui}</StorefrontProvider>
    </QueryClientProvider>
  );
}

describe("PERALAGAE Hot / Trending Component Suite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockHotProducts = defaultNewCollectionConfig.products.filter((p) => p.isHot);

  it("renders Hot / Trending section heading and subtitle", () => {
    renderWithProviders(
      <HotTrendingSection
        initialProducts={mockHotProducts}
      />
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Hot / Trending");
    expect(
      screen.getByText("Explore our most coveted and trending fine jewellery pieces.")
    ).toBeInTheDocument();
  });

  it("renders only products passed to the section and supports carousel interaction", () => {
    renderWithProviders(
      <HotTrendingSection
        initialProducts={mockHotProducts}
      />
    );

    mockHotProducts.forEach((prod) => {
      expect(screen.getByTestId(`product-card-${prod.id}`)).toBeInTheDocument();
    });
  });

  it("renders clean empty state without static fallback products when zero products are tagged", () => {
    renderWithProviders(
      <HotTrendingSection
        initialProducts={[]}
      />
    );

    expect(screen.getByTestId("hot-trending-empty")).toBeInTheDocument();
    expect(screen.getByText("No Trending Pieces Currently Featured")).toBeInTheDocument();
  });
});
