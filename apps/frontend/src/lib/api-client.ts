/**
 * API client configuration.
 *
 * This module provides the base URL and fetch wrapper for calling
 * the backend API from the frontend.
 *
 * Use TanStack Query hooks to call these utilities from components.
 */

export const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api/v1";

/**
 * Base fetch wrapper with default headers and error handling.
 * Extend this as authentication and other concerns are added.
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message ?? `API request failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}
