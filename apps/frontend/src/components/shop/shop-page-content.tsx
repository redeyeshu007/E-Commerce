"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { ShopHero } from "./shop-hero";
import { ShopSidebar } from "./shop-sidebar";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ProductToolbar, type ViewMode } from "./product-toolbar";
import { ShopProductCard } from "./shop-product-card";
import { ShopPagination } from "./shop-pagination";
import { ShopEmptyState } from "./shop-empty-state";
import {
  getShopCatalogue,
  fetchPublicProducts,
  type ShopFilters,
  type SortOption,
  type ShopCatalogueResult,
} from "@/services/product-service";
import type { CategoryItem } from "@/types/category";
import {
  fetchPublicCategories,
  CATEGORIES_UPDATED_EVENT,
} from "@/services/category-public-service";

export interface ShopPageContentProps {
  pageSize?: number;
  initialCategories?: CategoryItem[];
  initialCatalogue?: ShopCatalogueResult;
}

export function ShopPageContent({
  pageSize = 12,
  initialCategories,
  initialCatalogue,
}: ShopPageContentProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const productAreaRef = useRef<HTMLDivElement>(null);

  // Initialize state from URL Search Params if available
  const initialCategory = searchParams.get("category") || null;
  const initialSort = (searchParams.get("sort") as SortOption) || "default";
  const initialView = (searchParams.get("view") as ViewMode) || "grid-4";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [filters, setFilters] = useState<ShopFilters>({
    category: initialCategory,
    minPrice: null,
    maxPrice: null,
    materials: [],
    sizes: [],
  });

  const [sort, setSort] = useState<SortOption>(initialSort);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync category filter when URL search parameters change externally
  const categoryParam = searchParams.get("category") || null;
  useEffect(() => {
    setFilters((prev) => {
      if (prev.category !== categoryParam) {
        return { ...prev, category: categoryParam };
      }
      return prev;
    });
    setCurrentPage(1);
  }, [categoryParam]);

  // Sync state to URL search parameters for shareable/bookmarkable URLs
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (sort !== "default") params.set("sort", sort);
    if (viewMode !== "grid-4") params.set("view", viewMode);
    if (currentPage > 1) params.set("page", String(currentPage));

    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters, sort, viewMode, currentPage, pathname]);

  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);

  // Fetch or sync categories on mount and when categories are updated in admin
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const fetched = await fetchPublicCategories();
        if (isMounted && fetched && fetched.length > 0) {
          setCategories(fetched);
        }
      } catch (err) {
        console.warn("[ShopPageContent] Failed to fetch public categories:", err);
      }
    };

    if (!initialCategories || initialCategories.length === 0) {
      loadCategories();
    }

    const handleUpdated = () => {
      loadCategories();
    };

    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdated);
    };
  }, [initialCategories]);

  // Sync initialCategories if passed externally
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  const [catalogueData, setCatalogueData] = useState<ShopCatalogueResult | null>(initialCatalogue ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync products from database API whenever filters, sort, page, or categories change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    fetchPublicProducts(filters, sort, currentPage, pageSize)
      .then((res) => {
        if (isMounted) {
          if (res) {
            setCatalogueData(res);
          } else {
            setCatalogueData(getShopCatalogue(filters, sort, currentPage, pageSize, categories));
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("Failed to load products from database.");
          setCatalogueData(getShopCatalogue(filters, sort, currentPage, pageSize, categories));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, sort, currentPage, pageSize, categories]);

  // Compute catalogue results via service with dynamic categories (using live DB data or computed fallback)
  const catalogueResult = useMemo(() => {
    return catalogueData ?? getShopCatalogue(filters, sort, currentPage, pageSize, categories);
  }, [catalogueData, filters, sort, currentPage, pageSize, categories]);

  // Resolve human-readable name of selected category for empty state
  const selectedCategoryName = useMemo(() => {
    if (!filters.category) return null;
    const found = categories.find(
      (c) =>
        c.slug.toLowerCase() === filters.category?.toLowerCase() ||
        c.id.toLowerCase() === filters.category?.toLowerCase()
    );
    return found ? found.name : filters.category;
  }, [filters.category, categories]);

  // Authoritative total catalogue count from database
  const totalCatalogueProductsCount = useMemo(() => {
    if (typeof catalogueResult.totalCatalogueCount === "number") {
      return catalogueResult.totalCatalogueCount;
    }
    if (categories && categories.length > 0 && catalogueResult.categoryCounts) {
      const sum = categories.reduce(
        (acc, c) => acc + (catalogueResult.categoryCounts[c.slug] ?? c.productCount ?? 0),
        0
      );
      if (sum > 0) return sum;
    }
    return catalogueResult.total;
  }, [catalogueResult, categories]);

  // Count of active filters for drawer badge & clear all visibility
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count += 1;
    if (
      (filters.minPrice != null && filters.minPrice > catalogueResult.minCataloguePrice) ||
      (filters.maxPrice != null && filters.maxPrice < catalogueResult.maxCataloguePrice)
    ) {
      count += 1;
    }
    if (filters.materials && filters.materials.length > 0) {
      count += filters.materials.length;
    }
    if (filters.sizes && filters.sizes.length > 0) {
      count += filters.sizes.length;
    }
    return count;
  }, [filters, catalogueResult.minCataloguePrice, catalogueResult.maxCataloguePrice]);

  // Filter change resets current page to 1
  const handleFilterChange = useCallback((newFilters: ShopFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Clear all filters resets to initial defaults
  const handleClearAll = useCallback(() => {
    setFilters({
      category: null,
      minPrice: null,
      maxPrice: null,
      materials: [],
      sizes: [],
    });
    setCurrentPage(1);
  }, []);

  // Sort change handler
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  }, []);

  // Page change with smooth scroll to top of product grid
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (productAreaRef.current) {
      productAreaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Determine grid container classes based on active view mode
  const gridContainerClass = useMemo(() => {
    switch (viewMode) {
      case "list":
        return "flex flex-col gap-4 sm:gap-6";
      case "grid-2":
        return "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8";
      case "grid-3":
        return "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6";
      case "grid-4":
      default:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5";
    }
  }, [viewMode]);

  return (
    <div className="w-full bg-white text-black min-h-screen flex flex-col">
      {/* 1. Shop Hero Banner */}
      <ShopHero />

      {/* 2. Main Two-Part Shop Content Layout */}
      <main
        ref={productAreaRef}
        id="shop-content"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Left Sidebar (Desktop 25% width, hidden on mobile/tablet) */}
          <div className="hidden lg:block w-full lg:w-[260px] xl:w-[280px] flex-none">
            <div className="sticky top-28">
              <ShopSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAll}
                categories={categories}
                categoryCounts={catalogueResult.categoryCounts}
                totalProductsCount={totalCatalogueProductsCount}
                materialCounts={catalogueResult.materialCounts}
                sizeCounts={catalogueResult.sizeCounts}
                minCataloguePrice={catalogueResult.minCataloguePrice}
                maxCataloguePrice={catalogueResult.maxCataloguePrice}
              />
            </div>
          </div>

          {/* Right Product Area (75% width on desktop) */}
          <section
            aria-label="Product catalogue listing"
            className="flex-1 w-full min-w-0 flex flex-col"
          >
            {/* Product Toolbar */}
            <ProductToolbar
              total={catalogueResult.total}
              fromIndex={catalogueResult.fromIndex}
              toIndex={catalogueResult.toIndex}
              sort={sort}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilters={() => setMobileDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Product Listing Area */}
            <div className="mt-6 sm:mt-8 min-h-[400px]">
              {catalogueResult.total === 0 ? (
                <ShopEmptyState onClearAll={handleClearAll} categoryName={selectedCategoryName} />
              ) : (
                <div className={gridContainerClass}>
                  {catalogueResult.products.map((product) => (
                    <ShopProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode === "list" ? "list" : "grid"}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {catalogueResult.totalPages > 1 && (
              <ShopPagination
                currentPage={catalogueResult.page}
                totalPages={catalogueResult.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>
        </div>
      </main>

      {/* Accessible Mobile Filter Drawer (< lg) */}
      <MobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        categories={categories}
        categoryCounts={catalogueResult.categoryCounts}
        totalProductsCount={totalCatalogueProductsCount}
        materialCounts={catalogueResult.materialCounts}
        sizeCounts={catalogueResult.sizeCounts}
        minCataloguePrice={catalogueResult.minCataloguePrice}
        maxCataloguePrice={catalogueResult.maxCataloguePrice}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
