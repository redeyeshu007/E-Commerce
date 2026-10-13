"use client";

import React from "react";
import { SUGGESTED_SEARCHES } from "@/services/search-service";

export interface SearchEmptyStateProps {
  query: string;
  onSelectSuggestion: (term: string) => void;
  onClear: () => void;
}

export function SearchEmptyState({
  query,
  onSelectSuggestion,
  onClear,
}: SearchEmptyStateProps) {
  const isNoResults = query.trim().length > 0;

  // Case 1: No Results Found for Query — Minimal & Refined
  if (isNoResults) {
    return (
      <div
        data-testid="search-no-results"
        className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16"
      >
        <p className="text-sm sm:text-base font-normal text-[#222222]">
          No jewellery found. Try another search.
        </p>

        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-full border border-[#DCD7CD] bg-transparent px-4 py-1.5 text-xs font-medium tracking-wide text-[#333333] transition-colors hover:border-[#C5A572] hover:text-[#C5A572] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          Clear search
        </button>
      </div>
    );
  }

  // Case 2: Minimal Empty Search State — Clean & Understated
  return (
    <div
      data-testid="search-initial-suggestions"
      className="px-5 py-6 sm:px-8 sm:py-8 text-left"
    >
      <span className="block text-[11px] font-semibold tracking-[0.16em] text-[#888888] uppercase">
        POPULAR SEARCHES
      </span>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {SUGGESTED_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSelectSuggestion(term)}
            data-testid={`suggested-search-${term.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full border border-[#E5E0D8] bg-transparent px-4 py-1.5 text-xs font-medium text-[#444444] transition-all hover:border-[#C5A572] hover:text-[#C5A572] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
