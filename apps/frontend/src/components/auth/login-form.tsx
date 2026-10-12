"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormData } from "./auth-schemas";
import { AuthFormField } from "./auth-form-field";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface LoginFormProps {
  initialEmail?: string;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess?: () => void;
  onEmailChange?: (email: string) => void;
}

export function LoginForm({
  initialEmail = "",
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSuccess,
  onEmailChange,
}: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Connect to auth backend endpoint boundary
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setFormError("Invalid email or password. Please try again.");
        } else if (res.status === 404) {
          // In a frontend-only environment or if backend auth router is pending
          setFormError("Authentication service is currently being configured on the backend. Please check back shortly.");
        } else {
          setFormError("An unexpected error occurred. Please try again later.");
        }
        setIsSubmitting(false);
        return;
      }

      const result = await res.json();
      if (result.success) {
        onSuccess?.();
      } else {
        setFormError(result.message || "Failed to sign in. Please verify your credentials.");
      }
    } catch {
      // Handles network failure or pending backend route gracefully
      setFormError("Unable to connect to authentication server. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Brand Logo */}
      <div className="mb-4 sm:mb-5">
        <Image
          src="/images/logo/peralagae-logo.png"
          alt="PERALAGAE"
          width={180}
          height={74}
          className="h-10 sm:h-12 w-auto object-contain mx-auto"
          priority
        />
      </div>

      {/* Heading & Supporting Text */}
      <h2
        id="auth-modal-title"
        className="text-xl sm:text-2xl font-normal text-[#111111] tracking-[-0.01em] text-center"
      >
        Welcome Back
      </h2>
      <p
        id="auth-modal-description"
        className="text-xs sm:text-[13px] text-[#666666] text-center mt-1 sm:mt-1.5 mb-6 max-w-xs font-normal"
      >
        Sign in to continue your jewellery journey.
      </p>

      {/* Form Error Banner */}
      {formError && (
        <div
          role="alert"
          data-testid="auth-error-banner"
          className="w-full mb-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 leading-relaxed rounded-lg"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4" noValidate>
        {/* Email Address */}
        <AuthFormField
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="your.name@example.com"
          disabled={isSubmitting}
          error={errors.email?.message}
          {...register("email", {
            onChange: (e) => onEmailChange?.(e.target.value),
          })}
        />

        {/* Password */}
        <div>
          <AuthFormField
            id="login-password"
            label="Password"
            isPassword
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register("password")}
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-[#666666] hover:text-[#111111] hover:underline underline-offset-2 transition-colors font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* NOTE: Strictly NO "Remember me" checkbox anywhere per requirements */}

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="login-submit-button"
          className="w-full h-11 sm:h-12 bg-[#111111] hover:bg-black active:bg-[#222222] text-white text-xs sm:text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 flex items-center justify-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Elegant Divider: OR */}
      <div className="w-full flex items-center my-5">
        <div className="flex-1 h-px bg-[#EAE6DF]" />
        <span className="px-3 text-[11px] font-medium tracking-[0.08em] text-[#999999] uppercase select-none">
          OR
        </span>
        <div className="flex-1 h-px bg-[#EAE6DF]" />
      </div>

      {/* Google Sign In */}
      <GoogleSignInButton disabled={isSubmitting} />

      {/* Bottom Switch to Register */}
      <div className="mt-6 text-center text-xs sm:text-[13px] text-[#666666]">
        <span>New to Peralagae?{" "}</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#111111] hover:text-[#C5A572] font-semibold underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
