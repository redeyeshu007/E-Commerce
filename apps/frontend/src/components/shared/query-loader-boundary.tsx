"use client";

import React from "react";
import { AppLoader, type AppLoaderProps } from "./app-loader";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface QueryLoaderBoundaryProps<T> {
  /** Whether the asynchronous operation is actively pending */
  isLoading: boolean;
  /** Whether the operation encountered an error */
  isError?: boolean;
  /** The error object or string if encountered */
  error?: Error | string | null | unknown;
  /** The retrieved data payload */
  data?: T | null;
  /** Optional custom check to determine if data is considered empty */
  isEmpty?: (data: T) => boolean;
  /** Callback to trigger a refetch or retry on failure */
  onRetry?: () => void;
  /** Props forwarded to the AppLoader */
  loaderProps?: AppLoaderProps;
  /** Visible loading message beneath loader */
  loadingMessage?: string;
  /** Accessible loading label for screen readers */
  loadingLabel?: string;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state description */
  emptyMessage?: string;
  /** Custom error message fallback */
  errorMessage?: string;
  /** Render prop invoked with the successful data */
  children: (data: T) => React.ReactNode;
}

/**
 * Standardized data-fetching lifecycle boundary.
 *
 * Explicitly separates:
 * 1. Loading state (renders AppLoader)
 * 2. Error state (renders error prompt with retry)
 * 3. Empty state (renders informative empty prompt without permanent spinner)
 * 4. Success state (renders children)
 */
export function QueryLoaderBoundary<T>({
  isLoading,
  isError = false,
  error,
  data,
  isEmpty,
  onRetry,
  loaderProps,
  loadingMessage = "Loading...",
  loadingLabel = "Fetching data...",
  emptyTitle = "No items found",
  emptyMessage = "There are no records to display at this time.",
  errorMessage = "An unexpected error occurred while loading this section.",
  children,
}: QueryLoaderBoundaryProps<T>) {
  // 1. Loading State
  if (isLoading) {
    return (
      <AppLoader variant="section" message={loadingMessage} label={loadingLabel} {...loaderProps} />
    );
  }

  // 2. Error State
  if (isError) {
    const errorText =
      error instanceof Error ? error.message : typeof error === "string" ? error : errorMessage;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center p-8 my-6 text-center border border-red-200 bg-red-50/50 rounded-lg max-w-lg mx-auto"
      >
        <AlertCircle className="w-8 h-8 text-red-600 mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold text-red-900 mb-1">Failed to load</h3>
        <p className="text-sm text-red-700 mb-4">{errorText}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-[#222222] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    );
  }

  // Check for empty data
  const isDataEmpty =
    data === null ||
    data === undefined ||
    (isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0);

  // 3. Empty State
  if (isDataEmpty) {
    return (
      <div
        data-testid="query-empty-state"
        role="region"
        aria-label={emptyTitle}
        className="flex flex-col items-center justify-center p-12 text-center text-[#666666] my-6"
      >
        <h3 className="text-base font-semibold text-black mb-1">{emptyTitle}</h3>
        <p className="text-sm text-[#777777] max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  // 4. Success State
  return <>{children(data as T)}</>;
}

export default QueryLoaderBoundary;
