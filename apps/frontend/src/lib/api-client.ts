/**
 * API client configuration.
 *
 * This module provides the base URL and fetch wrapper for calling
 * the backend API from the frontend.
 *
 * Use TanStack Query hooks to call these utilities from components.
 */

export function getBackendOrigin(): string {
  if (process.env["INTERNAL_API_URL"]) return process.env["INTERNAL_API_URL"];
  if (process.env["NEXT_PUBLIC_BACKEND_URL"]) return process.env["NEXT_PUBLIC_BACKEND_URL"];
  if (process.env["BACKEND_URL"]) return process.env["BACKEND_URL"];
  if (process.env["NEXT_PUBLIC_API_URL"]) {
    return process.env["NEXT_PUBLIC_API_URL"].replace(/\/api\/v1\/?$/, "");
  }
  return "http://localhost:4000";
}

export const BACKEND_ORIGIN = getBackendOrigin();

export const API_BASE_URL =
  typeof window !== "undefined" && window.location?.origin && !process.env["VITEST"]
    ? "/api/v1"
    : `${BACKEND_ORIGIN}/api/v1`;

/**
 * Base fetch wrapper with default headers and error handling.
 * Automatically retries on 502/503/504 Bad Gateway errors (Render free-tier cold starts).
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  retries: number = 3,
  delayMs: number = 2000,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      // If server is cold-starting on Render (502 Bad Gateway / 503 / 504), retry automatically
      if (
        [502, 503, 504].includes(res.status) &&
        retries > 0 &&
        !process.env["VITEST"]
      ) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return apiFetch<T>(path, options, retries - 1, delayMs * 1.5);
      }

      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody?.error?.message ?? `API request failed: ${res.status} ${res.statusText}`,
      );
    }

    return res.json() as Promise<T>;
  } catch (err: unknown) {
    if (
      retries > 0 &&
      !process.env["VITEST"] &&
      !(err instanceof DOMException && err.name === "AbortError")
    ) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return apiFetch<T>(path, options, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}
