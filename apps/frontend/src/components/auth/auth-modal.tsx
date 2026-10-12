"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ForgotPasswordForm } from "./forgot-password-form";

export type AuthView = "login" | "register" | "forgot-password";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
  triggerRef,
}: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [sharedEmail, setSharedEmail] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync initial view when opening without cascading effect renders
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentView(initialView);
    }
  }

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Restore keyboard focus to trigger button when modal closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
        // Restore focus to triggering account button
        setTimeout(() => {
          if (triggerRef?.current) {
            triggerRef.current.focus();
          }
        }, 50);
      }
    },
    [onClose, triggerRef]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Subtle Semi-Transparent Backdrop */}
        <Dialog.Overlay
          data-testid="auth-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Centered Modal Content Container */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
          <Dialog.Content
            ref={contentRef}
            data-testid="auth-modal-content"
            aria-describedby="auth-modal-description"
            aria-labelledby="auth-modal-title"
            className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto bg-white p-6 sm:p-9 shadow-2xl rounded-none pointer-events-auto border border-[#EAE6DF] transition-all duration-300 motion-reduce:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
          >
            {/* Accessible Close Button in Upper-Right Corner */}
            <Dialog.Close asChild>
              <button
                type="button"
                data-testid="auth-modal-close-button"
                aria-label="Close authentication modal"
                className="absolute right-4 top-4 sm:right-5 sm:top-5 flex h-9 w-9 items-center justify-center text-[#777777] hover:text-[#111111] hover:bg-[#FAF8F5] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black z-10"
              >
                <X className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
              </button>
            </Dialog.Close>

            {/* View Switcher with Smooth Transition */}
            <div className="w-full transition-opacity duration-200">
              {currentView === "login" && (
                <LoginForm
                  initialEmail={sharedEmail}
                  onEmailChange={setSharedEmail}
                  onSwitchToRegister={() => setCurrentView("register")}
                  onSwitchToForgotPassword={() => setCurrentView("forgot-password")}
                  onSuccess={onClose}
                />
              )}

              {currentView === "register" && (
                <RegisterForm
                  initialEmail={sharedEmail}
                  onEmailChange={setSharedEmail}
                  onSwitchToLogin={() => setCurrentView("login")}
                  onSuccess={onClose}
                />
              )}

              {currentView === "forgot-password" && (
                <ForgotPasswordForm
                  initialEmail={sharedEmail}
                  onEmailChange={setSharedEmail}
                  onSwitchToLogin={() => setCurrentView("login")}
                />
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
