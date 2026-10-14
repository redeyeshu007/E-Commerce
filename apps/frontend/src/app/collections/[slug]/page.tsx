import { redirect } from "next/navigation";

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

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { slug } = await params;
  const targetCategory =
    (slug && EDITORIAL_COLLECTION_MAP[slug.toLowerCase()]) || "rings";
  redirect(`/shop?category=${encodeURIComponent(targetCategory)}`);
}
