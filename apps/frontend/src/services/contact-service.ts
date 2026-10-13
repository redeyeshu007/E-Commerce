/**
 * Contact Service & Integration Boundary — PERALAGAE
 *
 * Defines strongly-typed contact enquiry schemas, client validation,
 * and handles communication with configured backend or API integration endpoints.
 *
 * Configuration:
 * - NEXT_PUBLIC_CONTACT_API_URL: Optional external or internal API endpoint
 *   for submitting customer contact enquiries (e.g. https://api.peralagae.com/v1/contact).
 *
 * Architecture:
 * If an endpoint is unconfigured in the deployment environment, this service
 * defines a clean integration boundary and returns an 'unconfigured' status
 * so the frontend can honestly direct the user to the configured email and phone
 * channels, rather than simulating fake delivery or claiming an email was sent.
 */

export interface ContactEnquiryData {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  status: "success" | "error" | "unconfigured";
  message: string;
}

export interface ContactValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

/**
 * Validates contact form data according to luxury e-commerce requirements.
 */
export function validateContactForm(data: ContactEnquiryData): ContactValidationErrors {
  const errors: ContactValidationErrors = {};

  const nameTrimmed = (data.fullName || "").trim();
  if (!nameTrimmed) {
    errors.fullName = "Please enter your full name.";
  } else if (nameTrimmed.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  const emailTrimmed = (data.email || "").trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailTrimmed) {
    errors.email = "Please enter your email address.";
  } else if (!emailRegex.test(emailTrimmed)) {
    errors.email = "Please enter a valid email address (e.g. name@example.com).";
  }

  const phoneTrimmed = (data.phone || "").trim();
  if (phoneTrimmed) {
    // Optional phone validation: if entered, check for valid phone numbers (minimum 8 digits)
    const digitsOnly = phoneTrimmed.replace(/\D/g, "");
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.phone = "Please enter a valid phone number (8–15 digits).";
    }
  }

  const messageTrimmed = (data.message || "").trim();
  if (!messageTrimmed) {
    errors.message = "Please share your enquiry or message.";
  } else if (messageTrimmed.length < 10) {
    errors.message = "Message must be at least 10 characters long.";
  }

  return errors;
}

/**
 * Submits contact enquiry to the configured backend API or endpoint.
 */
export async function submitContactEnquiry(
  data: ContactEnquiryData
): Promise<ContactSubmissionResult> {
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_API_URL;

  if (!endpoint) {
    // Integration boundary: no external API endpoint configured
    return {
      success: false,
      status: "unconfigured",
      message:
        "Direct online form submission is currently awaiting mail server integration. Please contact our concierge directly via email or phone.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status: "error",
        message: errorText || "An error occurred while submitting your enquiry. Please try again.",
      };
    }

    const result = await response.json().catch(() => ({}));
    return {
      success: true,
      status: "success",
      message:
        result.message ||
        "Thank you for contacting PERALAGAE. Your enquiry has been received by our concierge.",
    };
  } catch (error) {
    return {
      success: false,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Network error occurred. Please verify your connection or contact us directly.",
    };
  }
}
