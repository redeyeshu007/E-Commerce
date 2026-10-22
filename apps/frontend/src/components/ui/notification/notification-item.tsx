"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import type { NotificationItem } from "./notification-types";

interface NotificationItemProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
}

const DEFAULT_DURATION = 3200; // ~3 seconds

export function NotificationPopupItem({
  notification,
  onDismiss,
}: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const remainingTimeRef = useRef<number>(
    notification.duration ?? DEFAULT_DURATION
  );
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    // Give time for exit animation to complete before removing from state
    setTimeout(() => {
      onDismiss(notification.id);
    }, 220);
  }, [notification.id, onDismiss]);

  const startDismissTimer = useCallback(() => {
    if (remainingTimeRef.current <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      triggerDismiss();
    }, remainingTimeRef.current);
  }, [triggerDismiss]);

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Set up auto-dismiss timer on mount
  useEffect(() => {
    startDismissTimer();
    return () => {
      clearDismissTimer();
    };
  }, [startDismissTimer, clearDismissTimer]);

  // Pause timer on hover
  const handleMouseEnter = () => {
    clearDismissTimer();
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  // Resume timer on mouse leave
  const handleMouseLeave = () => {
    if (!isExiting && remainingTimeRef.current > 0) {
      startDismissTimer();
    }
  };

  // Icon and badge styling tailored to PERALAGAE luxury design
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-[#15803D]",
      badgeBg: "bg-[#F0FDF4] border-[#DCFCE7]",
      role: "status" as const,
      ariaLive: "polite" as const,
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-[#DC2626]",
      badgeBg: "bg-[#FEF2F2] border-[#FEE2E2]",
      role: "alert" as const,
      ariaLive: "assertive" as const,
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-[#D97706]",
      badgeBg: "bg-[#FFFBEB] border-[#FEF3C7]",
      role: "status" as const,
      ariaLive: "polite" as const,
    },
    info: {
      icon: Info,
      iconColor: "text-[#C5A572]",
      badgeBg: "bg-[#FAF8F5] border-[#EAE6DF]",
      role: "status" as const,
      ariaLive: "polite" as const,
    },
  }[notification.type];

  const IconComponent = typeConfig.icon;

  return (
    <div
      role={typeConfig.role}
      aria-live={typeConfig.ariaLive}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto w-full max-w-sm rounded-xl border border-[#E8E8E8] bg-white p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all ${
        isExiting ? "popup-notification-exiting" : "popup-notification-entering"
      }`}
      data-notification-id={notification.id}
      data-notification-type={notification.type}
    >
      <div className="flex items-start gap-3">
        {/* Subtle Luxury Status Icon Badge */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${typeConfig.badgeBg} ${typeConfig.iconColor}`}
        >
          <IconComponent className="h-4 w-4 stroke-[2]" />
        </div>

        {/* Message and Description */}
        <div className="flex-1 pt-0.5">
          <p className="text-xs sm:text-sm font-medium text-[#111111] leading-snug">
            {notification.message}
          </p>
          {notification.description && (
            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
              {notification.description}
            </p>
          )}

          {/* Optional Action */}
          {notification.action && (
            <div className="mt-2.5">
              {notification.action.href ? (
                <Link
                  href={notification.action.href}
                  onClick={() => triggerDismiss()}
                  className="text-xs font-medium text-[#C5A572] hover:underline underline-offset-2 transition-colors"
                >
                  {notification.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    notification.action?.onClick?.();
                    triggerDismiss();
                  }}
                  className="text-xs font-medium text-[#C5A572] hover:underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual Dismiss Button */}
        <button
          type="button"
          onClick={triggerDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 -mr-1 -mt-1 p-1.5 text-[#999999] hover:text-[#111111] rounded-lg transition-colors hover:bg-neutral-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <X className="h-4 w-4 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
}
