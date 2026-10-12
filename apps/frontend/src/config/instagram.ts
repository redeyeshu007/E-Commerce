/**
 * Instagram Gallery Configuration — PERALAGAE
 *
 * Configurable settings for the "Follow Us on Instagram" homepage section.
 *
 * NOTE: The official Instagram profile URL is currently pending confirmation from
 * the business. The handle `@peralagaeofficial` is a configurable placeholder.
 */

export interface InstagramGalleryItem {
  id: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  /** Optional link to post if official account exists */
  postUrl?: string;
}

export interface InstagramGalleryConfig {
  /** Exact section heading */
  heading: string;
  /** Configurable Instagram username / handle */
  handle: string;
  /** Official Instagram profile URL (null or undefined if pending verification) */
  profileUrl?: string | null;
  /** Exactly six gallery items */
  items: InstagramGalleryItem[];
}

export const defaultInstagramConfig: InstagramGalleryConfig = {
  heading: "Follow Us on Instagram",
  handle: "@peralagaeofficial",
  profileUrl: null, // Official Instagram account destination is pending verification
  items: [
    {
      id: "insta-1",
      image: {
        src: "/images/instagram/insta-1-rings-bracelet.jpg",
        alt: "Close-up of elegant 18k yellow gold rings and delicate floral bracelet on model's hand",
        width: 1024,
        height: 1024,
      },
    },
    {
      id: "insta-2",
      image: {
        src: "/images/instagram/insta-2-diamond-earrings.jpg",
        alt: "Studio macro photography of luxury diamond drop earrings set in white gold on stone pedestal",
        width: 1024,
        height: 1024,
      },
    },
    {
      id: "insta-3",
      image: {
        src: "/images/instagram/insta-3-layered-necklaces.jpg",
        alt: "Editorial lifestyle portrait of an elegant woman wearing layered delicate gold necklaces",
        width: 1024,
        height: 1024,
      },
    },
    {
      id: "insta-4",
      image: {
        src: "/images/instagram/insta-4-solitaire-ring.jpg",
        alt: "Close-up photograph of a sparkling solitaire diamond ring and gold bangles on a model's hand",
        width: 1024,
        height: 1024,
      },
    },
    {
      id: "insta-5",
      image: {
        src: "/images/instagram/insta-5-gold-earrings.jpg",
        alt: "Refined luxury gold drop earrings with filigree craftsmanship resting on ivory marble",
        width: 1024,
        height: 1024,
      },
    },
    {
      id: "insta-6",
      image: {
        src: "/images/instagram/insta-6-fashion-editorial.jpg",
        alt: "Fashion editorial portrait of a sophisticated woman wearing luxury diamond earrings and tennis bracelet",
        width: 1024,
        height: 1024,
      },
    },
  ],
};
