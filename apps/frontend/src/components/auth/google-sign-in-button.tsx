"use client";

import React, { useState } from "react";
import { Loader2, Info } from "lucide-react";

export interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  disabled = false,
  className = "",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setSetupNotice(null);
    setIsLoading(true);

    try {
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;

      // 1. Check backend configuration first
      const res = await fetch(
        `/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`
      ).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.data?.configured && data?.data?.authUrl) {
          window.location.href = data.data.authUrl;
          return;
        }
      }

      // 2. Fallback to client-side public Google Client ID if available
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (googleClientId) {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          googleClientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;

        window.location.href = authUrl;
        return;
      }

      // 3. Accurately report configuration requirement if neither server nor client has client ID
      setSetupNotice(
        "Google Sign-In is pending environment configuration (NEXT_PUBLIC_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET). Please use your email and password to sign in."
      );
    } catch {
      setSetupNotice("Unable to initiate Google Sign-In. Please use your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={disabled || isLoading}
        data-testid="google-sign-in-button"
        className={`w-full h-11 sm:h-12 flex items-center justify-center gap-3 px-4 bg-white hover:bg-[#F9F9F9] active:bg-[#F0F0F0] text-[#222222] font-medium text-xs sm:text-[13px] border border-[#E5E5E5] rounded-lg transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-black disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#666666]" aria-hidden="true" />
        ) : (
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
      </button>

      {setupNotice && (
        <div
          role="status"
          data-testid="google-setup-notice"
          className="mt-2.5 p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] text-xs text-[#555555] flex items-start gap-2 leading-relaxed rounded-lg"
        >
          <Info className="h-4 w-4 shrink-0 text-[#C5A572] mt-0.5" aria-hidden="true" />
          <span>{setupNotice}</span>
        </div>
      )}
    </div>
  );
}
