"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useStorefront } from "@/providers/storefront-provider";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authReturnUrl, setAuthReturnUrl } = useStorefront();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setErrorMessage(
        errorParam === "access_denied"
          ? "Google sign-in was cancelled."
          : `Google authentication error: ${errorParam}`
      );
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code was received from Google.");
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google`;

    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message || "Google authentication failed.");
        }
        const customer = body.data?.customer;
        setStatus("success");
        setTimeout(() => {
          if (!customer?.isProfileComplete) {
            const dest = authReturnUrl
              ? `/profile/setup?returnUrl=${encodeURIComponent(authReturnUrl)}`
              : "/profile/setup";
            if (authReturnUrl) setAuthReturnUrl(null);
            window.location.href = dest;
          } else {
            const dest = authReturnUrl || "/";
            if (authReturnUrl) setAuthReturnUrl(null);
            window.location.href = dest;
          }
        }, 1200);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message || "Failed to complete Google Sign-In.");
      });
  }, [searchParams, router, authReturnUrl, setAuthReturnUrl]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#EAE6DF] shadow-lg text-center">
        {status === "processing" && (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#C5A572] mx-auto" />
            <h2 className="text-xl font-medium text-[#111111]">Completing Google Sign-In</h2>
            <p className="text-sm text-[#666666]">
              Please wait while we verify your Google identity and secure your session...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#FAF8F5] text-[#C5A572] flex items-center justify-center mx-auto border border-[#EAE6DF]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-medium text-[#111111]">Authenticated Successfully</h2>
            <p className="text-sm text-[#666666]">
              Welcome! Returning you to your destination...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto border border-[#FEE2E2]">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-medium text-[#111111]">Authentication Failed</h2>
            <p className="text-sm text-[#666666] leading-relaxed">{errorMessage}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-black hover:bg-[#222222] text-white text-xs tracking-wider uppercase rounded-lg transition-colors font-medium"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C5A572]" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
