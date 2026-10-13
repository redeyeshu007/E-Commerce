"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import { SearchEmptyState } from "./search-empty-state";
import { searchCatalogue, type SearchResult } from "@/services/search-service";

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function SearchOverlay({
  isOpen,
  onClose,
  triggerRef,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult>({
    products: [],
    totalMatches: 0,
    query: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query and results when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSearchResult({ products: [], totalMatches: 0, query: "" });
      setIsSearching(false);
    }
  }, [isOpen]);

  // Debounce search query by 150ms for snappy responsiveness
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search whenever debouncedQuery updates
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResult({ products: [], totalMatches: 0, query: "" });
      return;
    }

    const res = searchCatalogue(debouncedQuery);
    setSearchResult(res);
  }, [debouncedQuery]);

  // Lock background body scroll while overlay is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle open change (e.g. clicking outside backdrop or Radix close)
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
        setTimeout(() => {
          if (triggerRef?.current) {
            triggerRef.current.focus();
          }
        }, 50);
      }
    },
    [onClose, triggerRef]
  );

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    const res = searchCatalogue(term);
    setSearchResult(res);
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setSearchResult({ products: [], totalMatches: 0, query: "" });
  };

  const hasSearched = debouncedQuery.trim().length > 0;
  const hasResults = hasSearched && searchResult.products.length > 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* 1. Subtle Translucent Backdrop */}
        <Dialog.Overlay
          data-testid="search-overlay-backdrop"
          className="search-overlay-backdrop fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
        />

        {/* 2. Centered/Top Positioned Modal Content Container */}
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 md:pt-14 lg:pt-18 overflow-y-auto pointer-events-none">
          <Dialog.Content
            data-testid="search-overlay-content"
            aria-label="Search jewellery catalogue"
            className="search-overlay-content relative w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl bg-[#FAF8F5]/95 sm:bg-white/95 backdrop-blur-xl border border-[#C5A572]/30 shadow-[0_30px_70px_rgba(0,0,0,0.18)] pointer-events-auto focus:outline-none overflow-hidden"
          >
            {/* Top: Search Input Bar */}
            <SearchInput
              query={query}
              onChange={setQuery}
              onClear={handleClear}
              onClose={onClose}
              isLoading={isSearching}
              inputRef={inputRef}
            />

            {/* Middle: Scrollable Body (Results, Suggestions, or Empty State) */}
            <div className="flex-1 overflow-y-auto max-h-[calc(88vh-80px)] overscroll-contain">
              {hasResults ? (
                <SearchResults
                  products={searchResult.products}
                  totalMatches={searchResult.totalMatches}
                  query={debouncedQuery}
                  onSelectProduct={onClose}
                />
              ) : (
                <SearchEmptyState
                  query={debouncedQuery}
                  onSelectSuggestion={handleSelectSuggestion}
                  onClear={handleClear}
                  onClose={onClose}
                />
              )}
            </div>

            {/* Bottom Bar: Subtle Brand Footer */}
            <div className="border-t border-[#F0EBE3] bg-[#FCFBF8]/80 px-4 py-2.5 text-center text-[11px] text-[#888888]">
              <span>PERALAGAE Fine Jewellery Catalogue · Prices shown in INR</span>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
