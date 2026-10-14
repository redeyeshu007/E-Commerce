import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const instant = false;

interface CollectionsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Editorial Collections Dynamic Redirect — PERALAGAE
 *
 * Automatically redirects collection paths (e.g. /collections/tennis-bracelets,
 * /collections/lab-grown-diamonds, /collections/garden-variety) to the shop catalogue
 * with the appropriate category filter applied.
 */
const EDITORIAL_COLLECTION_MAP: Record<string, string> = {
  "lab-grown-diamonds": "rings",
  "tennis-bracelets": "bracelets",
  "garden-variety": "earrings",
};

export function generateStaticParams() {
  return Object.keys(EDITORIAL_COLLECTION_MAP).map((slug) => ({ slug }));
}

async function CollectionRedirect({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const targetCategory =
    (slug && EDITORIAL_COLLECTION_MAP[slug.toLowerCase()]) || "rings";
  redirect(`/shop?category=${encodeURIComponent(targetCategory)}`);
  return null;
}

export default function CollectionsPage({ params }: CollectionsPageProps) {
  return (
    <Suspense fallback={null}>
      <CollectionRedirect paramsPromise={params} />
    </Suspense>
  );
}
