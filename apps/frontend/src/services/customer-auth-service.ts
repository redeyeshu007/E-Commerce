/**
 * Customer Authentication & Account Service
 *
 * Provides typed frontend methods for customer registration, login, session
 * verification, logout, password reset, and Google OAuth integration.
 * Communicates with the Express backend using secure credentials and cookies.
 */

export interface CustomerShippingProfile {
  id?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isComplete: boolean;
}

export interface CustomerProfileDetails {
  id: string;
  email: string;
  fullName: string;
  isProfileComplete: boolean;
  profile: CustomerShippingProfile | null;
}

export interface SaveProfileInput {
  fullName?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country?: string;
}

export interface Customer {
  id: string;
  email: string;
  fullName: string;
  role: "customer";
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  isProfileComplete?: boolean;
  profile?: CustomerShippingProfile | null;
}

export interface CustomerAuthResponse {
  success: boolean;
  message?: string;
  data: {
    customer: Customer;
    token?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GoogleAuthUrlResponse {
  success: boolean;
  data: {
    configured: boolean;
    authUrl?: string;
    state?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

const CUSTOMER_SESSION_KEY = "peralagae_customer_data";
const CUSTOMER_TOKEN_KEY = "peralagae_customer_token";

export function getStoredCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredCustomerToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  } catch {
    // Ignore quota errors
  }
}

export function clearStoredCustomerToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

function getCustomerAuthHeaders(existing?: Record<string, string>): Record<string, string> {
  const token = getStoredCustomerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...existing,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export class CustomerAuthService {
  /**
   * Reads cached customer data from local storage for instant UI hydration
   */
  static getStoredCustomer(): Customer | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(CUSTOMER_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persists customer data in local storage
   */
  static setStoredCustomer(customer: Customer): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Clears local customer data
   */
  static clearStoredCustomer(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      clearStoredCustomerToken();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Register a new customer account
   */
  static async register(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }): Promise<Customer> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword || data.password,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409) {
        throw new Error("An account with this email address already exists. Please sign in.");
      }
      throw new Error(body?.error?.message || "Registration failed. Please check your details.");
    }

    const customer = body.data?.customer;
    const token = body.data?.token;
    if (token) {
      setStoredCustomerToken(token);
    }
    if (customer) {
      this.setStoredCustomer(customer);
    }
    return customer;
  }

  /**
   * Sign in an existing customer
   */
  static async login(data: {
    email: string;
    password: string;
  }): Promise<Customer> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Invalid email or password. Please try again.");
      }
      throw new Error(body?.error?.message || "Sign in failed. Please check your credentials.");
    }

    const customer = body.data?.customer;
    const token = body.data?.token;
    if (token) {
      setStoredCustomerToken(token);
    }
    if (customer) {
      if (body.data?.profile && !customer.profile) {
        customer.profile = body.data.profile;
      }
      this.setStoredCustomer(customer);
    }
    return customer;
  }

  /**
   * Verifies the customer session with the server
   */
  static async getMe(): Promise<Customer | null> {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: getCustomerAuthHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        this.clearStoredCustomer();
        return null;
      }

      const body = await res.json();
      const customer = body.data?.customer;
      if (customer) {
        if (body.data?.profile && !customer.profile) {
          customer.profile = body.data.profile;
        }
        if (typeof body.data?.isProfileComplete === "boolean") {
          customer.isProfileComplete = body.data.isProfileComplete;
        }
        this.setStoredCustomer(customer);
        return customer;
      }
      return null;
    } catch {
      return this.getStoredCustomer();
    }
  }

  /**
   * Sign out customer and invalidate session cookie
   */
  static async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getCustomerAuthHeaders(),
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearStoredCustomer();
      clearStoredCustomerToken();
    }
  }

  /**
   * Request password reset link
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok && res.status !== 404) {
      throw new Error(body?.error?.message || "Unable to send password reset instructions.");
    }

    return {
      success: true,
      message:
        body?.message ||
        "If an account exists with this email address, you will receive password reset instructions.",
    };
  }

  /**
   * Reset password with single-use token
   */
  static async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to reset password. The link may have expired.");
    }

    return {
      success: true,
      message: body?.message || "Password has been reset successfully. Please sign in with your new password.",
    };
  }

  /**
   * Check Google OAuth configuration and get official authorization URL
   */
  static async getGoogleAuthUrl(redirectUri?: string): Promise<GoogleAuthUrlResponse["data"]> {
    const url = redirectUri
      ? `/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`
      : "/api/auth/google/url";

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        configured: false,
      };
    }

    return (
      body.data || {
        configured: false,
      }
    );
  }

  /**
   * Retrieves the full customer profile and default shipping address
   */
  static async getProfile(): Promise<CustomerProfileDetails> {
    const res = await fetch("/api/auth/profile", {
      method: "GET",
      headers: getCustomerAuthHeaders(),
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load customer profile");
    }

    return body.data;
  }

  /**
   * Saves or updates customer profile and default shipping address
   */
  static async saveProfile(data: SaveProfileInput): Promise<CustomerProfileDetails> {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: getCustomerAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to save profile. Please check the provided information.");
    }

    // Also update stored customer if name was modified or profile completed
    const stored = this.getStoredCustomer();
    if (stored) {
      this.setStoredCustomer({
        ...stored,
        fullName: body.data.fullName || stored.fullName,
        isProfileComplete: body.data.isProfileComplete,
        profile: body.data.profile,
      });
    }

    return body.data;
  }
}
