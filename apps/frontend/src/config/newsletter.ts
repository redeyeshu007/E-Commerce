/**
 * Newsletter Section Configuration — PERALAGAE
 *
 * Configurable content and copy for the "Sign up now & get 10% off"
 * newsletter subscription section.
 */

export interface NewsletterSectionConfig {
  /** Exact section heading */
  heading: string;
  /** Exact promotional description */
  description: string;
  /** Exact input placeholder */
  inputPlaceholder: string;
  /** Exact button label */
  buttonLabel: string;
  /** Background color */
  backgroundColor?: string;
}

export const defaultNewsletterConfig: NewsletterSectionConfig = {
  heading: "Sign up now & get 10% off",
  description: "A little luxury, delivered straight to your inbox.",
  inputPlaceholder: "Email Address",
  buttonLabel: "SUBSCRIBE",
  backgroundColor: "#FFFFFF",
};
