"use client";

import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface AuthFormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  isPassword?: boolean;
  containerClassName?: string;
}

export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(
  (
    {
      id,
      label,
      error,
      isPassword = false,
      type = "text",
      containerClassName = "",
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : (type || "text");
    const errorId = `${id}-error`;

    return (
      <div className={`w-full ${containerClassName}`}>
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-[0.06em] text-[#222222] mb-1.5"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`w-full h-11 sm:h-12 px-3.5 sm:px-4 text-sm text-[#111111] placeholder:text-[#999999] bg-white border transition-colors duration-200 outline-none rounded-lg disabled:bg-[#F5F5F5] disabled:cursor-not-allowed ${
              error
                ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                : "border-[#E5E5E5] hover:border-[#CCCCCC] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
            } ${isPassword ? "pr-11" : ""} ${className}`}
            {...props}
            type={resolvedType}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={disabled}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 h-full w-11 flex items-center justify-center rounded-r-lg text-[#777777] hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 stroke-[1.75]" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4 stroke-[1.75]" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5 font-normal leading-tight"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthFormField.displayName = "AuthFormField";
