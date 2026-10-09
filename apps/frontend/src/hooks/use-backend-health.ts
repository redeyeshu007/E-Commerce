import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface BackendHealthResponse {
  status: "ok" | "degraded" | "error";
  uptime?: number;
  timestamp?: string;
  version?: string;
}

/**
 * Genuine TanStack Query hook for backend health verification.
 * Follows full lifecycle: isLoading, isError, and data.
 */
export function useBackendHealth(options?: Partial<UseQueryOptions<BackendHealthResponse, Error>>) {
  return useQuery<BackendHealthResponse, Error>({
    queryKey: ["backend-health"],
    queryFn: () => apiFetch<BackendHealthResponse>("/health"),
    staleTime: 30 * 1000,
    retry: 1,
    ...options,
  });
}

export default useBackendHealth;
