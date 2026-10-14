import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const instant = false;

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Category Route Dynamic Redirect — PERALAGAE
 *
 * Automatically redirects category paths (e.g. /category/necklaces, /category/rings)
 * to the unified shop page with the corresponding category filter applied:
 * /shop?category=[slug].
 */
const CATEGORY_MAP: Record<string, string> = {
  necklaces: "necklaces",
  rings: "rings",
  bracelets: "bracelets",
  earrings: "earrings",
  charms: "charms-bangles",
  "charms-bangles": "charms-bangles",
  "charm-dangles": "charms-bangles",
  gifts: "gift-ideas",
  "gift-ideas": "gift-ideas",
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((slug) => ({ slug }));
}

async function CategoryRedirect({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const targetCategory = (slug && CATEGORY_MAP[slug.toLowerCase()]) || slug || "necklaces";
  redirect(`/shop?category=${encodeURIComponent(targetCategory)}`);
  return null;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={null}>
      <CategoryRedirect paramsPromise={params} />
    </Suspense>
  );
}
