import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterPopup } from "@/components/newsletter/newsletter-popup";
import { SiteHeader } from "@/components/navbar/site-header";
import { StorefrontProvider } from "@/providers/storefront-provider";
import {
  validateNewsletterEmail,
  submitNewsletterSubscription,
} from "@/services/newsletter-service";

describe("PERALAGAE Luxury Newsletter Subscription Popup Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    document.body.style.overflow = "auto";
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.useRealTimers();
  });

  describe("1. Validation & Service Boundary Unit Tests", () => {
    it("validates empty or whitespace email with required message", () => {
      expect(validateNewsletterEmail("")).toBe("Please enter your email address.");
      expect(validateNewsletterEmail("   ")).toBe("Please enter your email address.");
    });

    it("validates invalid email formats with concise error", () => {
      expect(validateNewsletterEmail("not-an-email")).toBe("Please enter a valid email address.");
      expect(validateNewsletterEmail("missing@tld")).toBe("Please enter a valid email address.");
      expect(validateNewsletterEmail("@domain.com")).toBe("Please enter a valid email address.");
      expect(validateNewsletterEmail("user@.com")).toBe("Please enter a valid email address.");
    });

    it("accepts valid email formats", () => {
      expect(validateNewsletterEmail("collector@luxury.com")).toBeNull();
      expect(validateNewsletterEmail("vip.client@peralagae.co.in")).toBeNull();
    });

    it("handles unconfigured backend gracefully without false success", async () => {
      delete process.env.NEXT_PUBLIC_NEWSLETTER_API_URL;
      const result = await submitNewsletterSubscription("client@example.com");

      expect(result.success).toBe(false);
      expect(result.status).toBe("unconfigured");
      expect(result.message).toContain("NEXT_PUBLIC_NEWSLETTER_API_URL");
    });
  });

  describe("2. Popup Visual Structure & Content", () => {
    it("renders the exact reference heading, description, input, subscribe button, and dismissal checkbox", () => {
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={vi.fn()} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      // Exact Heading
      expect(screen.getByRole("heading", { name: "Join the our family" })).toBeInTheDocument();

      // Exact Description
      expect(
        screen.getByText(
          "Sign up to get all the latest fashion news, website updates, offers and promos."
        )
      ).toBeInTheDocument();

      // Input with placeholder
      const input = screen.getByPlaceholderText("Enter your email address");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "email");

      // Subscribe button
      expect(screen.getByRole("button", { name: "SUBSCRIBE" })).toBeInTheDocument();

      // Dismissal preference checkbox & label
      const checkbox = screen.getByLabelText("Do not show this window");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      // Close button
      expect(screen.getByRole("button", { name: "Close newsletter popup" })).toBeInTheDocument();

      // Jewellery image
      const image = screen.getByAltText("PERALAGAE Fine Jewellery Collection");
      expect(image).toBeInTheDocument();
    });
  });

  describe("3. 6-Second Automatic Trigger & Session Persistence", () => {
    it("does not open before 6 seconds, then opens at 6 seconds on initial eligible load", () => {
      vi.useFakeTimers();

      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      // Initially closed
      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();

      // Advance by 5 seconds (5000ms) - still closed
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();

      // Advance by remaining 1 second (total 6000ms) - opens!
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId("newsletter-popup-content")).toBeInTheDocument();
    });

    it("does not auto-open if already dismissed in current session", () => {
      vi.useFakeTimers();
      sessionStorage.setItem("peralagae_newsletter_dismissed", "true");

      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      act(() => {
        vi.advanceTimersByTime(7000);
      });

      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();
    });

    it("does not auto-open if user is already subscribed", () => {
      vi.useFakeTimers();
      localStorage.setItem("peralagae_newsletter_subscribed", "true");

      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      act(() => {
        vi.advanceTimersByTime(7000);
      });

      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();
    });

    it("does not auto-open if permanently dismissed via 'Do not show this window'", () => {
      vi.useFakeTimers();
      localStorage.setItem("peralagae_newsletter_dismissed_permanently", "true");

      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      act(() => {
        vi.advanceTimersByTime(7000);
      });

      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();
    });
  });

  describe("4. Navbar Subscribe Link Trigger", () => {
    it("opens immediately when the navbar Subscribe link is clicked, even if dismissed previously", async () => {
      sessionStorage.setItem("peralagae_newsletter_dismissed", "true");

      render(
        <StorefrontProvider>
          <SiteHeader />
        </StorefrontProvider>
      );

      expect(screen.queryByTestId("newsletter-popup-content")).not.toBeInTheDocument();

      const subscribeLink = screen.getByTestId("navbar-subscribe-link");
      expect(subscribeLink).toBeInTheDocument();
      expect(subscribeLink).toHaveAttribute("href", "/#newsletter-section");

      fireEvent.click(subscribeLink);

      await waitFor(() => {
        expect(screen.getByTestId("newsletter-popup-content")).toBeInTheDocument();
      });
    });
  });

  describe("5. Dismissal & Closing Interactions", () => {
    it("closes when the close button is clicked and stores dismissal flag", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={onClose} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      const closeBtn = screen.getByRole("button", { name: "Close newsletter popup" });
      fireEvent.click(closeBtn);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem("peralagae_newsletter_dismissed")).toBe("true");
    });

    it("stores permanent dismissal flag when 'Do not show this window' is checked", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={onClose} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      const checkbox = screen.getByLabelText("Do not show this window");
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(localStorage.getItem("peralagae_newsletter_dismissed_permanently")).toBe("true");

      const closeBtn = screen.getByRole("button", { name: "Close newsletter popup" });
      fireEvent.click(closeBtn);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem("peralagae_newsletter_dismissed")).toBe("true");
      expect(localStorage.getItem("peralagae_newsletter_dismissed_permanently")).toBe("true");
    });

    it("closes when Escape key is pressed", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={onClose} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem("peralagae_newsletter_dismissed")).toBe("true");
    });

    it("closes when backdrop overlay is clicked", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={onClose} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      const backdrop = screen.getByTestId("newsletter-popup-backdrop");
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside the form or popup content", () => {
      const onClose = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup isOpen={true} onClose={onClose} autoOpenDelayMs={null} />
        </StorefrontProvider>
      );

      const content = screen.getByTestId("newsletter-popup-content");
      fireEvent.click(content);

      const input = screen.getByPlaceholderText("Enter your email address");
      fireEvent.click(input);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("6. Email Validation & Submission Lifecycle", () => {
    it("displays validation error when submitting with empty email", async () => {
      const onSubscribe = vi.fn();
      render(
        <StorefrontProvider>
          <NewsletterPopup
            isOpen={true}
            onClose={vi.fn()}
            autoOpenDelayMs={null}
            onSubscribe={onSubscribe}
          />
        </StorefrontProvider>
      );

      const submitBtn = screen.getByRole("button", { name: "SUBSCRIBE" });
      fireEvent.click(submitBtn);

      expect(onSubscribe).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email address.");
    });

    it("displays validation error for malformed email and preserves entered value", async () => {
      const user = userEvent.setup();
      const onSubscribe = vi.fn();

      render(
        <StorefrontProvider>
          <NewsletterPopup
            isOpen={true}
            onClose={vi.fn()}
            autoOpenDelayMs={null}
            onSubscribe={onSubscribe}
          />
        </StorefrontProvider>
      );

      const input = screen.getByPlaceholderText("Enter your email address");
      await user.type(input, "invalid-email");

      const submitBtn = screen.getByRole("button", { name: "SUBSCRIBE" });
      await user.click(submitBtn);

      expect(onSubscribe).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email address.");
      // Preserved
      expect(input).toHaveValue("invalid-email");
    });

    it("displays error message on failed submission and preserves email for retry", async () => {
      const user = userEvent.setup();
      const onSubscribe = vi.fn().mockResolvedValue({
        success: false,
        status: "error",
        message: "Server currently unavailable. Please retry shortly.",
      });

      render(
        <StorefrontProvider>
          <NewsletterPopup
            isOpen={true}
            onClose={vi.fn()}
            autoOpenDelayMs={null}
            onSubscribe={onSubscribe}
          />
        </StorefrontProvider>
      );

      const input = screen.getByPlaceholderText("Enter your email address");
      await user.type(input, "collector@luxury.com");

      const submitBtn = screen.getByRole("button", { name: "SUBSCRIBE" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Server currently unavailable. Please retry shortly."
        );
      });
      expect(input).toHaveValue("collector@luxury.com");
      expect(localStorage.getItem("peralagae_newsletter_subscribed")).toBeNull();
    });

    it("shows success state, marks subscription in localStorage, and allows closing", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubscribe = vi.fn().mockResolvedValue({
        success: true,
        status: "success",
        message: "Thank you for joining the PERALAGAE Circle.",
      });

      render(
        <StorefrontProvider>
          <NewsletterPopup
            isOpen={true}
            onClose={onClose}
            autoOpenDelayMs={null}
            onSubscribe={onSubscribe}
          />
        </StorefrontProvider>
      );

      const input = screen.getByPlaceholderText("Enter your email address");
      await user.type(input, "circle.member@peralagae.com");

      const submitBtn = screen.getByRole("button", { name: "SUBSCRIBE" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId("newsletter-popup-success")).toBeInTheDocument();
      });

      expect(screen.getByText("You're on the list.")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Thank you for joining the PERALAGAE Circle. Look forward to curated inspirations and private previews in your inbox."
        )
      ).toBeInTheDocument();
      expect(localStorage.getItem("peralagae_newsletter_subscribed")).toBe("true");

      // Continue Shopping button closes popup
      const continueBtn = screen.getByRole("button", { name: "Continue Shopping" });
      await user.click(continueBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it("prevents closing popup while request is in flight", async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      const onSubscribe = vi.fn().mockReturnValue(pendingPromise);
      const onClose = vi.fn();

      render(
        <StorefrontProvider>
          <NewsletterPopup
            isOpen={true}
            onClose={onClose}
            autoOpenDelayMs={null}
            onSubscribe={onSubscribe}
          />
        </StorefrontProvider>
      );

      const input = screen.getByPlaceholderText("Enter your email address");
      fireEvent.change(input, { target: { value: "client@luxury.com" } });

      const submitBtn = screen.getByRole("button", { name: "SUBSCRIBE" });
      fireEvent.click(submitBtn);

      // In flight state: Subscribing... loader
      expect(screen.getByText("Subscribing…")).toBeInTheDocument();

      // Attempt close via close button or Escape
      const closeBtn = screen.getByRole("button", { name: "Close newsletter popup" });
      fireEvent.click(closeBtn);
      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();

      // Resolve submission
      await act(async () => {
        resolvePromise({
          success: true,
          status: "success",
          message: "Thank you for joining.",
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("newsletter-popup-success")).toBeInTheDocument();
      });
    });
  });
});
