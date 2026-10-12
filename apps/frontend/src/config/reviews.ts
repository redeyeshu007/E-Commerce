/**
 * Customer Reviews Configuration — JAVIX JEWELLERY
 *
 * Typed configuration and sample review fixtures for the Customer Reviews
 * carousel section.
 *
 * NOTE: These 10 entries are development fixtures and sample testimonials
 * illustrating design layout and responsive behaviour. They must be replaced
 * by authenticated customer reviews upon backend API integration.
 */

export interface ReviewItem {
  /** Unique stable review identifier */
  id: string;
  /** Customer display name */
  authorName: string;
  /** Bold review headline */
  headline: string;
  /** Full text testimonial content */
  reviewText: string;
  /** Rating score from 1 to 5 */
  rating: number;
  /** Flag denoting this entry as preview/demo data */
  isDemo: boolean;
}

export interface CustomerReviewsSectionConfig {
  /** Section title heading text */
  heading: string;
  /** Section background color hex code (soft muted blush-grey #F0E5E4) */
  backgroundColor: string;
  /** Active star rating color hex code */
  starColor: string;
  /** Automatic rotation flag to loop continuously */
  autoRotate?: boolean;
  /** Continuous auto-loop interval in milliseconds */
  autoRotateIntervalMs?: number;
  /** List of customer reviews */
  reviews: ReviewItem[];
}

export const defaultReviewsConfig: CustomerReviewsSectionConfig = {
  heading: "Customer Reviews",
  backgroundColor: "#F0E5E4",
  starColor: "#D4A373", // Restrained warm muted gold/coral accent
  autoRotate: true,
  autoRotateIntervalMs: 5000,
  reviews: [
    {
      id: "rev-1",
      authorName: "Arjun Kumar",
      headline: "Beautiful Gold Craftsmanship",
      reviewText:
        "The design is elegant, and the finishing looks beautiful. The jewellery feels thoughtfully crafted for special occasions.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-2",
      authorName: "Priya Raman",
      headline: "Elegant and Timeless",
      reviewText:
        "I love the classic design and delicate detailing. It pairs beautifully with both traditional outfits and modern styles.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-3",
      authorName: "Karthik Subramanian",
      headline: "A Beautiful Gift",
      reviewText:
        "The piece has a refined finish and an elegant look. It made a lovely gift for a special family occasion.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-4",
      authorName: "Meena Lakshmi",
      headline: "Lovely Traditional Design",
      reviewText:
        "The design feels traditional yet contemporary. I appreciate the fine detailing and the elegant overall appearance.",
      rating: 4,
      isDemo: true,
    },
    {
      id: "rev-5",
      authorName: "Divya Srinivasan",
      headline: "Graceful Everyday Jewellery",
      reviewText:
        "The simple design is easy to style with everyday outfits. It has a subtle, sophisticated appearance.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-6",
      authorName: "Vignesh Raj",
      headline: "Elegant Wedding Jewellery",
      reviewText:
        "The design is well suited for celebrations and family functions. The detailing gives it a premium appearance.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-7",
      authorName: "Ananya Krishnan",
      headline: "Beautiful Finishing",
      reviewText:
        "The jewellery has an elegant finish and a lovely design. The presentation feels clean and premium.",
      rating: 4,
      isDemo: true,
    },
    {
      id: "rev-8",
      authorName: "Suresh Balasubramaniam",
      headline: "A Thoughtful Purchase",
      reviewText:
        "I appreciate the classic styling and attention to detail. It is a design that can be treasured for years.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-9",
      authorName: "Nandhini Murugan",
      headline: "Perfect for Special Moments",
      reviewText:
        "The design is graceful and looks lovely for celebrations. I like the balance between traditional styling and modern elegance.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "rev-10",
      authorName: "Rahul Narayanan",
      headline: "Sophisticated and Refined",
      reviewText:
        "The design is understated and elegant, with details that stand out beautifully without looking excessive.",
      rating: 4,
      isDemo: true,
    },
  ],
};
