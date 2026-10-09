/**
 * API contract types — shared between frontend and backend.
 *
 * These define the shape of HTTP request and response payloads.
 * Implement concrete types here as API endpoints are built.
 */

/** Standard API success response envelope */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard API error response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Union of all API response shapes */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Health check response */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
}
