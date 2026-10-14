"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAdmin, getAdminSession } from "@/services/admin-auth-service";
import { brandConfig } from "@/config/brand";

/**
 * Minimal Admin Login Page
 *
 * Requirements:
 * - Minimal white-and-neutral visual design
 * - White page background, dark charcoal text, subtle light-grey borders
 * - PERALAGAE brand logo and Admin Login heading
 * - Email field, password field with show/hide toggle, and Login button
 * - Clean loading and invalid-credential feedback states
 * - Backend authentication using server-side credentials
 * - Redirect to /admin/dashboard on success or if already authenticated
 */
export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect immediately to /admin/dashboard
  useEffect(() => {
    let isMounted = true;
    async function checkExistingAuth() {
      try {
        await getAdminSession();
        if (isMounted) {
          router.replace("/admin/dashboard");
        }
      } catch {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }
    checkExistingAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your admin email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      await loginAdmin({ email: trimmedEmail, password });
      router.replace("/admin/dashboard");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials."
      );
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C5A572]" />
          <p className="text-xs uppercase tracking-widest text-[#888888] font-medium">
            Verifying Admin Session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white text-[#1A1A1A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <span className="text-2xl font-medium tracking-[0.2em] text-[#1A1A1A] uppercase block">
            {brandConfig.name}
          </span>
          <span className="mt-1 text-[11px] font-medium tracking-widest uppercase text-[#888888] block">
            ADMIN
          </span>
          <h1 className="mt-5 text-xl font-medium tracking-tight text-[#1A1A1A]">
            Admin Login
          </h1>
          <p className="mt-1.5 text-xs text-[#666666]">
            Enter your credentials to access the administration panel.
          </p>
        </div>

        {/* Login Form Container */}
        <div className="mt-8 border border-[#E5E7EB] bg-white p-6 sm:p-8">
          {/* Validation / Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3 bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium uppercase tracking-wider text-[#333333] mb-1.5"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@peralagae.com"
                className="block w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-colors rounded-none disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium uppercase tracking-wider text-[#333333] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-colors rounded-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-[#1A1A1A] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 text-xs font-medium uppercase tracking-[0.15em] text-white bg-[#1A1A1A] hover:bg-[#C5A572] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
