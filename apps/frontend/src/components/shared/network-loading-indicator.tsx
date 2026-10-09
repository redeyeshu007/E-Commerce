"use client";

import React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { InlineLoader } from "./app-loader";

/**
 * Non-intrusive global network activity indicator.
 *
 * Displays subtle feedback only during operations requiring global synchronization feedback.
 * Automatically handles concurrent requests through TanStack Query counters.
 * Does NOT block user interaction on the rest of the application.
 */
export function NetworkLoadingIndicator() {
  // Filter for genuine pending queries that are not flagged as silent background refetches
  const isFetchingCount = useIsFetching({
    predicate: (query) => {
      return query.meta?.silent !== true && query.state.status === "pending";
    },
  });

  // Filter for active mutations (form submissions, cart updates, etc.)
  const isMutatingCount = useIsMutating({
    predicate: (mutation) => {
      return mutation.meta?.silent !== true;
    },
  });

  const isGlobalActive = isFetchingCount > 0 || isMutatingCount > 0;

  if (!isGlobalActive) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Synchronizing data"
      data-testid="network-loading-indicator"
      className="fixed bottom-4 right-4 z-30 pointer-events-none transition-opacity duration-300 animate-in fade-in"
    >
      <div className="bg-white/95 backdrop-blur-md shadow-md border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-[#333333]">
        <InlineLoader size="sm" shape="circle" label="Syncing..." />
        <span>Syncing...</span>
      </div>
    </div>
  );
}

export default NetworkLoadingIndicator;
