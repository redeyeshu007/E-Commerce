import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  NewsletterSignupSection,
  NewsletterSignupForm,
} from "@/components/home/newsletter-section";
import { defaultNewsletterConfig } from "@/config/newsletter";

describe("Newsletter Signup Suite", () => {
  describe("NewsletterSignupForm", () => {
    it("renders email input with accessible label and subscribe button", () => {
      render(<NewsletterSignupForm />);

      const input = screen.getByPlaceholderText("Email Address");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "email");

      const button = screen.getByRole("button", { name: "SUBSCRIBE" });
      expect(button).toBeInTheDocument();
    });

    it("displays error for empty email submission", async () => {
      render(<NewsletterSignupForm />);

      const form = screen.getByTestId("newsletter-form");
      fireEvent.submit(form);

      const error = await screen.findByRole("alert");
      expect(error).toHaveTextContent("Please enter your email address.");
    });

    it("displays error for invalid email format and preserves input value", async () => {
      render(<NewsletterSignupForm />);

      const input = screen.getByPlaceholderText("Email Address");
      fireEvent.change(input, { target: { value: "invalid-email-format" } });

      const form = screen.getByTestId("newsletter-form");
      fireEvent.submit(form);

      const error = await screen.findByRole("alert");
      expect(error).toHaveTextContent("Please enter a valid email address.");
      expect(input).toHaveValue("invalid-email-format");
    });

    it("displays preview notice when submitting without a connected backend service", async () => {
      render(<NewsletterSignupForm />);

      const input = screen.getByPlaceholderText("Email Address");
      fireEvent.change(input, { target: { value: "customer@example.com" } });

      const form = screen.getByTestId("newsletter-form");
      fireEvent.submit(form);

      const status = await screen.findByTestId("newsletter-status");
      expect(status).toHaveTextContent(
        "Newsletter subscription is currently in preview mode. Live backend endpoint integration is pending."
      );
    });

    it("invokes onSubscribe service and handles genuine success", async () => {
      const mockService = vi.fn().mockResolvedValue({
        success: true,
        message: "Welcome to JAVIX! Check your inbox for exclusive updates.",
      });

      render(<NewsletterSignupForm onSubscribe={mockService} />);

      const input = screen.getByPlaceholderText("Email Address");
      fireEvent.change(input, { target: { value: "subscriber@example.com" } });

      const form = screen.getByTestId("newsletter-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockService).toHaveBeenCalledWith("subscriber@example.com");
      });

      const successMsg = await screen.findByTestId("newsletter-success-message");
      expect(successMsg).toHaveTextContent(
        "Welcome to JAVIX! Check your inbox for exclusive updates."
      );
    });

    it("handles onSubscribe failure and preserves email", async () => {
      const mockService = vi.fn().mockResolvedValue({
        success: false,
        message: "Email address is already subscribed.",
      });

      render(<NewsletterSignupForm onSubscribe={mockService} />);

      const input = screen.getByPlaceholderText("Email Address");
      fireEvent.change(input, { target: { value: "existing@example.com" } });

      const form = screen.getByTestId("newsletter-form");
      fireEvent.submit(form);

      const error = await screen.findByRole("alert");
      expect(error).toHaveTextContent("Email address is already subscribed.");
      expect(input).toHaveValue("existing@example.com");
    });
  });

  describe("NewsletterSignupSection", () => {
    it("renders exact heading 'Sign up now & get 10% off' and description", () => {
      render(<NewsletterSignupSection config={defaultNewsletterConfig} />);

      const heading = screen.getByRole("heading", {
        name: "Sign up now & get 10% off",
        level: 2,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", "newsletter-heading");

      const description = screen.getByTestId("newsletter-description");
      expect(description).toHaveTextContent(
        "Sign up to our Newsletter and get the discount code."
      );
    });
  });
});
