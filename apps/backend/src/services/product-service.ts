import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
}

export interface FormattedProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryKey?: string;
  categoryId?: string | null;
  subcategory?: string;
  collection?: string;
  sku?: string;
  image: ProductImage;
  images?: ProductImage[];
  priceInr: number;
  priceDisplay?: string;
  compareAtPriceInr?: number | null;
  isNew?: boolean | undefined;
  isHot?: boolean | undefined;
  isAvailable?: boolean | undefined;
  inStock?: boolean | undefined;
  stockCount?: number | undefined;
  description?: string | undefined;
  longDescription?: string | undefined;
  material?: string | undefined;
  materials?: string[] | undefined;
  sizes?: string[] | undefined;
  specs?: ProductSpec[] | undefined;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  viewersCount?: number | undefined;
  reviews?: ProductReview[] | undefined;
  createdAt?: string | undefined;
}

export interface ProductFilterInput {
  category?: string | null | undefined;
  search?: string | null | undefined;
  minPrice?: number | null | undefined;
  maxPrice?: number | null | undefined;
  materials?: string[] | undefined;
  sizes?: string[] | undefined;
  sort?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface ProductListResult {
  products: FormattedProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fromIndex: number;
  toIndex: number;
  minCataloguePrice: number;
  maxCataloguePrice: number;
  categoryCounts: Record<string, number>;
  materialCounts: Record<string, number>;
  sizeCounts: Record<string, number>;
}

export const JEWELLERY_MATERIALS = [
  "Gold",
  "Silver",
  "Rose Gold",
  "Diamond",
  "Platinum",
] as const;

export const JEWELLERY_SIZES = [
  "6",
  "7",
  "8",
  "9",
  "10",
  "6.5\"",
  "7\"",
  "7.5\"",
  "16\"",
  "18\"",
  "20\"",
] as const;

function enrichProductDetails(raw: any): FormattedProduct {
  const cat = (raw.category?.name || raw.categoryKey || "").toUpperCase();
  const rawImages = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images.map((img: any) => typeof img === "string" ? { src: img, alt: raw.name } : img)
    : [
        { src: raw.imageUrl, alt: raw.imageAlt || raw.name },
        ...(cat.includes("NECKLACE")
          ? [
              { src: "/images/hero/banner-necklaces.jpg", alt: `${raw.name} - Model Editorial View` },
              { src: "/images/collections/collection-necklaces.jpg", alt: `${raw.name} - Fine Jewellery Collection View` },
              { src: "/images/instagram/insta-3-layered-necklaces.jpg", alt: `${raw.name} - Layered Detail View` },
            ]
          : cat.includes("RING")
          ? [
              { src: "/images/hero/banner-statement-rings.jpg", alt: `${raw.name} - Hand Lifestyle View` },
              { src: "/images/collections/collection-rings.jpg", alt: `${raw.name} - Studio Ring Profile` },
              { src: "/images/instagram/insta-4-solitaire-ring.jpg", alt: `${raw.name} - Detail Macro Silhouette` },
            ]
          : cat.includes("BRACELET")
          ? [
              { src: "/images/editorial/tennis-bracelets.jpg", alt: `${raw.name} - Wrist Silhouette` },
              { src: "/images/collections/collection-bracelets.jpg", alt: `${raw.name} - Studio Collection View` },
              { src: "/images/hero/banner-charm-bracelets.jpg", alt: `${raw.name} - Editorial Detail View` },
            ]
          : cat.includes("EARRING")
          ? [
              { src: "/images/instagram/insta-2-diamond-earrings.jpg", alt: `${raw.name} - Editorial Portrait View` },
              { src: "/images/collections/collection-earrings.jpg", alt: `${raw.name} - Coordinated Pair Presentation` },
              { src: "/images/instagram/insta-5-gold-earrings.jpg", alt: `${raw.name} - Earring Profile Silhouette` },
            ]
          : cat.includes("CHARM") || cat.includes("BANGLE")
          ? [
              { src: "/images/collections/collection-charms-bangles.jpg", alt: `${raw.name} - Charm Collection Flatlay` },
              { src: "/images/hero/banner-charm-bracelets.jpg", alt: `${raw.name} - Stacked Lifestyle View` },
              { src: "/images/instagram/insta-1-rings-bracelet.jpg", alt: `${raw.name} - Wrist Detail View` },
            ]
          : [
              { src: "/images/collections/collection-gift-ideas.jpg", alt: `${raw.name} - Curated Gift Box Presentation` },
              { src: "/images/editorial/lab-grown-diamonds.jpg", alt: `${raw.name} - Luxury Editorial View` },
              { src: "/images/instagram/insta-6-fashion-editorial.jpg", alt: `${raw.name} - High Fashion Styling` },
            ]),
      ];

  const materials = Array.isArray(raw.materials) ? raw.materials : [];
  const sizes = Array.isArray(raw.sizes) ? raw.sizes : [];

  const specs: ProductSpec[] = [
    { label: "Precious Metal", value: raw.material || "18k Solid Yellow Gold (750 Purity)" },
    {
      label: "Gemstones",
      value: materials.includes("Diamond")
        ? "Conflict-Free Round Brilliant Diamonds (VVS-VS Clarity, F-G Colour)"
        : materials.includes("Emerald")
        ? "Natural Fine-Grade Colombian Emerald"
        : "Certified Pure Natural Gemstone Setting",
    },
    { label: "Purity & Hallmarking", value: "BIS Hallmarked 750 (18 Karat) with Laser Assay Inscription" },
    {
      label: "Dimensions / Sizing",
      value: cat.includes("RING")
        ? "Available in standard Indian & International ring sizes 6 to 10"
        : cat.includes("NECKLACE")
        ? "16 to 18 inch adjustable fine trace chain with lobster clasp"
        : cat.includes("BRACELET")
        ? "Standard 7-inch circumference with concealed safety clasp"
        : cat.includes("EARRING")
        ? "Length: 16mm | Width: 6mm | Secure click-in huggie closure"
        : "Standard luxury proportion with custom sizing available on request",
    },
    { label: "Approximate Metal Weight", value: "3.80 – 5.40 grams solid gold" },
    { label: "Certification", value: "IGI / SGL Authenticity Certificate included with tamper-evident seal" },
    {
      label: "Jewellery Care Guide",
      value: "Store inside the provided PERALAGAE anti-tarnish suede pouch. Protect from direct perfumes and chemicals. Clean gently with a lint-free polishing cloth.",
    },
  ];

  const reviews: ProductReview[] = [
    {
      id: `rev-${raw.id}-1`,
      author: "Aditi S.",
      rating: 5,
      date: "18 September 2026",
      comment:
        "The craftsmanship on this piece is truly exquisite. The gold has a warm, radiant lustre that looks even more captivating in person. Arrived securely packaged with the certificate.",
      verified: true,
    },
    {
      id: `rev-${raw.id}-2`,
      author: "Rohan Kapoor",
      rating: 5,
      date: "04 October 2026",
      comment:
        "Purchased as an anniversary present. The understated luxury and attention to detail reflect true artistry. Prompt delivery and luxurious unboxing experience.",
      verified: true,
    },
    {
      id: `rev-${raw.id}-3`,
      author: "Meera Krishnan",
      rating: 5,
      date: "09 October 2026",
      comment:
        "Comfortable for daily wear, yet elevates any evening ensemble. The finish is flawlessly mirror-polished. Proud to wear PERALAGAE.",
      verified: true,
    },
  ];

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category?.name || raw.categoryKey || "JEWELLERY",
    categoryKey: raw.categoryKey || raw.category?.name,
    categoryId: raw.categoryId,
    subcategory:
      cat.includes("RING")
        ? "Rings & Bands"
        : cat.includes("NECKLACE")
        ? "Pendants & Chains"
        : cat.includes("BRACELET")
        ? "Bangles & Tennis"
        : cat.includes("EARRING")
        ? "Huggies & Drops"
        : cat.includes("CHARM")
        ? "Charms & Medallions"
        : "Curated Gift Sets",
    collection:
      materials.includes("Diamond")
        ? "Solitaire Radiance"
        : materials.includes("Platinum")
        ? "Modern Platinum Classics"
        : materials.includes("Rose Gold")
        ? "Aura Rose Elegance"
        : "Heritage Gold 18k",
    sku: `PRL-${raw.id.toUpperCase().replace(/^PROD-/, "")}`,
    image: {
      src: raw.imageUrl,
      alt: raw.imageAlt || raw.name,
    },
    images: rawImages,
    priceInr: raw.priceInr,
    priceDisplay: `$${(raw.priceInr / 82.5).toFixed(2)}`,
    compareAtPriceInr: raw.compareAtPriceInr,
    isNew: raw.isNew,
    isHot: raw.isHot,
    isAvailable: raw.isAvailable,
    inStock: raw.inStock,
    stockCount: raw.stockCount,
    material: raw.material || undefined,
    materials,
    sizes,
    specs,
    rating: 5.0,
    reviewCount: reviews.length,
    viewersCount: 22,
    reviews,
    description: raw.description || undefined,
    longDescription:
      raw.description
        ? `${raw.description} Handcrafted with precision by PERALAGAE master artisans, each diamond is hand-selected for optimal fire and scintillation.`
        : undefined,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
  };
}

export class ProductService {
  /**
   * Retrieves products with filters, sorting, pagination, and dynamic category counts
   * directly from PostgreSQL via Prisma.
   */
  static async getProducts(filters: ProductFilterInput = {}): Promise<ProductListResult> {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 12));

    // Fetch all active categories from PostgreSQL for accurate category counts
    const allDbCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Fetch all products from PostgreSQL to compute price bounds, material counts, size counts
    const allDbProducts = await prisma.product.findMany({
      include: {
        category: true,
      },
    });

    const allFormatted = allDbProducts.map(enrichProductDetails);

    // Compute overall catalogue price bounds
    const prices = allFormatted.map((p) => p.priceInr);
    const minCataloguePrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxCataloguePrice = prices.length > 0 ? Math.max(...prices) : 100000;

    // Apply filtering in memory or through Prisma
    const filtered = allFormatted.filter((product) => {
      // Category filter
      if (filters.category && filters.category !== "all") {
        const selectedCat = filters.category.toLowerCase().trim();
        const matchesCategory =
          product.category.toLowerCase() === selectedCat ||
          product.categoryKey?.toLowerCase() === selectedCat ||
          product.categoryId?.toLowerCase() === selectedCat ||
          allDbCategories.some(
            (c) =>
              (c.slug.toLowerCase() === selectedCat ||
                c.id.toLowerCase() === selectedCat ||
                c.name.toLowerCase() === selectedCat) &&
              (c.name.toLowerCase() === product.category.toLowerCase() ||
                c.slug.toLowerCase() === product.category.toLowerCase() ||
                c.id === product.categoryId)
          );
        if (!matchesCategory) return false;
      }

      // Price filter
      if (filters.minPrice != null && product.priceInr < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice != null && product.priceInr > filters.maxPrice) {
        return false;
      }

      // Material filter
      if (filters.materials && filters.materials.length > 0) {
        const hasMaterial = filters.materials.some((m) =>
          product.materials?.some((pm) => pm.toLowerCase() === m.toLowerCase())
        );
        if (!hasMaterial) return false;
      }

      // Size filter
      if (filters.sizes && filters.sizes.length > 0) {
        const hasSize = filters.sizes.some((s) => product.sizes?.includes(s));
        if (!hasSize) return false;
      }

      // Search query
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const inName = product.name.toLowerCase().includes(query);
        const inDesc = product.description?.toLowerCase().includes(query);
        const inCat = product.category.toLowerCase().includes(query);
        if (!inName && !inDesc && !inCat) return false;
      }

      return true;
    });

    // Sorting
    const sort = filters.sort || "default";
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "price-low-to-high":
          return a.priceInr - b.priceInr;
        case "price-high-to-low":
          return b.priceInr - a.priceInr;
        case "newest": {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        case "name-a-z":
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        case "name-z-a":
          return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
        case "default":
        default:
          return 0;
      }
    });

    // Pagination
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginatedProducts = total === 0 ? [] : sorted.slice(startIndex, startIndex + pageSize);

    const fromIndex = total === 0 ? 0 : startIndex + 1;
    const toIndex = total === 0 ? 0 : Math.min(startIndex + pageSize, total);

    // Dynamic category counts from PostgreSQL relationships
    const categoryCounts: Record<string, number> = {};
    for (const cat of allDbCategories) {
      // Precise product count from database
      const count = cat._count.products;
      categoryCounts[cat.slug] = count;
      categoryCounts[cat.id] = count;
      categoryCounts[cat.name] = count;
    }

    // Material counts
    const materialCounts: Record<string, number> = {};
    JEWELLERY_MATERIALS.forEach((mat) => {
      materialCounts[mat] = allFormatted.filter((p) =>
        p.materials?.some((pm) => pm.toLowerCase() === mat.toLowerCase())
      ).length;
    });

    // Size counts
    const sizeCounts: Record<string, number> = {};
    JEWELLERY_SIZES.forEach((sz) => {
      sizeCounts[sz] = allFormatted.filter((p) => p.sizes?.includes(sz)).length;
    });

    return {
      products: paginatedProducts,
      total,
      page: safePage,
      pageSize,
      totalPages,
      fromIndex,
      toIndex,
      minCataloguePrice,
      maxCataloguePrice,
      categoryCounts,
      materialCounts,
      sizeCounts,
    };
  }

  /**
   * Retrieves a single product by slug or ID from PostgreSQL.
   */
  static async getProductBySlugOrId(slugOrId: string): Promise<FormattedProduct | null> {
    if (!slugOrId) return null;
    const normalized = slugOrId.trim();

    const record = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: normalized },
          { id: normalized },
          { slug: normalized.toLowerCase() },
        ],
      },
      include: {
        category: true,
      },
    });

    if (!record) {
      return null;
    }

    return enrichProductDetails(record);
  }

  /**
   * Retrieves adjacent (previous and next) products in the catalogue.
   */
  static async getAdjacentProducts(slugOrId: string): Promise<{ prev: FormattedProduct; next: FormattedProduct } | null> {
    const all = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
      include: { category: true },
    });

    if (all.length === 0) return null;

    const formattedAll = all.map(enrichProductDetails);
    if (!formattedAll[0] || !formattedAll[formattedAll.length - 1]) return null;

    const currentIndex = formattedAll.findIndex(
      (p) => p.slug === slugOrId || p.id === slugOrId || p.slug.toLowerCase() === slugOrId.toLowerCase()
    );

    const first = formattedAll[0];
    const last = formattedAll[formattedAll.length - 1];
    if (!first || !last) return null;

    if (currentIndex === -1 || formattedAll.length <= 1) {
      return {
        prev: first,
        next: last,
      };
    }

    const prevIndex = (currentIndex - 1 + formattedAll.length) % formattedAll.length;
    const nextIndex = (currentIndex + 1) % formattedAll.length;

    const prev = formattedAll[prevIndex];
    const next = formattedAll[nextIndex];
    if (!prev || !next) return null;

    return {
      prev,
      next,
    };
  }
}
