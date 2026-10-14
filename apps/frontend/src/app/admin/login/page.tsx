"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Loader2 } from "lucide-react";
import { loginAdmin, getAdminSession } from "@/services/admin-auth-service";
import { brandConfig } from "@/config/brand";

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
      <main className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <p className="text-xs uppercase tracking-widest text-[#777777] font-medium">
            Verifying Admin Session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Wordmark */}
        <span className="text-2xl sm:text-3xl font-semibold tracking-[0.2em] text-[#111111] uppercase block font-jost">
          {brandConfig.name}
        </span>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-[#C5A572] font-medium">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Restricted Portal</span>
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl font-normal tracking-wide text-[#111111]">
          Admin Login
        </h1>
        <p className="mt-1 text-xs text-[#777777]">
          Sign in with authorized administrative credentials to manage platform operations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#EAE6DF] sm:px-10">
          {/* Error Message Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-none flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
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
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#D5D0C7] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors rounded-none disabled:opacity-50"
                />
              </div>
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
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
                  className="block w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-[#D5D0C7] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors rounded-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-xs font-medium uppercase tracking-[0.15em] text-white bg-[#111111] hover:bg-[#C5A572] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Portal</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer Note */}
        <p className="mt-6 text-center text-[11px] text-[#888888] tracking-wider uppercase">
          PERALAGAE Secure Administrative Gateway • Authorized Access Only
        </p>
      </div>
    </main>
  );
}
