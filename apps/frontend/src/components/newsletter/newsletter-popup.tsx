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
          className="newsletter-modal-backdrop fixed inset-0 z-50 bg-black/55 backdrop-blur-xs cursor-pointer"
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
            className="newsletter-modal-content pointer-events-auto relative w-full max-w-[1080px] max-h-[92vh] flex flex-col md:flex-row overflow-hidden rounded-none sm:rounded-[2px] border border-[#C5A572]/35 bg-white shadow-2xl focus:outline-none"
          >
            {/* Accessible Minimalist Close Button in Top-Right Corner */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="newsletter-popup-close-btn"
              aria-label="Close newsletter popup"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full text-[#888888] transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>

            {/* Left Column — Full-Bleed Luxury Jewellery Editorial Photography */}
            <div className="relative w-full md:w-[48%] min-h-[260px] sm:min-h-[340px] md:min-h-[540px] flex-none overflow-hidden bg-[#F7F5F0]">
              <Image
                src="/images/editorial/garden-variety.jpg"
                alt="PERALAGAE Fine Jewellery Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 540px"
                className="object-cover object-[center_top] select-none"
              />
            </div>

            {/* Right Column — Editorial Content & Premium Subscription Form */}
            <div className="relative w-full md:w-[52%] p-8 sm:p-12 md:p-12 lg:p-14 flex flex-col justify-center text-left bg-white overflow-y-auto">
              {isSuccess ? (
                /* Success Confirmation State */
                <div data-testid="newsletter-popup-success" className="py-4 text-center sm:text-left">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF5F0] text-[#C5A572] mb-4 border border-[#C5A572]/20">
                    <Check className="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="h-[1.5px] w-5 sm:w-6 bg-[#C5A572]" aria-hidden="true" />
                    <span className="text-[11px] font-semibold tracking-[0.25em] text-[#C5A572] uppercase">
                      WELCOME TO THE CIRCLE
                    </span>
                  </div>
                  <h3
                    id="newsletter-popup-title"
                    className="text-2xl sm:text-3xl font-serif font-normal text-[#111111] leading-tight"
                  >
                    You&apos;re on the list.
                  </h3>
                  <p
                    id="newsletter-popup-description"
                    className="mt-3 text-xs sm:text-sm text-[#555555] leading-relaxed max-w-[420px]"
                  >
                    Thank you for joining the PERALAGAE Circle. Look forward to curated inspirations and private previews in your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-7 inline-flex h-12 sm:h-13 items-center justify-center rounded-none sm:rounded-[2px] bg-[#111111] px-8 text-xs font-semibold tracking-[0.2em] uppercase text-white transition-colors duration-300 hover:bg-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                /* Subscription Form State */
                <>
                  {/* Subtle Champagne Gold Eyebrow Accent */}
                  <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                    <span className="h-[1.5px] w-5 sm:w-6 bg-[#C5A572]" aria-hidden="true" />
                    <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#C5A572] uppercase">
                      A LITTLE LUXURY
                    </span>
                  </div>

                  <h3
                    id="newsletter-popup-title"
                    className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#111111] leading-[1.18] tracking-tight"
                  >
                    Join the PERALAGAE Circle
                  </h3>

                  <p
                    id="newsletter-popup-description"
                    className="mt-3 sm:mt-3.5 text-xs sm:text-sm lg:text-[15px] text-[#555555] leading-relaxed max-w-[430px]"
                  >
                    Discover new collections, jewellery inspiration, and exclusive updates delivered to your inbox.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    data-testid="newsletter-popup-form"
                    className="mt-6 sm:mt-7 space-y-3.5 sm:space-y-4"
                    noValidate
                  >
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
                        className="h-[52px] sm:h-[56px] w-full rounded-none sm:rounded-[2px] border border-[#DCD7CD] bg-white px-4 sm:px-5 text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] transition-all duration-200 focus:border-[#C5A572] focus:outline-none focus:ring-1 focus:ring-[#C5A572] disabled:opacity-60"
                        autoComplete="email"
                        spellCheck="false"
                      />
                      {error && (
                        <p
                          role="alert"
                          data-testid="newsletter-popup-error"
                          className="mt-2 text-xs text-[#D9383A] text-left font-medium"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="newsletter-popup-submit-btn"
                      className="flex h-[52px] sm:h-[56px] w-full items-center justify-center rounded-none sm:rounded-[2px] bg-[#111111] text-xs sm:text-[13px] font-medium tracking-[0.22em] uppercase text-white transition-colors duration-300 hover:bg-[#C5A572] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-75"
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

                    <p className="text-[11px] sm:text-xs text-[#888888] leading-normal pt-0.5">
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
