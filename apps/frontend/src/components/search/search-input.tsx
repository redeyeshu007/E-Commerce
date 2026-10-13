"use client";

import React, { useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SearchInput({
  query,
  onChange,
  onClear,
  onClose,
  isLoading = false,
  inputRef: externalRef,
}: SearchInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [inputRef]);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center border-b border-[#EAE6DF] px-4 py-3 sm:px-6 sm:py-4">
      {/* 1. Search Icon */}
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[#C5A572]" aria-hidden="true">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin stroke-[1.8]" />
        ) : (
          <Search className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.6]" />
        )}
      </div>

      {/* 2. Search Text Input */}
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        data-testid="search-overlay-input"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search jewellery, rings, necklaces..."
        aria-label="Search jewellery catalogue"
        className="mx-3 flex-1 bg-transparent text-sm sm:text-base md:text-lg font-normal text-[#111111] placeholder:text-[#999999] focus:outline-none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* 3. Action Controls (Clear + Close) */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Clear Button */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            data-testid="search-clear-button"
            aria-label="Clear search input"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#777777] transition-colors hover:bg-[#F2EFE9] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <X className="h-4 w-4 stroke-[1.8]" aria-hidden="true" />
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          data-testid="search-close-button"
          aria-label="Close search overlay"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-transparent text-[#222222] transition-colors hover:border-[#E5E0D8] hover:bg-[#F4F1EA] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <X className="h-5 w-5 stroke-[1.6]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
