"use client";

import React, { useState } from "react";
import { ChevronDown, RotateCcw, Check } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { DualRangeSlider } from "./dual-range-slider";
import {
  JEWELLERY_CATEGORIES,
  JEWELLERY_MATERIALS,
  JEWELLERY_SIZES,
  type ShopFilters,
} from "@/services/product-service";

import type { CategoryItem } from "@/types/category";

export interface ShopSidebarProps {
  filters: ShopFilters;
  onFilterChange: (filters: ShopFilters) => void;
  onClearAll: () => void;
  categories?: CategoryItem[];
  categoryCounts: Record<string, number>;
  totalProductsCount?: number;
  materialCounts: Record<string, number>;
  sizeCounts: Record<string, number>;
  minCataloguePrice: number;
  maxCataloguePrice: number;
  className?: string;
}

export function ShopSidebar({
  filters,
  onFilterChange,
  onClearAll,
  categories,
  categoryCounts,
  totalProductsCount,
  materialCounts,
  sizeCounts,
  minCataloguePrice,
  maxCataloguePrice,
  className = "",
}: ShopSidebarProps) {
  // Collapsible section open/closed state
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    materials: true,
    sizes: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if any filter is currently applied
  const isAnyFilterActive = Boolean(
    filters.category ||
      (filters.minPrice != null && filters.minPrice > minCataloguePrice) ||
      (filters.maxPrice != null && filters.maxPrice < maxCataloguePrice) ||
      (filters.materials && filters.materials.length > 0) ||
      (filters.sizes && filters.sizes.length > 0)
  );

  // Category selection handler
  const handleCategoryClick = (categoryId: string) => {
    if (filters.category === categoryId) {
      // Toggle off / clear category
      onFilterChange({ ...filters, category: null });
    } else {
      onFilterChange({ ...filters, category: categoryId });
    }
  };

  // Price range state & handlers
  const currentMinPrice = filters.minPrice ?? minCataloguePrice;
  const currentMaxPrice = filters.maxPrice ?? maxCataloguePrice;
  const isPriceFiltered = filters.minPrice != null || filters.maxPrice != null;

  const handlePriceRangeChange = (newMin: number, newMax: number) => {
    if (newMin <= minCataloguePrice && newMax >= maxCataloguePrice) {
      onFilterChange({ ...filters, minPrice: null, maxPrice: null });
    } else {
      onFilterChange({
        ...filters,
        minPrice: newMin,
        maxPrice: newMax,
      });
    }
  };

  const handlePriceReset = () => {
    onFilterChange({ ...filters, minPrice: null, maxPrice: null });
  };

  // Material selection handler
  const handleMaterialToggle = (material: string) => {
    const current = filters.materials ?? [];
    const exists = current.includes(material);
    const updated = exists ? current.filter((m) => m !== material) : [...current, material];
    onFilterChange({ ...filters, materials: updated });
  };

  // Size selection handler
  const handleSizeToggle = (size: string) => {
    const current = filters.sizes ?? [];
    const exists = current.includes(size);
    const updated = exists ? current.filter((s) => s !== size) : [...current, size];
    onFilterChange({ ...filters, sizes: updated });
  };

  return (
    <aside
      aria-label="Product Catalogue Filters"
      className={`w-full flex flex-col gap-6 text-[#111111] ${className}`}
    >
      {/* Sidebar Header & Clear All Action */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
        <h2 className="text-base font-semibold tracking-wider uppercase text-[#111111]">
          Filters
        </h2>
        {isAnyFilterActive && (
          <button
            type="button"
            onClick={onClearAll}
            suppressHydrationWarning
            className="flex items-center gap-1.5 text-xs font-medium text-[#D9383A] hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <RotateCcw className="h-3 w-3 stroke-[2]" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* 1. CATEGORIES FILTER SECTION */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          aria-expanded={openSections.categories}
          aria-controls="filter-section-categories"
          suppressHydrationWarning
          className="w-full flex items-center justify-between py-1 text-left font-medium text-sm tracking-wider uppercase text-[#111111] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <span>Categories</span>
          <ChevronDown
            className={`h-4 w-4 text-[#666666] transition-transform duration-200 group-hover:text-black ${
              openSections.categories ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.categories && (
          <div id="filter-section-categories" className="mt-3.5 flex flex-col gap-2">
            {/* All Categories Option */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, category: null })}
              suppressHydrationWarning
              className={`flex items-center justify-between text-xs sm:text-[13px] py-1 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black ${
                !filters.category
                  ? "font-semibold text-black"
                  : "text-[#555555] hover:text-black"
              }`}
            >
              <span>All Jewellery</span>
              <span className="text-[11px] text-[#888888]">
                ({totalProductsCount ?? 0})
              </span>
            </button>

            {/* Individual Jewellery Categories (Dynamic & Authoritative) */}
            {(categories && categories.length > 0
              ? categories
                  .filter((c) => c.isActive)
                  .sort((a, b) => a.order - b.order)
                  .map((c) => {
                    const known: Record<string, string> = {
                      necklaces: "Necklaces",
                      rings: "Rings",
                      bracelets: "Bracelets",
                      earrings: "Earrings",
                      "charms-bangles": "Charms & Bangles",
                      "gift-ideas": "Gift Ideas",
                    };
                    const label = known[c.slug.toLowerCase()] || c.name;
                    return {
                      id: c.slug,
                      slug: c.slug,
                      label,
                      productCount: c.productCount,
                    };
                  })
              : JEWELLERY_CATEGORIES.map((c) => ({
                  id: c.id,
                  slug: c.id,
                  label: c.label,
                  productCount: categoryCounts[c.id] ?? 0,
                }))
            ).map((cat) => {
              const isActive =
                filters.category?.toLowerCase() === cat.slug.toLowerCase() ||
                filters.category?.toLowerCase() === cat.id.toLowerCase();
              const count =
                categoryCounts[cat.slug] ??
                categoryCounts[cat.id] ??
                cat.productCount ??
                0;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  suppressHydrationWarning
                  aria-pressed={isActive}
                  className={`flex items-center justify-between text-xs sm:text-[13px] py-1 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black ${
                    isActive
                      ? "font-semibold text-black"
                      : "text-[#555555] hover:text-black"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        isActive ? "bg-black" : "bg-transparent"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{cat.label}</span>
                  </span>
                  <span className="text-[11px] text-[#888888]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. PRICE FILTER SECTION */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          aria-expanded={openSections.price}
          aria-controls="filter-section-price"
          suppressHydrationWarning
          className="w-full flex items-center justify-between py-1 text-left font-medium text-sm tracking-wider uppercase text-[#111111] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <span>Price Filter</span>
          <ChevronDown
            className={`h-4 w-4 text-[#666666] transition-transform duration-200 group-hover:text-black ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div id="filter-section-price" className="mt-4 flex flex-col gap-2.5">
            {/* Minimum & Maximum Selected Prices Aligned Left and Right */}
            <div className="flex items-center justify-between text-xs text-[#555555]">
              <span className="font-medium text-[#111111]">
                Min: <span className="font-normal text-[#555555]">{formatInr(currentMinPrice)}</span>
              </span>
              <span className="font-medium text-[#111111]">
                Max: <span className="font-normal text-[#555555]">{formatInr(currentMaxPrice)}</span>
              </span>
            </div>

            {/* Exactly One Single-Track Dual-Thumb Range Slider */}
            <DualRangeSlider
              min={minCataloguePrice}
              max={maxCataloguePrice}
              step={500}
              value={[currentMinPrice, currentMaxPrice]}
              onChange={([newMin, newMax]) => handlePriceRangeChange(newMin, newMax)}
              minLabel="Minimum price"
              maxLabel="Maximum price"
            />

            {/* Selected Price Range Display Underneath & Reset Action */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs font-semibold text-[#111111]">
                {formatInr(currentMinPrice)} – {formatInr(currentMaxPrice)}
              </span>
              {isPriceFiltered && (
                <button
                  type="button"
                  onClick={handlePriceReset}
                  suppressHydrationWarning
                  className="text-[11px] font-medium text-[#666666] hover:text-black underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                >
                  Reset Price
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. MATERIALS FILTER SECTION */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <button
          type="button"
          onClick={() => toggleSection("materials")}
          aria-expanded={openSections.materials}
          aria-controls="filter-section-materials"
          suppressHydrationWarning
          className="w-full flex items-center justify-between py-1 text-left font-medium text-sm tracking-wider uppercase text-[#111111] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <span>Materials</span>
          <ChevronDown
            className={`h-4 w-4 text-[#666666] transition-transform duration-200 group-hover:text-black ${
              openSections.materials ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.materials && (
          <div id="filter-section-materials" className="mt-3.5 flex flex-col gap-2">
            {JEWELLERY_MATERIALS.map((mat) => {
              const isChecked = filters.materials?.includes(mat) ?? false;
              const count = materialCounts[mat] ?? 0;
              return (
                <label
                  key={mat}
                  className="flex items-center justify-between text-xs sm:text-[13px] text-[#555555] hover:text-black cursor-pointer py-1 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-4 w-4 items-center justify-center border transition-colors ${
                        isChecked
                          ? "bg-black border-black text-white"
                          : "border-[#CCCCCC] bg-white hover:border-black"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMaterialToggle(mat)}
                      className="sr-only"
                      aria-label={`Filter by ${mat}`}
                      suppressHydrationWarning
                    />
                    <span className={isChecked ? "font-semibold text-black" : ""}>
                      {mat}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#888888]">({count})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SIZE FILTER SECTION */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <button
          type="button"
          onClick={() => toggleSection("sizes")}
          aria-expanded={openSections.sizes}
          aria-controls="filter-section-sizes"
          suppressHydrationWarning
          className="w-full flex items-center justify-between py-1 text-left font-medium text-sm tracking-wider uppercase text-[#111111] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <span>Size</span>
          <ChevronDown
            className={`h-4 w-4 text-[#666666] transition-transform duration-200 group-hover:text-black ${
              openSections.sizes ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.sizes && (
          <div id="filter-section-sizes" className="mt-3.5 flex flex-col gap-2">
            {JEWELLERY_SIZES.map((sz) => {
              const isChecked = filters.sizes?.includes(sz) ?? false;
              const count = sizeCounts[sz] ?? 0;
              return (
                <label
                  key={sz}
                  className="flex items-center justify-between text-xs sm:text-[13px] text-[#555555] hover:text-black cursor-pointer py-1 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-4 w-4 items-center justify-center border transition-colors ${
                        isChecked
                          ? "bg-black border-black text-white"
                          : "border-[#CCCCCC] bg-white hover:border-black"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleSizeToggle(sz)}
                      className="sr-only"
                      aria-label={`Filter by size ${sz}`}
                      suppressHydrationWarning
                    />
                    <span className={isChecked ? "font-semibold text-black" : ""}>
                      Size {sz}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#888888]">({count})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
