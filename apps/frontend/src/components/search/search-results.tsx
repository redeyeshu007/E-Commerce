"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types/product";
import { SearchProductCard } from "./search-product-card";

export interface SearchResultsProps {
  products: Product[];
  totalMatches: number;
  query: string;
  onSelectProduct?: () => void;
}

export function SearchResults({
  products,
  totalMatches,
  query,
  onSelectProduct,
}: SearchResultsProps) {
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6" data-testid="search-results-container">
      {/* 1. Accessible Screen-reader Announcement */}
      <div
        role="status"
        aria-live="polite"
        data-testid="search-results-announcement"
        className="sr-only"
      >
        {totalMatches > 0
          ? `Found ${totalMatches} jewellery items for ${query}`
          : `No jewellery found for ${query}`}
      </div>

      {/* 2. Results Header Summary */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-[#777777]">
        <div>
          <span className="font-medium text-[#111111]">
            Showing {products.length} of {totalMatches}
          </span>{" "}
          matching {totalMatches === 1 ? "piece" : "pieces"} for &ldquo;
          <span className="font-semibold text-[#111111]">{query}</span>&rdquo;
        </div>

        {totalMatches > products.length && (
          <Link
            href={`/shop?search=${encodeURIComponent(query)}`}
            onClick={onSelectProduct}
            className="inline-flex items-center gap-1 font-medium text-[#C5A572] hover:underline"
          >
            <span>View all in Shop</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* 3. Responsive Product Grid */}
      <div
        data-testid="search-product-grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {products.map((product) => (
          <SearchProductCard
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
}
