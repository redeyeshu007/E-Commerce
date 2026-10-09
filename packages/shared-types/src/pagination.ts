/**
 * Pagination types — shared between frontend and backend.
 *
 * These types are used when returning paginated list responses.
 */

/** Query parameters for paginated list requests */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Pagination metadata included in list responses */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
