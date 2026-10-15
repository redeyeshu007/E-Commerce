/**
 * Product Service & Repository Layer — PERALAGAE
 *
 * Strongly-typed data repository isolating the product catalogue
 * behind a clean service boundary, fully ready for future REST API
 * / GraphQL backend integration.
 */

import type { Product } from "@/types/product";
import type { CategoryItem } from "@/types/category";

export interface ShopFilters {
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  materials?: string[];
  sizes?: string[];
  search?: string;
}

export type SortOption =
  | "default"
  | "price-low-to-high"
  | "price-high-to-low"
  | "newest"
  | "name-a-z"
  | "name-z-a";

export interface ShopCatalogueResult {
  products: Product[];
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

export const JEWELLERY_CATEGORIES = [
  { id: "necklaces", label: "Necklaces", categoryKey: "NECKLACES" },
  { id: "rings", label: "Rings", categoryKey: "RINGS" },
  { id: "bracelets", label: "Bracelets", categoryKey: "BRACELETS" },
  { id: "earrings", label: "Earrings", categoryKey: "EARRINGS" },
  { id: "charms-bangles", label: "Charms & Bangles", categoryKey: "CHARMS & BANGLES" },
  { id: "gift-ideas", label: "Gift Ideas", categoryKey: "GIFT IDEAS" },
] as const;

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

/**
 * Featured Reference Product matching design mockups:
 * "Blue Stripes & Stone Earrings"
 */
export const BLUE_STRIPES_PRODUCT: Product = {
  id: "prod-blue-stripes-earrings",
  slug: "blue-stripes-stone-earrings",
  name: "Blue Stripes & Stone Earrings",
  category: "EARRINGS",
  image: {
    src: "/images/products/product-earrings-blue-stripes.jpg",
    alt: "Blue Stripes & Stone Earrings - 18k Yellow Gold Oval Hoop Earrings",
  },
  images: [
    {
      src: "/images/products/product-earrings-blue-stripes.jpg",
      alt: "Blue Stripes & Stone Earrings - 18k Yellow Gold Oval Hoop Earrings",
    },
    {
      src: "/images/products/product-earrings-blue-stripes-model.jpg",
      alt: "Blue Stripes & Stone Earrings - Worn by Model",
    },
    {
      src: "/images/products/product-earrings-blue-stripes-pair.jpg",
      alt: "Blue Stripes & Stone Earrings - Pair of Hoop Earrings",
    },
    {
      src: "/images/products/product-earrings-blue-stripes-detail.jpg",
      alt: "Blue Stripes & Stone Earrings - Clasp and Metalwork Detail",
    },
  ],
  priceInr: 20490,
  priceDisplay: "$249.00",
  isHot: true,
  isAvailable: true,
  inStock: true,
  stockCount: 15,
  rating: 5.0,
  reviewCount: 3,
  viewersCount: 22,
  material: "Solid 18k Yellow Gold",
  materials: ["Gold"],
  createdAt: "2026-10-10T08:00:00Z",
  description:
    "This regulator has a rolled diaphragm and high flow rate with reduced pressure drop.It has an excellent degree of condensation.",
  longDescription:
    "Sculpted in solid 18k yellow gold, the Blue Stripes & Stone Earrings feature an elongated oval hoop architecture paired with a delicately suspended tapered drop bar. Precision mirror-polishing accentuates its warm glow, engineered with a secure hinge clasp for seamless all-day elegance.",
  specs: [
    { label: "Metal & Purity", value: "18k Solid Yellow Gold (750 Hallmarked)" },
    { label: "Clasp Mechanism", value: "Comfort-click Hinge Wire" },
    { label: "Dimensions", value: "32mm drop length × 14mm width" },
    { label: "Approximate Weight", value: "4.85 grams" },
    { label: "Certification", value: "BIS Hallmarked & Authenticity Certificate" },
    { label: "Care Instructions", value: "Store in protective pouch; polish with dry microfibre cloth" },
  ],
  reviews: [
    {
      id: "rev-bs-1",
      author: "Jessica William",
      rating: 5,
      date: "March 3, 2023",
      verified: true,
      comment:
        "I recently purchased a ring from your store, and I am extremely happy with my purchase.",
    },
    {
      id: "rev-bs-2",
      author: "Megan Miller",
      rating: 5,
      date: "March 3, 2023",
      verified: true,
      comment:
        "I will definitely be purchasing more from this store in the future, and I would highly recommend them to anyone who is looking for high-quality and stylish jewelry.",
    },
    {
      id: "rev-bs-3",
      author: "Richard William",
      rating: 5,
      date: "March 3, 2023",
      verified: true,
      comment:
        "The craftsmanship on this piece is truly exquisite. The gold has a warm, radiant lustre that looks even more captivating in person.",
    },
  ],
};

/**
 * 24 Curated luxury jewellery catalogue items
 * covering all 6 approved categories, materials, and sizes.
 */
export const SHOP_PRODUCTS: Product[] = [
  {
    id: "prod-solitaire-pendant",
    slug: "solitaire-diamond-pendant-necklace",
    name: "Solitaire Diamond Pendant Necklace",
    category: "NECKLACES",
    image: {
      src: "/images/products/product-necklaces-solitaire.jpg",
      alt: "Solitaire Diamond Pendant Necklace - 18k Gold & Bezel-set Diamond",
    },
    priceInr: 24999,
    compareAtPriceInr: 29999,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold & Platinum",
    materials: ["Gold", "Platinum", "Diamond"],
    sizes: ["16\"", "18\""],
    createdAt: "2026-09-01T10:00:00Z",
    inStock: true,
    description:
      "A delicate fine link chain cradling a lustrous yellow gold circular pendant with a precision bezel-set brilliant diamond.",
  },
  {
    id: "prod-sculpted-gold-ring",
    slug: "sculpted-18k-yellow-gold-band",
    name: "Sculpted 18k Yellow Gold Band",
    category: "RINGS",
    image: {
      src: "/images/products/product-rings-sculpted-gold.jpg",
      alt: "Sculpted 18k Yellow Gold Band - Mirror-polished Solid Gold",
    },
    priceInr: 18500,
    isHot: true,
    isAvailable: true,
    material: "Solid 18k Yellow Gold",
    materials: ["Gold"],
    sizes: ["6", "7", "8", "9"],
    createdAt: "2026-08-15T12:00:00Z",
    inStock: true,
    description:
      "Substantial solid 18k gold band sculpted with architectural soft chamfers and mirror-polished finish for everyday elegance.",
  },
  {
    id: "prod-dual-tone-bangle",
    slug: "dual-tone-minimalist-bangle",
    name: "Dual-Tone Minimalist Bangle",
    category: "BRACELETS",
    image: {
      src: "/images/products/product-bracelets-dual-tone.jpg",
      alt: "Dual-Tone Minimalist Bangle - Gold & Silver with Pavé Accent",
    },
    priceInr: 32000,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold & Sterling Silver",
    materials: ["Gold", "Silver", "Diamond"],
    sizes: ["6.5\"", "7\"", "7.5\""],
    createdAt: "2026-09-10T14:30:00Z",
    inStock: true,
    description:
      "Refined oval contour bangle featuring a dual-metal finish and delicate pavé diamond center bar with a secure luxury clasp.",
  },
  {
    id: "prod-pave-teardrop-earrings",
    slug: "pave-diamond-teardrop-earrings",
    name: "Pavé Diamond Teardrop Earrings",
    category: "EARRINGS",
    image: {
      src: "/images/products/product-earrings-pave-diamond.jpg",
      alt: "Pavé Diamond Teardrop Earrings - White Gold Teardrop Huggies",
    },
    priceInr: 28750,
    compareAtPriceInr: 34000,
    isHot: true,
    isAvailable: true,
    material: "14k White Gold & Round Brilliant Diamonds",
    materials: ["Gold", "Diamond"],
    createdAt: "2026-08-20T09:15:00Z",
    inStock: true,
    description:
      "Coordinated pair of teardrop huggie earrings encrusted with sparkling micro-pavé diamonds that catch the light from every angle.",
  },
  {
    id: "prod-celestial-charm-bracelet",
    slug: "celestial-sun-heart-charm-bracelet",
    name: "Celestial Sun & Heart Charm Bracelet",
    category: "CHARMS & BANGLES",
    image: {
      src: "/images/products/product-charms-celestial.jpg",
      alt: "Celestial Sun & Heart Charm Bracelet - Multi-charm Gold Link",
    },
    priceInr: 21999,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow & Rose Gold",
    materials: ["Gold", "Rose Gold"],
    sizes: ["6.5\"", "7\""],
    createdAt: "2026-09-18T16:00:00Z",
    inStock: true,
    description:
      "Handcrafted link bracelet with three distinctive dangling charms: an embossed sun medallion, dimensional star, and rose gold heart.",
  },
  {
    id: "prod-solitaire-diamond-ring",
    slug: "classic-solitaire-diamond-ring",
    name: "Classic Solitaire Diamond Ring",
    category: "RINGS",
    image: {
      src: "/images/products/product-rings-solitaire-diamond.jpg",
      alt: "Classic Solitaire Diamond Ring - Six-Prong Platinum Crown",
    },
    priceInr: 45000,
    isHot: true,
    isAvailable: true,
    material: "18k Yellow Gold & Platinum",
    materials: ["Gold", "Platinum", "Diamond"],
    sizes: ["6", "7", "8", "9", "10"],
    createdAt: "2026-07-28T11:45:00Z",
    inStock: true,
    description:
      "Signature showpiece engagement ring featuring a sparkling brilliant-cut solitaire diamond held in a classic platinum six-prong crown.",
  },
  {
    id: "prod-emerald-cut-pendant",
    slug: "emerald-cut-solitaire-pendant",
    name: "Emerald Cut Solitaire Pendant",
    category: "NECKLACES",
    image: {
      src: "/images/products/product-necklaces-emerald-cut.jpg",
      alt: "Emerald Cut Solitaire Pendant - Vibrant Green Step-cut Gemstone",
    },
    priceInr: 38500,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold & Natural Colombian Emerald",
    materials: ["Gold"],
    sizes: ["16\"", "18\"", "20\""],
    createdAt: "2026-09-22T08:30:00Z",
    inStock: true,
    description:
      "Captivating emerald-cut green gemstone encased in a sleek 18k yellow gold bezel setting on a delicate cable chain.",
  },
  {
    id: "prod-diamond-tennis-bracelet",
    slug: "classic-diamond-tennis-bracelet",
    name: "Classic Diamond Tennis Bracelet",
    category: "BRACELETS",
    image: {
      src: "/images/products/product-bracelets-diamond-tennis.jpg",
      alt: "Classic Diamond Tennis Bracelet - Continuous Brilliant Diamonds",
    },
    priceInr: 56000,
    compareAtPriceInr: 65000,
    isHot: true,
    isAvailable: true,
    material: "Platinum & Brilliant Diamonds",
    materials: ["Platinum", "Diamond"],
    sizes: ["7\"", "7.5\""],
    createdAt: "2026-08-05T13:20:00Z",
    inStock: true,
    description:
      "Iconic tennis bracelet featuring a continuous ribbon of matched round brilliant diamonds individually handset in 950 platinum.",
  },
  {
    id: "prod-twisted-gold-band",
    slug: "twisted-rope-gold-band",
    name: "Twisted Rope Gold Band",
    category: "RINGS",
    image: {
      src: "/images/collections/collection-rings.jpg",
      alt: "Twisted Rope Gold Band - Hand-twisted 18k Yellow Gold",
    },
    priceInr: 16800,
    isAvailable: true,
    material: "18k Yellow Gold",
    materials: ["Gold"],
    sizes: ["6", "7", "8"],
    createdAt: "2026-06-12T10:00:00Z",
    inStock: true,
    description:
      "Artisanal rope motif sculpted in warm 18k yellow gold with polished and matte textured strands.",
  },
  {
    id: "prod-layered-cable-chain",
    slug: "layered-triple-cable-chain",
    name: "Layered Triple Cable Chain",
    category: "NECKLACES",
    image: {
      src: "/images/collections/collection-necklaces.jpg",
      alt: "Layered Triple Cable Chain - Cascading Fine Links",
    },
    priceInr: 34500,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold",
    materials: ["Gold"],
    sizes: ["16\"", "18\"", "20\""],
    createdAt: "2026-09-25T11:00:00Z",
    inStock: true,
    description:
      "Three cascading tiers of diamond-cut fine cable chains joined by a single bespoke filigree clasp.",
  },
  {
    id: "prod-heritage-rose-gold-bangle",
    slug: "heritage-rose-gold-cuff-bangle",
    name: "Heritage Rose Gold Cuff Bangle",
    category: "BRACELETS",
    image: {
      src: "/images/collections/collection-bracelets.jpg",
      alt: "Heritage Rose Gold Cuff Bangle - Open Silhouette",
    },
    priceInr: 27500,
    isAvailable: true,
    material: "18k Rose Gold",
    materials: ["Rose Gold"],
    sizes: ["6.5\"", "7\""],
    createdAt: "2026-07-14T09:00:00Z",
    inStock: true,
    description:
      "Sculpted open-cuff silhouette cast in lustrous 18k rose gold with mirror-finished tapered finials.",
  },
  {
    id: "prod-diamond-cluster-studs",
    slug: "diamond-cluster-florets-studs",
    name: "Diamond Cluster Floret Studs",
    category: "EARRINGS",
    image: {
      src: "/images/products/product-earrings-pave-diamond.jpg",
      alt: "Diamond Cluster Floret Studs - Seven-Stone Floral Motif",
    },
    priceInr: 22400,
    compareAtPriceInr: 26000,
    isHot: true,
    isAvailable: true,
    material: "18k White Gold & Brilliant Diamonds",
    materials: ["Gold", "Diamond"],
    createdAt: "2026-08-30T15:00:00Z",
    inStock: true,
    description:
      "Floral-inspired cluster studs featuring seven prong-set round brilliant diamonds with secure butterfly backings.",
  },
  {
    id: "prod-astral-charm-choker",
    slug: "astral-medallion-charm-choker",
    name: "Astral Medallion Charm Choker",
    category: "CHARMS & BANGLES",
    image: {
      src: "/images/collections/collection-charms-bangles.jpg",
      alt: "Astral Medallion Charm Choker - Textured Disc Accents",
    },
    priceInr: 19800,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold & Sterling Silver",
    materials: ["Gold", "Silver"],
    sizes: ["16\"", "18\""],
    createdAt: "2026-09-28T14:00:00Z",
    inStock: true,
    description:
      "Vintage-inspired textured disc medallions suspended from an adjustable link chain choker.",
  },
  {
    id: "prod-anniversary-solitaire-gift-box",
    slug: "anniversary-solitaire-curated-set",
    name: "Anniversary Solitaire Curated Set",
    category: "GIFT IDEAS",
    image: {
      src: "/images/collections/collection-gift-ideas.jpg",
      alt: "Anniversary Solitaire Curated Set - Complete Diamond Collection",
    },
    priceInr: 68000,
    compareAtPriceInr: 78000,
    isHot: true,
    isAvailable: true,
    material: "18k Yellow Gold, Platinum & Diamonds",
    materials: ["Gold", "Platinum", "Diamond"],
    sizes: ["7", "8"],
    createdAt: "2026-08-10T12:00:00Z",
    inStock: true,
    description:
      "Exquisite gift collection pairing a solitaire diamond ring with matching bezel-set stud earrings in a luxury keepsake box.",
  },
  {
    id: "prod-infinity-diamond-band",
    slug: "infinity-eternity-diamond-band",
    name: "Infinity Eternity Diamond Band",
    category: "RINGS",
    image: {
      src: "/images/products/product-rings-sculpted-gold.jpg",
      alt: "Infinity Eternity Diamond Band - Full Circle Pavé",
    },
    priceInr: 49500,
    isAvailable: true,
    material: "Platinum & Round Diamonds",
    materials: ["Platinum", "Diamond"],
    sizes: ["6", "7", "8", "9"],
    createdAt: "2026-06-20T10:30:00Z",
    inStock: true,
    description:
      "Continuous band of handset micro-pavé diamonds set in solid 950 platinum symbolizing endless love.",
  },
  {
    id: "prod-bar-pendant-necklace",
    slug: "geometric-diamond-bar-pendant",
    name: "Geometric Diamond Bar Pendant",
    category: "NECKLACES",
    image: {
      src: "/images/products/product-necklaces-solitaire.jpg",
      alt: "Geometric Diamond Bar Pendant - Horizontal Gold Bar",
    },
    priceInr: 31000,
    isAvailable: true,
    material: "18k Rose Gold & Pavé Diamonds",
    materials: ["Rose Gold", "Diamond"],
    sizes: ["16\"", "18\""],
    createdAt: "2026-07-04T16:15:00Z",
    inStock: true,
    description:
      "Modern horizontal bar pendant inlaid with a uniform row of sparkling round diamonds on a whisper-light rose gold chain.",
  },
  {
    id: "prod-starlight-hoop-earrings",
    slug: "starlight-diamond-huggie-hoops",
    name: "Starlight Diamond Huggie Hoops",
    category: "EARRINGS",
    image: {
      src: "/images/products/product-earrings-pave-diamond.jpg",
      alt: "Starlight Diamond Huggie Hoops - Front-Facing Diamonds",
    },
    priceInr: 25500,
    isNew: true,
    isAvailable: true,
    material: "18k Yellow Gold & Micro Diamonds",
    materials: ["Gold", "Diamond"],
    createdAt: "2026-09-15T13:00:00Z",
    inStock: true,
    description:
      "Petite 12mm huggie hoops featuring front-facing flush-set round diamonds designed for effortless daily luxury.",
  },
  {
    id: "prod-signet-crest-ring",
    slug: "oval-signet-crest-ring",
    name: "Oval Signet Crest Ring",
    category: "RINGS",
    image: {
      src: "/images/products/product-rings-sculpted-gold.jpg",
      alt: "Oval Signet Crest Ring - Smooth Satin Gold",
    },
    priceInr: 21500,
    isAvailable: true,
    material: "18k Yellow Gold",
    materials: ["Gold"],
    sizes: ["7", "8", "9", "10"],
    createdAt: "2026-05-18T11:00:00Z",
    inStock: true,
    description:
      "Classic oval signet face with a satin-brushed finish and high-polished shank ready for personalized monogram engraving.",
  },
  {
    id: "prod-silver-beaded-bracelet",
    slug: "sterling-silver-beaded-bracelet",
    name: "Sterling Silver Beaded Bracelet",
    category: "BRACELETS",
    image: {
      src: "/images/products/product-bracelets-dual-tone.jpg",
      alt: "Sterling Silver Beaded Bracelet - Solid Spheres",
    },
    priceInr: 12500,
    isAvailable: true,
    material: "925 Sterling Silver",
    materials: ["Silver"],
    sizes: ["6.5\"", "7\"", "7.5\""],
    createdAt: "2026-04-10T09:30:00Z",
    inStock: true,
    description:
      "Substantial 6mm solid sterling silver spheres strung on high-tensile braided wire with an ornate lobster claw lock.",
  },
  {
    id: "prod-heart-locket-pendant",
    slug: "vintage-heart-filigree-locket",
    name: "Vintage Heart Filigree Locket",
    category: "GIFT IDEAS",
    image: {
      src: "/images/products/product-charms-celestial.jpg",
      alt: "Vintage Heart Filigree Locket - Keepsake Pendant",
    },
    priceInr: 26000,
    isAvailable: true,
    material: "18k Rose Gold",
    materials: ["Rose Gold"],
    sizes: ["18\"", "20\""],
    createdAt: "2026-07-20T15:45:00Z",
    inStock: true,
    description:
      "Hand-engraved scrollwork filigree locket designed to hold two miniature photographs, presented in a velvet gift box.",
  },
  {
    id: "prod-solitaire-drop-earrings",
    slug: "solitaire-bezel-drop-earrings",
    name: "Solitaire Bezel Drop Earrings",
    category: "EARRINGS",
    image: {
      src: "/images/products/product-earrings-pave-diamond.jpg",
      alt: "Solitaire Bezel Drop Earrings - Articulated Drops",
    },
    priceInr: 33500,
    isAvailable: true,
    material: "Platinum & Brilliant Diamonds",
    materials: ["Platinum", "Diamond"],
    createdAt: "2026-06-30T10:00:00Z",
    inStock: true,
    description:
      "Articulated diamond drops swinging freely below solid platinum posts, capturing radiant reflections with every movement.",
  },
  {
    id: "prod-lariat-diamond-necklace",
    slug: "cascading-lariat-diamond-necklace",
    name: "Cascading Lariat Diamond Necklace",
    category: "NECKLACES",
    image: {
      src: "/images/products/product-necklaces-emerald-cut.jpg",
      alt: "Cascading Lariat Diamond Necklace - Dramatic Y-Silhouette",
    },
    priceInr: 42000,
    isHot: true,
    isAvailable: true,
    material: "18k Yellow Gold & Pear Diamond",
    materials: ["Gold", "Diamond"],
    sizes: ["18\"", "20\""],
    createdAt: "2026-08-25T14:20:00Z",
    inStock: true,
    description:
      "Dramatic Y-silhouette lariat necklace featuring a bezel-set brilliant diamond slider terminating in a sparkling pear-shaped drop.",
  },
  {
    id: "prod-braided-leather-charm-bracelet",
    slug: "braided-leather-gold-charm-bracelet",
    name: "Braided Leather & Gold Charm Bracelet",
    category: "CHARMS & BANGLES",
    image: {
      src: "/images/products/product-bracelets-dual-tone.jpg",
      alt: "Braided Leather & Gold Charm Bracelet - Artisan Clasp",
    },
    priceInr: 17500,
    isAvailable: true,
    material: "18k Yellow Gold & Genuine Leather",
    materials: ["Gold"],
    sizes: ["7\"", "7.5\""],
    createdAt: "2026-05-02T12:00:00Z",
    inStock: true,
    description:
      "Supple braided saddle leather wrap accented with polished 18k yellow gold barrel charms and a magnetic bayonet closure.",
  },
  {
    id: "prod-trio-stacking-rings-set",
    slug: "trio-stacking-rings-gift-set",
    name: "Trio Stacking Rings Gift Set",
    category: "GIFT IDEAS",
    image: {
      src: "/images/products/product-rings-sculpted-gold.jpg",
      alt: "Trio Stacking Rings Gift Set - Yellow, White & Rose Gold Bands",
    },
    priceInr: 39500,
    compareAtPriceInr: 46000,
    isHot: true,
    isAvailable: true,
    material: "18k Yellow, White & Rose Gold",
    materials: ["Gold", "Rose Gold", "Silver"],
    sizes: ["6", "7", "8"],
    createdAt: "2026-09-05T16:30:00Z",
    inStock: true,
    description:
      "Three complementary geometric bands in tri-color 18k gold designed to be worn stacked together or solo.",
  },
];

/**
 * Filter, sort, and paginate products using strict numeric and categorical criteria.
 */
export function getShopCatalogue(
  filters: ShopFilters = {},
  sort: SortOption = "default",
  page = 1,
  pageSize = 12,
  categories?: CategoryItem[]
): ShopCatalogueResult {
  const allProducts = SHOP_PRODUCTS;

  // Compute overall catalogue price bounds
  const prices = allProducts.map((p) => p.priceInr);
  const minCataloguePrice = Math.min(...prices);
  const maxCataloguePrice = Math.max(...prices);

  // 1. Filtering
  const filtered = allProducts.filter((product) => {
    // Category filter
    if (filters.category && filters.category !== "all") {
      const selectedCat = filters.category.toLowerCase().trim();
      const match =
        product.category.toLowerCase() === selectedCat ||
        product.categoryKey?.toLowerCase() === selectedCat ||
        JEWELLERY_CATEGORIES.some(
          (c) =>
            (c.id.toLowerCase() === selectedCat || c.categoryKey.toLowerCase() === selectedCat) &&
            c.categoryKey.toLowerCase() === product.category.toLowerCase()
        ) ||
        (categories && categories.some(
          (c) =>
            (c.slug.toLowerCase() === selectedCat || c.id.toLowerCase() === selectedCat || c.name.toLowerCase() === selectedCat) &&
            (c.name.toLowerCase() === product.category.toLowerCase() || c.slug.toLowerCase() === product.category.toLowerCase())
        ));
      if (!match) return false;
    }

    // Price filter (numeric)
    if (filters.minPrice != null && product.priceInr < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice != null && product.priceInr > filters.maxPrice) {
      return false;
    }

    // Material filter (multi-select, match any selected material)
    if (filters.materials && filters.materials.length > 0) {
      const hasMaterial = filters.materials.some((m) =>
        product.materials?.some((pm) => pm.toLowerCase() === m.toLowerCase())
      );
      if (!hasMaterial) return false;
    }

    // Size filter (multi-select, match any selected size)
    if (filters.sizes && filters.sizes.length > 0) {
      const hasSize = filters.sizes.some((s) =>
        product.sizes?.includes(s)
      );
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

  // 2. Sorting
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
        return 0; // Preserves catalogue order
    }
  });

  // 3. Pagination
  const total = sorted.length;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (safePage - 1) * safePageSize;
  const paginatedProducts = total === 0 ? [] : sorted.slice(startIndex, startIndex + safePageSize);

  const fromIndex = total === 0 ? 0 : startIndex + 1;
  const toIndex = total === 0 ? 0 : Math.min(startIndex + safePageSize, total);

  // 4. Compute Counts for Sidebar Badges
  const categoryCounts: Record<string, number> = {};

  if (categories && categories.length > 0) {
    categories.forEach((cat) => {
      const count =
        typeof cat.productCount === "number"
          ? cat.productCount
          : allProducts.filter(
              (p) =>
                p.category.toLowerCase() === cat.name.toLowerCase() ||
                p.category.toLowerCase() === cat.slug.toLowerCase()
            ).length;
      categoryCounts[cat.slug] = count;
      categoryCounts[cat.id] = count;
    });
  }

  JEWELLERY_CATEGORIES.forEach((cat) => {
    if (categoryCounts[cat.id] === undefined) {
      categoryCounts[cat.id] = allProducts.filter(
        (p) => p.category.toLowerCase() === cat.categoryKey.toLowerCase()
      ).length;
    }
  });

  const materialCounts: Record<string, number> = {};
  JEWELLERY_MATERIALS.forEach((mat) => {
    materialCounts[mat] = allProducts.filter((p) =>
      p.materials?.some((pm) => pm.toLowerCase() === mat.toLowerCase())
    ).length;
  });

  const sizeCounts: Record<string, number> = {};
  JEWELLERY_SIZES.forEach((sz) => {
    sizeCounts[sz] = allProducts.filter((p) => p.sizes?.includes(sz)).length;
  });

  return {
    products: paginatedProducts,
    total,
    page: safePage,
    pageSize: safePageSize,
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
 * Enrich a product with multiple gallery images, specifications, review data,
 * subcategory, collection, and stock attributes if not already populated.
 */
export function enrichProductDetails(product: Product): Product {
  const cat = (product.category || "").toUpperCase();

  // Multi-view gallery
  let images = product.images;
  if (!images || images.length < 2) {
    if (cat.includes("NECKLACE")) {
      images = [
        product.image,
        { src: "/images/hero/banner-necklaces.jpg", alt: `${product.name} - Model Editorial View` },
        { src: "/images/collections/collection-necklaces.jpg", alt: `${product.name} - Fine Jewellery Collection View` },
        { src: "/images/instagram/insta-3-layered-necklaces.jpg", alt: `${product.name} - Layered Detail View` },
      ];
    } else if (cat.includes("RING")) {
      images = [
        product.image,
        { src: "/images/hero/banner-statement-rings.jpg", alt: `${product.name} - Hand Lifestyle View` },
        { src: "/images/collections/collection-rings.jpg", alt: `${product.name} - Studio Ring Profile` },
        { src: "/images/instagram/insta-4-solitaire-ring.jpg", alt: `${product.name} - Detail Macro Silhouette` },
      ];
    } else if (cat.includes("BRACELET")) {
      images = [
        product.image,
        { src: "/images/editorial/tennis-bracelets.jpg", alt: `${product.name} - Wrist Silhouette` },
        { src: "/images/collections/collection-bracelets.jpg", alt: `${product.name} - Studio Collection View` },
        { src: "/images/hero/banner-charm-bracelets.jpg", alt: `${product.name} - Editorial Detail View` },
      ];
    } else if (cat.includes("EARRING")) {
      images = [
        product.image,
        { src: "/images/instagram/insta-2-diamond-earrings.jpg", alt: `${product.name} - Editorial Portrait View` },
        { src: "/images/collections/collection-earrings.jpg", alt: `${product.name} - Coordinated Pair Presentation` },
        { src: "/images/instagram/insta-5-gold-earrings.jpg", alt: `${product.name} - Earring Profile Silhouette` },
      ];
    } else if (cat.includes("CHARM") || cat.includes("BANGLE")) {
      images = [
        product.image,
        { src: "/images/collections/collection-charms-bangles.jpg", alt: `${product.name} - Charm Collection Flatlay` },
        { src: "/images/hero/banner-charm-bracelets.jpg", alt: `${product.name} - Stacked Lifestyle View` },
        { src: "/images/instagram/insta-1-rings-bracelet.jpg", alt: `${product.name} - Wrist Detail View` },
      ];
    } else {
      images = [
        product.image,
        { src: "/images/collections/collection-gift-ideas.jpg", alt: `${product.name} - Curated Gift Box Presentation` },
        { src: "/images/editorial/lab-grown-diamonds.jpg", alt: `${product.name} - Luxury Editorial View` },
        { src: "/images/instagram/insta-6-fashion-editorial.jpg", alt: `${product.name} - High Fashion Styling` },
      ];
    }
  }

  // Specifications
  const specs = product.specs || [
    { label: "Precious Metal", value: product.material || "18k Solid Yellow Gold (750 Purity)" },
    {
      label: "Gemstones",
      value: product.materials?.includes("Diamond")
        ? "Conflict-Free Round Brilliant Diamonds (VVS-VS Clarity, F-G Colour)"
        : product.materials?.includes("Emerald")
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

  // Verified Customer Reviews
  const reviews = product.reviews || [
    {
      id: `rev-${product.id}-1`,
      author: "Aditi S.",
      rating: 5,
      date: "18 September 2026",
      comment:
        "The craftsmanship on this piece is truly exquisite. The gold has a warm, radiant lustre that looks even more captivating in person. Arrived securely packaged with the certificate.",
      verified: true,
    },
    {
      id: `rev-${product.id}-2`,
      author: "Rohan Kapoor",
      rating: 5,
      date: "04 October 2026",
      comment:
        "Purchased as an anniversary present. The understated luxury and attention to detail reflect true artistry. Prompt delivery and luxurious unboxing experience.",
      verified: true,
    },
    {
      id: `rev-${product.id}-3`,
      author: "Meera Krishnan",
      rating: 5,
      date: "09 October 2026",
      comment:
        "Comfortable for daily wear, yet elevates any evening ensemble. The finish is flawlessly mirror-polished. Proud to wear PERALAGAE.",
      verified: true,
    },
  ];

  return {
    ...product,
    images,
    specs,
    reviews,
    rating: product.rating ?? 5.0,
    reviewCount: product.reviewCount ?? reviews.length,
    stockCount: product.stockCount ?? 12,
    inStock: product.inStock ?? true,
    isAvailable: product.isAvailable ?? true,
    sku: product.sku || `PRL-${product.id.toUpperCase().replace(/^PROD-/, "")}`,
    subcategory:
      product.subcategory ||
      (cat.includes("RING")
        ? "Rings & Bands"
        : cat.includes("NECKLACE")
        ? "Pendants & Chains"
        : cat.includes("BRACELET")
        ? "Bangles & Tennis"
        : cat.includes("EARRING")
        ? "Huggies & Drops"
        : cat.includes("CHARM")
        ? "Charms & Medallions"
        : "Curated Gift Sets"),
    collection:
      product.collection ||
      (product.materials?.includes("Diamond")
        ? "Solitaire Radiance"
        : product.materials?.includes("Platinum")
        ? "Modern Platinum Classics"
        : product.materials?.includes("Rose Gold")
        ? "Aura Rose Elegance"
        : "Heritage Gold 18k"),
  };
}

/**
 * Retrieve a single product by URL slug (or fallback to product ID).
 * Returns fully enriched product data for the Product Detail Page.
 */
export function getProductBySlug(slug: string): Product | undefined {
  if (!slug) return undefined;
  const normalized = slug.trim().toLowerCase();
  if (
    normalized === "blue-stripes-stone-earrings" ||
    normalized === "blue-stripes-and-stone-earrings" ||
    normalized === "blue-stripes-earrings" ||
    normalized === "prod-blue-stripes-earrings"
  ) {
    return enrichProductDetails(BLUE_STRIPES_PRODUCT);
  }
  const raw = SHOP_PRODUCTS.find(
    (p) => p.slug.toLowerCase() === normalized || p.id.toLowerCase() === normalized
  );
  return raw ? enrichProductDetails(raw) : undefined;
}

/**
 * Retrieve a single product by stable unique ID.
 */
export function getProductById(id: string): Product | undefined {
  if (!id) return undefined;
  if (id === "prod-blue-stripes-earrings") {
    return enrichProductDetails(BLUE_STRIPES_PRODUCT);
  }
  const raw = SHOP_PRODUCTS.find((p) => p.id === id);
  return raw ? enrichProductDetails(raw) : undefined;
}

/**
 * Get adjacent (previous and next) products in the catalogue.
 * Wraps around safely at catalogue boundaries so navigation arrows never break.
 */
export function getAdjacentProducts(productOrSlug: Product | string): {
  prev: Product;
  next: Product;
} {
  const currentSlug = typeof productOrSlug === "string" ? productOrSlug : productOrSlug.slug;
  const currentIndex = SHOP_PRODUCTS.findIndex(
    (p) => p.slug === currentSlug || p.id === currentSlug
  );

  if (currentIndex === -1 || SHOP_PRODUCTS.length <= 1) {
    return {
      prev: enrichProductDetails(SHOP_PRODUCTS[0]),
      next: enrichProductDetails(SHOP_PRODUCTS[SHOP_PRODUCTS.length - 1]),
    };
  }

  const prevIndex = (currentIndex - 1 + SHOP_PRODUCTS.length) % SHOP_PRODUCTS.length;
  const nextIndex = (currentIndex + 1) % SHOP_PRODUCTS.length;

  return {
    prev: enrichProductDetails(SHOP_PRODUCTS[prevIndex]),
    next: enrichProductDetails(SHOP_PRODUCTS[nextIndex]),
  };
}

/**
 * Get all available products in the catalogue.
 */
export function getAllProducts(): Product[] {
  return SHOP_PRODUCTS.map(enrichProductDetails);
}

