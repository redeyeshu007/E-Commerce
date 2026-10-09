"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Component as GeometricLoader } from "@/components/ui/loader-2";

export type LoaderVariant = "inline" | "section" | "fullscreen";
export type LoaderSize = "sm" | "md" | "lg";
export type LoaderShape = "all" | "circle" | "triangle" | "rect";

export interface AppLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Layout presentation variant.
   * - "inline": Compact, non-blocking for small elements (search, badges, buttons).
   * - "section": Block level with padding for panels and grids (default).
   * - "fullscreen": Semi-transparent overlay for page-level state transitions.
   */
  variant?: LoaderVariant;
  /**
   * Size scaling of the geometric animation.
   * - "sm": Compact 65% scale.
   * - "md": Standard 100% scale (matches original specification).
   * - "lg": Prominent 125% scale.
   */
  size?: LoaderSize;
  /**
   * Which geometric shape(s) to render.
   * Defaults to "all" (the supplied 3 shapes: circle, triangle, rectangle).
   */
  shape?: LoaderShape;
  /**
   * Accessible status text for screen readers (ARIA).
   * Defaults to "Loading...".
   */
  label?: string;
  /**
   * Optional visible message displayed beneath or beside the loader.
   */
  message?: string;
}

/**
 * JAVIX JEWELLERY Centralized Reusable Loader
 *
 * Implements accessible, scoped loading states across inline, section,
 * and page scopes while preserving the supplied Aaron Iker geometric animation.
 */
export function AppLoader({
  variant = "section",
  size,
  shape = "all",
  label = "Loading...",
  message,
  className,
  ...props
}: AppLoaderProps) {
  // Determine default sizing based on variant if not explicitly provided
  const resolvedSize: LoaderSize = size ?? (variant === "inline" ? "sm" : "md");

  const containerClasses = {
    inline: "inline-flex items-center gap-2.5 text-sm text-[#444444] select-none",
    section: "flex flex-col items-center justify-center py-12 min-h-[200px] w-full text-center",
    fullscreen:
      "fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-4 text-center",
  }[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="app-loader"
      data-variant={variant}
      className={cn(containerClasses, className)}
      {...props}
    >
      <GeometricLoader size={resolvedSize} shape={shape} />

      {/* Screen-reader-only accessible label */}
      <span className="sr-only">{label}</span>

      {/* Visible caption / feedback message */}
      {message && (
        <p
          className={cn(
            "font-sans font-medium text-[#333333] transition-opacity",
            variant === "inline" ? "text-xs" : "mt-4 text-sm tracking-wide",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Convenient variant helper for section-level loading (e.g. product grids, cards).
 */
export function SectionLoader(props: Omit<AppLoaderProps, "variant">) {
  return <AppLoader variant="section" {...props} />;
}

/**
 * Convenient variant helper for inline loading (e.g. search bars, small buttons).
 */
export function InlineLoader(props: Omit<AppLoaderProps, "variant">) {
  return <AppLoader variant="inline" {...props} />;
}

/**
 * Convenient variant helper for full-page loading transitions.
 */
export function FullscreenLoader(props: Omit<AppLoaderProps, "variant">) {
  return <AppLoader variant="fullscreen" {...props} />;
}

export const LoadingIndicator = AppLoader;
export default AppLoader;
