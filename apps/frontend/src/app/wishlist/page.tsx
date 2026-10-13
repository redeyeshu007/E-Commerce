import type { Metadata } from "next";
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content";

export const metadata: Metadata = {
  title: "Wishlist | PERALAGAE Luxury Jewellery",
  description:
    "Review and manage your curated fine jewellery wishlist, check real-time stock availability, and transfer cherished pieces directly to your shopping bag.",
};

export default function WishlistPage() {
  return <WishlistPageContent />;
}
