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

  const renderAnnouncementContent = () => {
    if (config.text.includes(",")) {
      const [firstPart, ...rest] = config.text.split(",");
      return (
        <>
          <span className="block sm:inline">{firstPart},</span>{" "}
          <span className="block sm:inline">{rest.join(",").trim()}</span>
        </>
      );
    }
    return config.text;
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
      <div className="mx-auto flex min-h-[44px] max-w-7xl items-center justify-center py-2 px-8 sm:px-10 lg:h-11 lg:py-0 lg:px-8">
        <p className="text-center text-xs font-normal leading-snug tracking-wide sm:text-[13px] lg:text-[14px]">
          {renderAnnouncementContent()}
        </p>

        {config.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close announcement bar"
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-[#222222] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:right-6 lg:right-8"
          >
            <X className="h-3.5 w-3.5 lg:h-4 lg:w-4 stroke-[1.75]" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}
