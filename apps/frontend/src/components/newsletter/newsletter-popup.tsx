"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2 } from "lucide-react";
import { useStorefront } from "@/providers/storefront-provider";
import {
  validateNewsletterEmail,
  submitNewsletterSubscription,
  type NewsletterSubscriptionResult,
} from "@/services/newsletter-service";

export interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  autoOpenDelayMs?: number | null;
  onSubscribe?: (email: string) => Promise<NewsletterSubscriptionResult>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function NewsletterPopup({
  isOpen,
  onClose,
  autoOpenDelayMs = 6000,
  onSubscribe,
  triggerRef,
}: NewsletterPopupProps) {
  const { openNewsletter } = useStorefront();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const openNewsletterRef = useRef(openNewsletter);

  useEffect(() => {
    openNewsletterRef.current = openNewsletter;
  }, [openNewsletter]);

  // 1. Automatic Opening 6 seconds after initial eligible load
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (autoOpenDelayMs == null || autoOpenDelayMs <= 0) return;

    try {
      const isSubscribed = localStorage.getItem("peralagae_newsletter_subscribed") === "true";
      const isDismissed = sessionStorage.getItem("peralagae_newsletter_dismissed") === "true";

      if (isSubscribed || isDismissed) {
        return;
      }
    } catch {
      // Ignore private mode access errors
    }

    const timer = setTimeout(() => {
      try {
        const isSubscribed = localStorage.getItem("peralagae_newsletter_subscribed") === "true";
        const isDismissed = sessionStorage.getItem("peralagae_newsletter_dismissed") === "true";
        if (!isSubscribed && !isDismissed) {
          openNewsletterRef.current();
        }
      } catch {
        openNewsletterRef.current();
      }
    }, autoOpenDelayMs);

    return () => clearTimeout(timer);
  }, [autoOpenDelayMs]);

  // 2. Lock body scroll while popup is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 3. Auto-focus email input after opening transition
  useEffect(() => {
    if (isOpen && !isSuccess) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSuccess]);

  // 4. Handle Close & Dismissal Persistence
  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    try {
      sessionStorage.setItem("peralagae_newsletter_dismissed", "true");
    } catch {
      // Ignore
    }
    onClose();
    setTimeout(() => {
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }, 50);
  }, [isSubmitting, onClose, triggerRef]);

  // 5. Escape Key Handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // 6. Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    const validationError = validateNewsletterEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = onSubscribe
        ? await onSubscribe(email.trim())
        : await submitNewsletterSubscription(email.trim());

      if (result.success) {
        setIsSuccess(true);
        try {
          localStorage.setItem("peralagae_newsletter_subscribed", "true");
        } catch {
          // Ignore
        }
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <Dialog.Portal>
        {/* Subtle Semi-Transparent Blurred Backdrop */}
        <Dialog.Overlay
          data-testid="newsletter-popup-backdrop"
          onClick={handleClose}
          className="newsletter-modal-backdrop fixed inset-0 z-50 bg-black/45 backdrop-blur-xs cursor-pointer"
        />

        {/* Centered Modal Container */}
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto pointer-events-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <Dialog.Content
            data-testid="newsletter-popup-content"
            aria-labelledby="newsletter-popup-title"
            aria-describedby="newsletter-popup-description"
            className="newsletter-modal-content pointer-events-auto relative w-full max-w-[780px] md:max-w-[820px] max-h-[92vh] flex flex-col md:flex-row overflow-hidden rounded-none sm:rounded-[2px] border border-[#E5E0D8] bg-white shadow-xl focus:outline-none"
          >
            {/* Accessible Close Button in Top-Right Corner */}
            <button
              type="button"
              onClick={handleClose}
              data-testid="newsletter-popup-close-btn"
              aria-label="Close newsletter popup"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[#777777] transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              <X className="h-4.5 w-4.5 stroke-[1.5]" aria-hidden="true" />
            </button>

            {/* Left Column — Realistic Fine Jewellery Imagery */}
            <div className="relative sm:w-5/12 md:w-1/2 min-h-[180px] sm:min-h-[440px] flex-none overflow-hidden bg-[#F7F5F0]">
              <Image
                src="/images/hero/banner-necklaces.jpg"
                alt="PERALAGAE Fine Jewellery Collection"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover object-center"
              />
            </div>

            {/* Right Column — Editorial Content & Subscription Form */}
            <div className="relative sm:w-7/12 md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-center text-left bg-white">
              {isSuccess ? (
                /* Success Confirmation State */
                <div data-testid="newsletter-popup-success" className="py-4 text-center sm:text-left">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF5F6] text-[#C5A572] mb-3">
                    <Check className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                  </div>
                  <h3
                    id="newsletter-popup-title"
                    className="text-xl sm:text-2xl font-serif font-medium text-[#111111] leading-tight"
                  >
                    You&apos;re on the list.
                  </h3>
                  <p
                    id="newsletter-popup-description"
                    className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed"
                  >
                    Thank you for joining the PERALAGAE Circle. Look forward to curated inspirations and private previews in your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-none sm:rounded-[2px] bg-[#111111] px-6 text-xs font-semibold tracking-[0.15em] uppercase text-white transition-colors hover:bg-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                /* Subscription Form State */
                <>
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#C5A572] uppercase">
                    A LITTLE LUXURY
                  </span>

                  <h3
                    id="newsletter-popup-title"
                    className="mt-2 text-xl sm:text-2xl font-serif font-medium text-[#111111] leading-tight"
                  >
                    Join the PERALAGAE Circle
                  </h3>

                  <p
                    id="newsletter-popup-description"
                    className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed"
                  >
                    Discover new collections, jewellery inspiration, and exclusive updates delivered to your inbox.
                  </p>

                  <form onSubmit={handleSubmit} data-testid="newsletter-popup-form" className="mt-5 space-y-3" noValidate>
                    <div>
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Enter your email address"
                        aria-label="Email address"
                        data-testid="newsletter-popup-email-input"
                        disabled={isSubmitting}
                        className="h-11 sm:h-12 w-full rounded-none sm:rounded-[2px] border border-[#DCD7CD] bg-white px-3.5 text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] transition-colors focus:border-[#C5A572] focus:outline-none focus:ring-1 focus:ring-[#C5A572] disabled:opacity-60"
                        autoComplete="email"
                        spellCheck="false"
                      />
                      {error && (
                        <p
                          role="alert"
                          data-testid="newsletter-popup-error"
                          className="mt-1.5 text-xs text-[#D9383A] text-left"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="newsletter-popup-submit-btn"
                      className="flex h-11 sm:h-12 w-full items-center justify-center rounded-none sm:rounded-[2px] bg-[#111111] text-xs font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin stroke-[2]" aria-hidden="true" />
                          <span>Subscribing…</span>
                        </span>
                      ) : (
                        <span>SUBSCRIBE</span>
                      )}
                    </button>

                    <p className="text-[10px] sm:text-[11px] text-[#888888] leading-normal pt-1">
                      By subscribing, you agree to receive updates from PERALAGAE.
                    </p>
                  </form>
                </>
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
