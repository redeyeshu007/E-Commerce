"use client";

import React from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { SUGGESTED_SEARCHES } from "@/services/search-service";

export interface SearchEmptyStateProps {
  query: string;
  onSelectSuggestion: (term: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

export function SearchEmptyState({
  query,
  onSelectSuggestion,
  onClear,
  onClose,
}: SearchEmptyStateProps) {
  const isNoResults = query.trim().length > 0;

  // Case 1: No Results Found for Query
  if (isNoResults) {
    return (
      <div
        data-testid="search-no-results"
        className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF5F6] text-[#C5A572] shadow-xs">
          <Search className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />
        </div>

        <h3 className="mt-4 text-base sm:text-lg font-medium text-[#111111]">
          No jewellery found. Try another search.
        </h3>

        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[#777777]">
          We couldn&apos;t find any pieces matching &ldquo;{query}&rdquo;. Check the spelling or try searching by category such as rings, necklaces, or bracelets.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-[#111111] px-5 py-2 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            Clear Search
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Initial Empty Input State (Suggestions & Popular Categories)
  return (
    <div
      data-testid="search-initial-suggestions"
      className="px-4 py-6 sm:px-6 sm:py-8"
    >
      {/* 1. Popular Searches */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#888888] uppercase">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A572]" aria-hidden="true" />
          <span>Popular Searches</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSelectSuggestion(term)}
              data-testid={`suggested-search-${term.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full border border-[#E5E0D8] bg-[#FDFBF7] px-3.5 py-1.5 text-xs font-medium text-[#333333] transition-all hover:border-[#C5A572] hover:bg-white hover:text-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Explore by Category */}
      <div className="mt-8 border-t border-[#F0EBE3] pt-6">
        <h4 className="text-xs font-semibold tracking-wider text-[#888888] uppercase">
          Explore by Category
        </h4>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Necklaces", term: "necklaces", count: "4 pieces" },
            { label: "Rings", term: "rings", count: "4 pieces" },
            { label: "Bracelets", term: "bracelets", count: "4 pieces" },
            { label: "Earrings", term: "earrings", count: "4 pieces" },
          ].map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => onSelectSuggestion(cat.term)}
              className="group flex flex-col items-start rounded-xl border border-[#EDE8E1] bg-white p-3 text-left transition-all hover:border-[#C5A572] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <span className="text-xs sm:text-sm font-medium text-[#111111] group-hover:text-[#C5A572] transition-colors">
                {cat.label}
              </span>
              <span className="mt-0.5 text-[10px] text-[#888888]">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
