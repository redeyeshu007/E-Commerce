"use client";

import React from "react";

/**
 * Root Global Error Boundary
 *
 * Catches uncaught errors at the root level and bypasses Next.js internal
 * prerendering issues by defining custom html and body tags.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | PERALAGAE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-[#111111] font-sans text-center">
        <h2 className="text-2xl font-serif mb-4">Something went wrong</h2>
        <p className="text-sm text-[#666666] mb-6 max-w-md">
          A critical application error occurred. Please try refreshing the page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-3 bg-[#111111] text-white text-xs uppercase tracking-widest hover:bg-[#333333] transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
