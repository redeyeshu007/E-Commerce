/**
 * Newsletter Section Configuration — JAVIX JEWELLERY
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
  description: "Sign up to our Newsletter and get the discount code.",
  inputPlaceholder: "Email Address",
  buttonLabel: "SUBSCRIBE",
  backgroundColor: "#FFFFFF",
};
