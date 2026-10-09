"use client";

import { useEffect, useRef } from "react";

export interface AnimatedTabTitleProps {
  /**
   * Final settled brand title to display in the tab.
   * Defaults to "Javix Jewellery" (clean Title Case, no all-caps).
   */
  baseTitle?: string;
  /**
   * Custom frames for title morphing during loading.
   */
  frames?: string[];
  /**
   * Interval in milliseconds between title frame changes.
   */
  intervalMs?: number;
}

const DEFAULT_FRAMES = ["Javix", "Javix ⟡ Jewellery", "Javix Jewellery"];

/**
 * AnimatedTabTitle
 *
 * Drives both the browser tab title and tab favicon:
 * 1. Favicon: Ensures the tab icon is a luxury black disc with the "J" monogram (never the Next.js "N" logo).
 * 2. Title: Elegant Title Case ("Javix Jewellery") — no full uppercase.
 * 3. Graceful settlement: Settles on crisp static "J" icon and "Javix Jewellery".
 */
export function AnimatedTabTitle({
  baseTitle = "Javix Jewellery",
  frames = DEFAULT_FRAMES,
  intervalMs = 800,
}: AnimatedTabTitleProps) {
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    isDestroyedRef.current = false;

    // Ensure favicon points to the luxury J monogram icon, never Next.js "N"
    const updateFavicon = (href: string) => {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.type = href.endsWith(".svg") ? "image/svg+xml" : "image/x-icon";
      link.href = href;
    };

    updateFavicon("/icon.svg");

    // Respect user's reduced-motion preference
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      document.title = baseTitle;
      return;
    }

    // Dynamic title animation sequence during page intro
    let frameIndex = 0;
    document.title = frames[0] ?? baseTitle;

    const timer = setInterval(() => {
      if (isDestroyedRef.current) return;

      frameIndex++;
      if (frameIndex < frames.length) {
        document.title = frames[frameIndex] ?? baseTitle;
      } else {
        document.title = baseTitle;
        clearInterval(timer);
      }
    }, intervalMs);

    return () => {
      isDestroyedRef.current = true;
      clearInterval(timer);
      document.title = baseTitle;
      updateFavicon("/icon.svg");
    };
  }, [baseTitle, frames, intervalMs]);

  return null;
}

export default AnimatedTabTitle;
