"use client";

import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";

export interface ShopEmptyStateProps {
  onClearAll: () => void;
  className?: string;
}

export function ShopEmptyState({ onClearAll, className = "" }: ShopEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center border border-dashed border-[#DDDDDD] bg-[#FAFAFA] ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#999999] shadow-sm mb-4">
        <Sparkles className="h-6 w-6 stroke-[1.5]" />
      </div>

      <h3 className="font-serif text-lg sm:text-xl font-normal text-[#111111] uppercase tracking-wider">
        No jewellery found
      </h3>

      <p className="mt-2 text-xs sm:text-sm text-[#666666] max-w-sm leading-relaxed">
        Try adjusting your filters to discover more pieces from our handcrafted fine jewellery collection.
      </p>

      <button
        type="button"
        onClick={onClearAll}
        suppressHydrationWarning
        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Clear All Filters</span>
      </button>
    </div>
  );
}
