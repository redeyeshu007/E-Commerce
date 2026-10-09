"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { AnnouncementConfig } from "@/config/navigation";

export interface AnnouncementBarProps {
  config: AnnouncementConfig;
  onDismiss?: () => void;
}

/**
 * Row One: Full-width promotional announcement bar.
 *
 * Features:
 * - Soft pastel pink background matching reference design (#FBC0CE).
 * - Guaranteed optical centering: close icon is absolutely positioned to prevent
 *   any horizontal shift or off-center alignment of the promotional text.
 * - Accessible dismiss button with keyboard navigation and ARIA attributes.
 */
export function AnnouncementBar({ config, onDismiss }: AnnouncementBarProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <aside
      aria-label="Promotional Announcement"
      className="relative w-full transition-all duration-200"
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-normal tracking-wide sm:text-[13px]">
          {config.text}
        </p>

        {config.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close announcement bar"
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-[#222222] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:right-6 lg:right-8"
          >
            <X className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}
