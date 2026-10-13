"use client";

import { useEffect } from "react";
import { scrollToSectionId } from "@/lib/navigation";

/**
 * Handles incoming in-page section anchors when landing on the homepage,
 * including direct visits, refreshes, and transitions from other pages.
 */
export function HomePageAnchorManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnchor = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const targetId = hash.replace("#", "");

      // Execute after frame to ensure all section components are mounted
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToSectionId(targetId, { updateHash: false });
        }, 60);
      });
    };

    handleAnchor();
    window.addEventListener("hashchange", handleAnchor);
    window.addEventListener("popstate", handleAnchor);

    return () => {
      window.removeEventListener("hashchange", handleAnchor);
      window.removeEventListener("popstate", handleAnchor);
    };
  }, []);

  return null;
}
