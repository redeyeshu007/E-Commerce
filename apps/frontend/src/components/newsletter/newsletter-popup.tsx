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
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
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
      const isPermanentlyDismissed =
        localStorage.getItem("peralagae_newsletter_dismissed_permanently") === "true";

      if (isSubscribed || isDismissed || isPermanentlyDismissed) {
        return;
      }
    } catch {
      // Ignore private mode access errors
    }

    const timer = setTimeout(() => {
      try {
        const isSubscribed = localStorage.getItem("peralagae_newsletter_subscribed") === "true";
        const isDismissed = sessionStorage.getItem("peralagae_newsletter_dismissed") === "true";
        const isPermanentlyDismissed =
          localStorage.getItem("peralagae_newsletter_dismissed_permanently") === "true";
        if (!isSubscribed && !isDismissed && !isPermanentlyDismissed) {
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
      if (doNotShowAgain) {
        localStorage.setItem("peralagae_newsletter_dismissed_permanently", "true");
      }
    } catch {
      // Ignore
    }
    onClose();
    setTimeout(() => {
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }, 50);
  }, [isSubmitting, doNotShowAgain, onClose, triggerRef]);

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

  const handleToggleDoNotShowAgain = (checked: boolean) => {
    setDoNotShowAgain(checked);
    try {
      if (checked) {
        localStorage.setItem("peralagae_newsletter_dismissed_permanently", "true");
      } else {
        localStorage.removeItem("peralagae_newsletter_dismissed_permanently");
      }
    } catch {
      // Ignore
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
        {/* Dark Translucent Overlay Behind Popup */}
        <Dialog.Overlay
          data-testid="newsletter-popup-backdrop"
          onClick={handleClose}
          className="newsletter-modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
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
            className="newsletter-modal-content pointer-events-auto relative w-full max-w-[820px] flex flex-col md:flex-row overflow-hidden rounded-none border border-[#E0E0E0] bg-white shadow-2xl focus:outline-none"
          >
            {/* Minimalist Close Button in Upper-Right Corner */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="newsletter-popup-close-btn"
              aria-label="Close newsletter popup"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex h-8 w-8 items-center justify-center text-[#777777] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>

            {/* Left Column — Full-Bleed Jewellery Editorial Photography (~44% width) */}
            <div className="relative w-full md:w-[44%] min-h-[220px] sm:min-h-[280px] md:min-h-[460px] flex-none overflow-hidden bg-[#F7F5F0]">
              <Image
                src="/images/editorial/garden-variety.jpg"
                alt="PERALAGAE Fine Jewellery Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover object-[center_top] select-none"
              />
            </div>

            {/* Right Content Panel — Pure White Panel with Balanced Proportions (~56% width) */}
            <div className="relative w-full md:w-[56%] px-6 py-7 sm:px-8 sm:py-9 md:px-10 md:py-10 flex flex-col justify-center text-center bg-white">
              {isSuccess ? (
                /* Success Confirmation State */
                <div data-testid="newsletter-popup-success" className="py-4 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF5F0] text-[#111111] mb-4 border border-[#E5E0D8]">
                    <Check className="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
                  </div>
                  <h2
                    id="newsletter-popup-title"
                    className="text-xl sm:text-2xl md:text-3xl font-normal text-[#111111] leading-tight"
                  >
                    You&apos;re on the list.
                  </h2>
                  <p
                    id="newsletter-popup-description"
                    className="mt-2.5 text-xs sm:text-sm text-[#666666] leading-relaxed max-w-[360px] mx-auto"
                  >
                    Thank you for joining the PERALAGAE Circle. Look forward to curated inspirations and private previews in your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 inline-flex h-11 sm:h-12 items-center justify-center rounded-none bg-[#111111] px-7 text-xs font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                /* Reference Exact Content & Layout */
                <>
                  {/* Reference Main Heading: Lightweight rounded sans-serif */}
                  <h2
                    id="newsletter-popup-title"
                    className="text-2xl sm:text-[28px] md:text-[34px] lg:text-[36px] font-normal text-[#111111] leading-[1.16] tracking-tight text-center"
                  >
                    Join the our family
                  </h2>

                  {/* Reference Description: Centred 2-line grey text */}
                  <p
                    id="newsletter-popup-description"
                    className="mt-2 sm:mt-2.5 md:mt-3 text-xs sm:text-[13px] md:text-[14px] text-[#666666] leading-[1.4] max-w-[360px] mx-auto text-center"
                  >
                    Sign up to get all the latest fashion news, website updates, offers and promos.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    data-testid="newsletter-popup-form"
                    className="mt-5 sm:mt-6 md:mt-7 space-y-0"
                    noValidate
                  >
                    <div>
                      {/* Email Field */}
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
                        className="h-[46px] sm:h-[50px] md:h-[54px] w-full rounded-none border border-[#D5D5D5] bg-white px-4 text-xs sm:text-sm md:text-[15px] text-[#111111] placeholder:text-[#999999] transition-all focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] disabled:opacity-60 text-center placeholder:text-center"
                        autoComplete="email"
                        spellCheck="false"
                      />
                      {error && (
                        <p
                          role="alert"
                          data-testid="newsletter-popup-error"
                          className="mt-1.5 text-xs text-[#D9383A] text-center font-medium"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    {/* Subscribe Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="newsletter-popup-submit-btn"
                      className="mt-3 sm:mt-3.5 md:mt-4 flex h-[46px] sm:h-[50px] md:h-[54px] w-full items-center justify-center rounded-none bg-[#141414] text-xs sm:text-sm md:text-[14px] font-medium tracking-[0.14em] uppercase text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-75"
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

                    {/* Dismissal Checkbox: 'Do not show this window' */}
                    <div className="mt-4 sm:mt-5 md:mt-6 flex items-center justify-center gap-2.5">
                      <input
                        id="newsletter-do-not-show"
                        type="checkbox"
                        checked={doNotShowAgain}
                        onChange={(e) => handleToggleDoNotShowAgain(e.target.checked)}
                        data-testid="newsletter-popup-do-not-show-checkbox"
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-none border-[#C0C0C0] accent-[#111111] cursor-pointer"
                      />
                      <label
                        htmlFor="newsletter-do-not-show"
                        className="text-[11px] sm:text-xs md:text-[13px] text-[#666666] cursor-pointer select-none"
                      >
                        Do not show this window
                      </label>
                    </div>
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
