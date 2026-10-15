import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt?: string | null;
  description?: string | null;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string | undefined;
  imageUrl: string;
  imageAlt?: string | undefined;
  description?: string | undefined;
  order?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateCategoryInput {
  name?: string | undefined;
  slug?: string | undefined;
  imageUrl?: string | undefined;
  imageAlt?: string | undefined;
  description?: string | undefined;
  order?: number | undefined;
  isActive?: boolean | undefined;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Baseline Categories ───────────────────────────────────────────────────────
export const BASELINE_CATEGORIES = [
  {
    id: "collection-necklaces",
    name: "NECKLACES",
    slug: "necklaces",
    imageUrl: "/images/collections/collection-necklaces.jpg",
    imageAlt: "Necklaces Collection - Delicate White Gold & Diamond Pendant",
    description: "Curated fine necklaces, pendants, and chains in 18k gold and platinum.",
    order: 1,
    isActive: true,
  },
  {
    id: "collection-rings",
    name: "RINGS",
    slug: "rings",
    imageUrl: "/images/collections/collection-rings.jpg",
    imageAlt: "Rings Collection - Sculptural 18k Yellow Gold Band",
    description: "Exquisite engagement rings, bands, and statement cocktail rings.",
    order: 2,
    isActive: true,
  },
  {
    id: "collection-bracelets",
    name: "BRACELETS",
    slug: "bracelets",
    imageUrl: "/images/collections/collection-bracelets.jpg",
    imageAlt: "Bracelets Collection - Minimalist Dual-Tone Gold & Silver Bangle",
    description: "Tennis bracelets, chain link bracelets, and handcrafted cuffs.",
    order: 3,
    isActive: true,
  },
  {
    id: "collection-earrings",
    name: "EARRINGS",
    slug: "earrings",
    imageUrl: "/images/collections/collection-earrings.jpg",
    imageAlt: "Earrings Collection - Coordinated White Gold & Diamond Teardrop Earrings",
    description: "Studs, huggies, hoops, and chandelier drops in precious metals.",
    order: 4,
    isActive: true,
  },
  {
    id: "collection-charms-bangles",
    name: "CHARMS & BANGLES",
    slug: "charms-bangles",
    imageUrl: "/images/collections/collection-charms-bangles.jpg",
    imageAlt: "Charms & Bangles Collection - Warm Rose Gold Charm Bangle",
    description: "Intricate charms, traditional bangles, and stackable heirloom pieces.",
    order: 5,
    isActive: true,
  },
  {
    id: "collection-gift-ideas",
    name: "GIFT IDEAS",
    slug: "gift-ideas",
    imageUrl: "/images/collections/collection-gift-ideas.jpg",
    imageAlt: "Gift Ideas Collection - Solitaire Diamond Engagement Ring",
    description: "Thoughtfully selected gifts for memorable occasions and celebrations.",
    order: 6,
    isActive: true,
  },
];

let isInitialized = false;

export class CategoryService {
  /**
   * Idempotent seeder that guarantees the 6 baseline categories and 24 products
   * exist in PostgreSQL upon startup.
   */
  static async seedInitialData(): Promise<void> {
    if (isInitialized) return;

    try {
      const categoryCount = await prisma.category.count();
      if (categoryCount === 0) {
        logger.info("Initializing baseline categories in PostgreSQL...");
        for (const cat of BASELINE_CATEGORIES) {
          await prisma.category.upsert({
            where: { slug: cat.slug },
            create: {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              imageUrl: cat.imageUrl,
              imageAlt: cat.imageAlt,
              description: cat.description,
              order: cat.order,
              isActive: cat.isActive,
            },
            update: {},
          });
        }
        logger.info({ count: BASELINE_CATEGORIES.length }, "Baseline categories initialized");
      }

      const productCount = await prisma.product.count();
      if (productCount === 0) {
        logger.info("Initializing catalogue products in PostgreSQL...");
        const seedProductsPath = path.resolve(process.cwd(), "data", "seed-products.json");
        let productsData: any[] = [];
        if (fs.existsSync(seedProductsPath)) {
          productsData = JSON.parse(fs.readFileSync(seedProductsPath, "utf-8"));
        }

        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map((c) => [c.name.toUpperCase(), c.id]));

        for (const prod of productsData) {
          const categoryId = categoryMap.get(prod.category.toUpperCase()) || null;
          await prisma.product.upsert({
            where: { slug: prod.slug },
            create: {
              id: prod.id,
              slug: prod.slug,
              name: prod.name,
              categoryId,
              categoryKey: prod.category,
              imageUrl: prod.image?.src || "",
              imageAlt: prod.image?.alt || "",
              priceInr: prod.priceInr || 0,
              compareAtPriceInr: prod.compareAtPriceInr ?? null,
              isHot: Boolean(prod.isHot),
              isNew: Boolean(prod.isNew),
              isAvailable: prod.isAvailable !== false,
              inStock: prod.inStock !== false,
              stockCount: prod.stockCount || 10,
              material: prod.material || null,
              materials: prod.materials || [],
              sizes: prod.sizes || [],
              images: prod.images || [],
              description: prod.description || null,
            },
            update: {},
          });
        }
        logger.info({ count: productsData.length }, "Catalogue products initialized in PostgreSQL");
      }

      isInitialized = true;
    } catch (err) {
      logger.warn({ err }, "Could not complete category seed to PostgreSQL");
    }
  }

  /**
   * Retrieves all categories ordered by `order ASC, createdAt ASC`.
   */
  static async getAllCategories(options?: { includeInactive?: boolean }): Promise<CategoryItem[]> {
    await this.seedInitialData();

    const where = options?.includeInactive ? {} : { isActive: true };

    const records = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.imageUrl,
      imageAlt: r.imageAlt,
      description: r.description,
      order: r.order,
      isActive: r.isActive,
      productCount: r._count.products,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Retrieves a category by ID with its authoritative product count.
   */
  static async getCategoryById(id: string): Promise<CategoryItem | null> {
    await this.seedInitialData();

    const r = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.imageUrl,
      imageAlt: r.imageAlt,
      description: r.description,
      order: r.order,
      isActive: r.isActive,
      productCount: r._count.products,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves a category by URL slug.
   */
  static async getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
    await this.seedInitialData();

    const r = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.imageUrl,
      imageAlt: r.imageAlt,
      description: r.description,
      order: r.order,
      isActive: r.isActive,
      productCount: r._count.products,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /**
   * Creates a new category with server-side validation.
   */
  static async createCategory(input: CreateCategoryInput): Promise<CategoryItem> {
    await this.seedInitialData();

    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error("Category name is required");
    }

    const cleanSlug = slugify(input.slug?.trim() || cleanName);
    if (!cleanSlug) {
      throw new Error("A valid URL-safe slug is required");
    }

    if (!input.imageUrl?.trim()) {
      throw new Error("Category image is required");
    }

    // Check duplicate name (case-insensitive)
    const existingName = await prisma.category.findFirst({
      where: {
        name: {
          equals: cleanName,
          mode: "insensitive",
        },
      },
    });
    if (existingName) {
      throw new Error(`A category with the name "${cleanName}" already exists`);
    }

    // Check duplicate slug
    const existingSlug = await prisma.category.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingSlug) {
      throw new Error(`A category with the slug "${cleanSlug}" already exists`);
    }

    // Calculate order
    let targetOrder = input.order;
    if (targetOrder === undefined || targetOrder === null) {
      const maxOrderCat = await prisma.category.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      targetOrder = (maxOrderCat?.order ?? 0) + 1;
    }

    const created = await prisma.category.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        imageUrl: input.imageUrl.trim(),
        imageAlt: input.imageAlt?.trim() ?? null,
        description: input.description?.trim() ?? null,
        order: targetOrder,
        isActive: input.isActive ?? true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    logger.info({ id: created.id, name: created.name, slug: created.slug }, "Category created successfully");

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      imageUrl: created.imageUrl,
      imageAlt: created.imageAlt,
      description: created.description,
      order: created.order,
      isActive: created.isActive,
      productCount: created._count.products,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Updates an existing category. Preserves stable category ID and product associations.
   */
  static async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryItem> {
    await this.seedInitialData();

    const existing = await prisma.category.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("Category not found");
    }

    const dataToUpdate: any = {};

    if (input.name !== undefined) {
      const cleanName = input.name.trim();
      if (!cleanName) {
        throw new Error("Category name cannot be empty");
      }
      // Check duplicate name on another record
      const duplicateName = await prisma.category.findFirst({
        where: {
          id: { not: id },
          name: {
            equals: cleanName,
            mode: "insensitive",
          },
        },
      });
      if (duplicateName) {
        throw new Error(`A category with the name "${cleanName}" already exists`);
      }
      dataToUpdate.name = cleanName;
    }

    if (input.slug !== undefined) {
      const cleanSlug = slugify(input.slug.trim());
      if (!cleanSlug) {
        throw new Error("Category slug cannot be empty");
      }
      // Check duplicate slug on another record
      const duplicateSlug = await prisma.category.findFirst({
        where: {
          id: { not: id },
          slug: cleanSlug,
        },
      });
      if (duplicateSlug) {
        throw new Error(`A category with the slug "${cleanSlug}" already exists`);
      }
      dataToUpdate.slug = cleanSlug;
    }

    if (input.imageUrl !== undefined) {
      if (!input.imageUrl.trim()) {
        throw new Error("Category image cannot be empty");
      }
      dataToUpdate.imageUrl = input.imageUrl.trim();
    }

    if (input.imageAlt !== undefined) {
      dataToUpdate.imageAlt = input.imageAlt?.trim() || null;
    }

    if (input.description !== undefined) {
      dataToUpdate.description = input.description?.trim() || null;
    }

    if (input.order !== undefined) {
      dataToUpdate.order = Number(input.order);
    }

    if (input.isActive !== undefined) {
      dataToUpdate.isActive = Boolean(input.isActive);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    logger.info({ id: updated.id, name: updated.name }, "Category updated successfully");

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      imageUrl: updated.imageUrl,
      imageAlt: updated.imageAlt,
      description: updated.description,
      order: updated.order,
      isActive: updated.isActive,
      productCount: updated._count.products,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Reorders categories sequentially based on provided array of category IDs.
   */
  static async reorderCategories(orderedIds: string[]): Promise<CategoryItem[]> {
    await this.seedInitialData();

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return this.getAllCategories({ includeInactive: true });
  }

  /**
   * Deletes a category and permanently cascades deletion to all associated products.
   * Atomic database transaction guarantees no orphaned products or partial states.
   */
  static async deleteCategory(
    id: string
  ): Promise<{ deletedCategory: CategoryItem; deletedProductCount: number }> {
    await this.seedInitialData();

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const productCount = category._count.products;

    const formattedDeleted: CategoryItem = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      imageAlt: category.imageAlt,
      description: category.description,
      order: category.order,
      isActive: category.isActive,
      productCount,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };

    // Atomic transaction: Delete associated products, then delete the category
    await prisma.$transaction([
      prisma.product.deleteMany({
        where: { categoryId: id },
      }),
      prisma.category.delete({
        where: { id },
      }),
    ]);

    logger.info(
      { id, name: category.name, deletedProductCount: productCount },
      "Category and associated products permanently deleted"
    );

    return {
      deletedCategory: formattedDeleted,
      deletedProductCount: productCount,
    };
  }
}
