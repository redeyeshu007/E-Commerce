"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { registerSchema, type RegisterFormData } from "./auth-schemas";
import { AuthFormField } from "./auth-form-field";
import { GoogleSignInButton } from "./google-sign-in-button";

export interface RegisterFormProps {
  initialEmail?: string;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
  onEmailChange?: (email: string) => void;
}

export function RegisterForm({
  initialEmail = "",
  onSwitchToLogin,
  onSuccess,
  onEmailChange,
}: RegisterFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: initialEmail,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setFormError("An account with this email address already exists. Please sign in.");
        } else if (res.status === 404) {
          setFormError("Customer registration is not available in this phase. Only administrative authentication is currently enabled.");
        } else {
          setFormError("Unable to create account at this time. Please try again later.");
        }
        setIsSubmitting(false);
        return;
      }

      const result = await res.json();
      if (result.success) {
        onSuccess?.();
      } else {
        setFormError(result.message || "Failed to create account. Please check your information.");
      }
    } catch {
      setFormError("Unable to connect to registration server. Please verify your connection.");
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
        Create Your Account
      </h2>
      <p
        id="auth-modal-description"
        className="text-xs sm:text-[13px] text-[#666666] text-center mt-1 sm:mt-1.5 mb-6 max-w-xs font-normal"
      >
        Join Peralagae and discover jewellery crafted for your moments.
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3.5" noValidate>
        {/* Full Name */}
        <AuthFormField
          id="register-fullname"
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Aanya Sharma"
          disabled={isSubmitting}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {/* Email Address */}
        <AuthFormField
          id="register-email"
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
        <AuthFormField
          id="register-password"
          label="Password"
          isPassword
          autoComplete="new-password"
          placeholder="At least 8 characters with letters & numbers"
          disabled={isSubmitting}
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Confirm Password */}
        <AuthFormField
          id="register-confirm-password"
          label="Confirm Password"
          isPassword
          autoComplete="new-password"
          placeholder="Re-enter your password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {/* NOTE: Strictly NO "Remember me" checkbox per requirements */}

        {/* Primary Create Account Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="register-submit-button"
          className="w-full h-11 sm:h-12 bg-[#111111] hover:bg-black active:bg-[#222222] text-white text-xs sm:text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 flex items-center justify-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Elegant Divider: OR */}
      <div className="w-full flex items-center my-4 sm:my-5">
        <div className="flex-1 h-px bg-[#EAE6DF]" />
        <span className="px-3 text-[11px] font-medium tracking-[0.08em] text-[#999999] uppercase select-none">
          OR
        </span>
        <div className="flex-1 h-px bg-[#EAE6DF]" />
      </div>

      {/* Google Sign In */}
      <GoogleSignInButton disabled={isSubmitting} />

      {/* Bottom Switch to Login */}
      <div className="mt-5 sm:mt-6 text-center text-xs sm:text-[13px] text-[#666666]">
        <span>Already have an account?{" "}</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#111111] hover:text-[#C5A572] font-semibold underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
