import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata: Metadata = {
  title: "Shopping Cart | PERALAGAE Luxury Jewellery",
  description:
    "Review your curated fine jewellery bag, apply promotional savings, and proceed to secure checkout with complimentary insured express shipping across India.",
};

export default function CartPage() {
  return <CartPageContent />;
}
