"use client";

import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { NavigationConfig } from "@/config/navigation";

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  config: NavigationConfig;
}

/**
 * Mobile Navigation Drawer.
 *
 * Implements:
 * - Clean slide-out panel from left with backdrop.
 * - Body scroll locking and restoration.
 * - Keyboard escape dismissal.
 * - Accessible focus handling and ARIA dialog semantics.
 * - Respects prefers-reduced-motion.
 */
export function MobileNavigation({ isOpen, onClose, config }: MobileNavigationProps) {
  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex lg:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl transition-transform duration-300 motion-reduce:transition-none">
        {/* Header inside drawer */}
        <div className="flex h-16 items-center justify-between border-b border-[#E5E5E5] px-6">
          <span className="text-xl font-medium tracking-[0.2em] text-[#111111] uppercase">
            {config.brand.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <X className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Primary Navigation Links */}
          <nav aria-label="Mobile Primary Navigation" className="mb-8">
            <h2 className="sr-only">Main Menu</h2>
            <ul className="space-y-4" role="list">
              {config.primaryNav.map((item) => (
                <li key={item.id}>
                  {item.isImplemented && item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block text-base font-medium tracking-wide text-[#222222] transition-colors hover:text-black"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className="block text-base font-medium tracking-wide text-[#555555] transition-colors hover:text-black cursor-default"
                      title={`${item.label} (Coming Soon)`}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <hr className="my-6 border-[#E5E5E5]" />

          {/* Utility Links */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black">
              Information & Services
            </h3>
            <ul className="space-y-3 text-sm text-black" role="list">
              {config.utility.links.map((link) => (
                <li key={link.id}>
                  {link.isImplemented && link.href ? (
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block transition-opacity hover:opacity-75"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span
                      className="block cursor-default text-black hover:opacity-75"
                      title={`${link.label} (Coming Soon)`}
                    >
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <hr className="my-6 border-[#E5E5E5]" />

          {/* Language & Currency info */}
          <div className="space-y-2 text-xs text-black">
            <div>
              <span className="font-medium text-neutral-500">Language:</span>{" "}
              {config.utility.language}
            </div>
            <div>
              <span className="font-medium text-neutral-500">Currency:</span>{" "}
              {config.utility.currencySymbol} {config.utility.currency}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
