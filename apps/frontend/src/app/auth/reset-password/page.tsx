"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { CustomerAuthService } from "@/services/customer-auth-service";
import { useStorefront } from "@/providers/storefront-provider";

const resetPasswordPageSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordPageFormData = z.infer<typeof resetPasswordPageSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { openAuthModal } = useStorefront();
  const router = useRouter();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordPageFormData>({
    resolver: zodResolver(resetPasswordPageSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordPageFormData) => {
    if (!token) {
      setFormError("Reset token is missing from the URL. Please request a new link.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await CustomerAuthService.resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-[440px] w-full bg-white p-6 sm:p-9 rounded-2xl border border-[#EAE6DF] shadow-xl text-center">
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

        {isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="h-12 w-12 rounded-full bg-[#FAF8F5] text-[#C5A572] flex items-center justify-center mx-auto border border-[#EAE6DF]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-normal text-[#111111]">Password Reset Complete</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Your password has been securely updated. You can now sign in with your new credentials.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  openAuthModal("login");
                }}
                className="w-full h-11 bg-black hover:bg-[#222222] text-white text-xs tracking-wider uppercase font-medium rounded-lg transition-colors"
              >
                Sign In to Account
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-normal text-[#111111] mb-1">Set New Password</h2>
            <p className="text-xs sm:text-[13px] text-[#666666] mb-6 font-normal">
              Enter and confirm your new secure password below.
            </p>

            {formError && (
              <div
                role="alert"
                className="mb-5 p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] rounded-lg flex items-start gap-2 text-left"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {!token && (
              <div
                role="alert"
                className="mb-5 p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] rounded-lg flex items-start gap-2 text-left"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>No reset token provided in URL. Please request a new password reset.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-[#444444] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  disabled={isSubmitting || !token}
                  className="w-full h-11 px-3 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#444444] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  disabled={isSubmitting || !token}
                  className="w-full h-11 px-3 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                  placeholder="Repeat your new password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full h-11 bg-black hover:bg-[#222222] disabled:opacity-50 text-white text-xs tracking-wider uppercase font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C5A572]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
