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
    <div className="px-4 py-4 sm:px-6 sm:py-5" data-testid="search-results-container">
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

      {/* 2. Minimal Results Header Summary */}
      <div className="mb-3.5 flex items-center justify-between text-xs text-[#777777]">
        <div>
          <span className="font-medium text-[#111111]">
            {products.length} of {totalMatches} results
          </span>{" "}
          for &ldquo;<span className="text-[#111111]">{query}</span>&rdquo;
        </div>

        {totalMatches > products.length && (
          <Link
            href={`/shop?search=${encodeURIComponent(query)}`}
            onClick={onSelectProduct}
            className="inline-flex items-center gap-1 font-medium text-[#C5A572] transition-colors hover:text-[#111111]"
          >
            <span>View all results</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* 3. Compact Two-Column Product Grid */}
      <div
        data-testid="search-product-grid"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
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
