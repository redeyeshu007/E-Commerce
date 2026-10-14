import { API_BASE_URL } from "@/lib/api-client";

export interface AdminUser {
  email: string;
  role: "admin";
}

export interface AdminLoginResponse {
  success: boolean;
  data: {
    token: string;
    admin: AdminUser;
  };
}

export interface AdminMeResponse {
  success: boolean;
  data: AdminUser;
}

const TOKEN_STORAGE_KEY = "peralagae_admin_token";

export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredAdminToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Calls backend POST /admin/auth/login
 */
export async function loginAdmin(credentials: {
  email: string;
  password: string;
}): Promise<AdminLoginResponse["data"]> {
  const url = `${API_BASE_URL}/admin/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.error?.message || "Invalid email or password";
    throw new Error(message);
  }

  if (body?.data?.token) {
    setStoredAdminToken(body.data.token);
  }

  return body.data;
}

/**
 * Calls backend GET /admin/auth/me
 */
export async function getAdminSession(): Promise<AdminUser> {
  const url = `${API_BASE_URL}/admin/auth/me`;
  const token = getStoredAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    clearStoredAdminToken();
    throw new Error("Unauthorized");
  }

  const body: AdminMeResponse = await res.json();
  return body.data;
}

/**
 * Calls backend POST /admin/auth/logout
 */
export async function logoutAdmin(): Promise<void> {
  const url = `${API_BASE_URL}/admin/auth/logout`;
  const token = getStoredAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
    });
  } catch {
    // Ignore network error on logout
  } finally {
    clearStoredAdminToken();
  }
}
