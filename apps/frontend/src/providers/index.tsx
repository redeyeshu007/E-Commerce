"use client";

/**
 * Application providers tree.
 *
 * All React context providers are composed here and applied in the root layout.
 *
 * Current providers:
 *   - QueryClientProvider (TanStack Query) — for client-side server-state management
 *   - NetworkLoadingIndicator — subtle non-intrusive global status for genuine operations
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NetworkLoadingIndicator } from "@/components/shared/network-loading-indicator";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create a stable QueryClient instance per component mount.
  // This avoids sharing state between server rendering and client hydration.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Conservative defaults — adjust per feature requirement
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <NetworkLoadingIndicator />
    </QueryClientProvider>
  );
}
