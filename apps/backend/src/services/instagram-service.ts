import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";
import { InstagramMediaService } from "./instagram-media-service.js";

export interface InstagramImageInput {
  id?: string | undefined;
  imageUrl: string;
  altText?: string | null | undefined;
  postUrl?: string | null | undefined;
  order?: number | undefined;
  isActive?: boolean | undefined;
}

export interface InstagramSectionUpdateInput {
  heading?: string | undefined;
  handle?: string | undefined;
  profileUrl?: string | null | undefined;
  isActive?: boolean | undefined;
  images?: InstagramImageInput[] | undefined;
}

const DEFAULT_HEADING = "Follow Us on Instagram";
const DEFAULT_HANDLE = "@peralagaeofficial";

const BASELINE_IMAGES = [
  {
    imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg",
    altText: "Close-up of elegant 18k yellow gold rings and delicate floral bracelet on model's hand",
    postUrl: null,
    order: 0,
    isActive: true,
  },
  {
    imageUrl: "/images/instagram/insta-2-diamond-earrings.jpg",
    altText: "Studio macro photography of luxury diamond drop earrings set in white gold on stone pedestal",
    postUrl: null,
    order: 1,
    isActive: true,
  },
  {
    imageUrl: "/images/instagram/insta-3-layered-necklaces.jpg",
    altText: "Editorial lifestyle portrait of an elegant woman wearing layered delicate gold necklaces",
    postUrl: null,
    order: 2,
    isActive: true,
  },
  {
    imageUrl: "/images/instagram/insta-4-solitaire-ring.jpg",
    altText: "Close-up photograph of a sparkling solitaire diamond ring and gold bangles on a model's hand",
    postUrl: null,
    order: 3,
    isActive: true,
  },
  {
    imageUrl: "/images/instagram/insta-5-gold-earrings.jpg",
    altText: "Refined luxury gold drop earrings with filigree craftsmanship resting on ivory marble",
    postUrl: null,
    order: 4,
    isActive: true,
  },
  {
    imageUrl: "/images/instagram/insta-6-fashion-editorial.jpg",
    altText: "Fashion editorial portrait of a sophisticated woman wearing luxury diamond earrings and tennis bracelet",
    postUrl: null,
    order: 5,
    isActive: true,
  },
];

export class InstagramService {
  /**
   * Initializes baseline Instagram section settings & cards in MongoDB if none exist.
   */
  static async seedInitialData(): Promise<void> {
    try {
      await InstagramMediaService.syncDiskToDatabase();

      const existing = await prisma.instagramSectionSetting.findUnique({
        where: { id: "current" },
        include: { images: true },
      });

      if (!existing) {
        logger.info("Initializing baseline Instagram section in MongoDB...");

        const setting = await prisma.instagramSectionSetting.create({
          data: {
            id: "current",
            heading: DEFAULT_HEADING,
            handle: DEFAULT_HANDLE,
            profileUrl: null,
            isActive: true,
            version: 1,
            images: {
              create: BASELINE_IMAGES,
            },
          },
          include: { images: true },
        });

        await prisma.instagramSectionHistory.create({
          data: {
            version: 1,
            heading: setting.heading,
            handle: setting.handle,
            profileUrl: setting.profileUrl,
            isActive: setting.isActive,
            images: setting.images as any,
            description: "Initial baseline Instagram section migration",
            createdBy: "system",
          },
        });

        logger.info("Baseline Instagram section initialized in MongoDB successfully.");
      } else if (existing.images.length === 0) {
        logger.info("Populating initial baseline Instagram images...");
        await prisma.instagramImage.createMany({
          data: BASELINE_IMAGES.map((img) => ({
            ...img,
            sectionId: "current",
          })),
        });
        logger.info("Baseline Instagram images populated successfully.");
      }
    } catch (err) {
      logger.warn({ err }, "Instagram baseline seeding skipped or encountered warning");
    }
  }

  /**
   * Retrieves the current Instagram section settings and images from MongoDB.
   */
  static async getInstagramSection(options: { publicOnly?: boolean } = {}) {
    const { publicOnly = false } = options;

    let setting = await prisma.instagramSectionSetting.findUnique({
      where: { id: "current" },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!setting) {
      await this.seedInitialData();
      setting = await prisma.instagramSectionSetting.findUnique({
        where: { id: "current" },
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      });
    }

    if (!setting) {
      throw new Error("Failed to initialize or fetch Instagram section settings.");
    }

    let images = setting.images;
    if (publicOnly) {
      if (!setting.isActive) {
        return {
          id: setting.id,
          heading: setting.heading,
          handle: setting.handle,
          profileUrl: setting.profileUrl,
          isActive: false,
          version: setting.version,
          updatedAt: setting.updatedAt,
          updatedBy: setting.updatedBy,
          images: [],
        };
      }
      images = images.filter((img) => img.isActive);
    }

    return {
      id: setting.id,
      heading: setting.heading,
      handle: setting.handle,
      profileUrl: setting.profileUrl,
      isActive: setting.isActive,
      version: setting.version,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
      images: images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText,
        postUrl: img.postUrl,
        order: img.order,
        isActive: img.isActive,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })),
    };
  }

  /**
   * Updates and publishes the Instagram Section.
   * Creates an independent snapshot in InstagramSectionHistory before updating.
   */
  static async updateInstagramSection(
    input: InstagramSectionUpdateInput,
    adminUser = "admin"
  ) {
    const current = await this.getInstagramSection({ publicOnly: false });

    return await prisma.$transaction(
      async (tx) => {
        // 1. Snapshot current state into InstagramSectionHistory
        await tx.instagramSectionHistory.create({
          data: {
            version: current.version,
            heading: current.heading,
            handle: current.handle,
            profileUrl: current.profileUrl,
            isActive: current.isActive,
            images: current.images as any,
            description: `Snapshot before publishing version ${current.version + 1}`,
            createdBy: adminUser,
          },
        });

        const nextVersion = current.version + 1;
        const heading = input.heading?.trim() || current.heading;
        const handle = input.handle?.trim() || current.handle;
        const profileUrl = input.profileUrl !== undefined ? (input.profileUrl ? input.profileUrl.trim() : null) : current.profileUrl;
        const isActive = input.isActive !== undefined ? input.isActive : current.isActive;

        // 2. Upsert Section Setting
        const updatedSetting = await tx.instagramSectionSetting.upsert({
          where: { id: "current" },
          create: {
            id: "current",
            heading,
            handle,
            profileUrl,
            isActive,
            version: nextVersion,
            updatedBy: adminUser,
          },
          update: {
            heading,
            handle,
            profileUrl,
            isActive,
            version: nextVersion,
            updatedBy: adminUser,
          },
        });

        // 3. Update images if supplied
        if (input.images !== undefined) {
          // Delete existing images for sectionId 'current'
          await tx.instagramImage.deleteMany({
            where: { sectionId: "current" },
          });

          // Insert new image set with strict order index
          if (input.images.length > 0) {
            await tx.instagramImage.createMany({
              data: input.images.map((img, index) => ({
                sectionId: "current",
                imageUrl: img.imageUrl.trim(),
                altText: img.altText ? img.altText.trim() : null,
                postUrl: img.postUrl ? img.postUrl.trim() : null,
                order: img.order !== undefined ? img.order : index,
                isActive: img.isActive !== undefined ? img.isActive : true,
              })),
            });
          }
        }

        return {
          id: updatedSetting.id,
          heading: updatedSetting.heading,
          handle: updatedSetting.handle,
          profileUrl: updatedSetting.profileUrl,
          isActive: updatedSetting.isActive,
          version: updatedSetting.version,
          updatedAt: updatedSetting.updatedAt,
          updatedBy: updatedSetting.updatedBy,
        };
      },
      { maxWait: 20000, timeout: 60000 }
    );
  }

  /**
   * Retrieves version history snapshots for the Instagram section.
   */
  static async getSectionHistory(limit = 20) {
    const history = await prisma.instagramSectionHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });

    return history.map((item) => ({
      id: item.id,
      version: item.version,
      heading: item.heading,
      handle: item.handle,
      profileUrl: item.profileUrl,
      isActive: item.isActive,
      imagesCount: Array.isArray(item.images) ? (item.images as any[]).length : 0,
      description: item.description,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    }));
  }

  /**
   * Restores an older version snapshot from InstagramSectionHistory.
   */
  static async restoreSectionVersion(historyId: string, adminUser = "admin") {
    const historicalEntry = await prisma.instagramSectionHistory.findUnique({
      where: { id: historyId },
    });

    if (!historicalEntry) {
      throw new Error(`Version history snapshot "${historyId}" not found.`);
    }

    const current = await this.getInstagramSection({ publicOnly: false });

    return await prisma.$transaction(
      async (tx) => {
        // 1. Create a backup snapshot of the current state before rollback
        await tx.instagramSectionHistory.create({
          data: {
            version: current.version,
            heading: current.heading,
            handle: current.handle,
            profileUrl: current.profileUrl,
            isActive: current.isActive,
            images: current.images as any,
            description: `Backup snapshot before restoring version ${historicalEntry.version}`,
            createdBy: adminUser,
          },
        });

        const nextVersion = current.version + 1;

        // 2. Restore settings from the snapshot
        const updatedSetting = await tx.instagramSectionSetting.upsert({
          where: { id: "current" },
          create: {
            id: "current",
            heading: historicalEntry.heading,
            handle: historicalEntry.handle,
            profileUrl: historicalEntry.profileUrl,
            isActive: historicalEntry.isActive,
            version: nextVersion,
            updatedBy: adminUser,
          },
          update: {
            heading: historicalEntry.heading,
            handle: historicalEntry.handle,
            profileUrl: historicalEntry.profileUrl,
            isActive: historicalEntry.isActive,
            version: nextVersion,
            updatedBy: adminUser,
          },
        });

        // 3. Restore images
        await tx.instagramImage.deleteMany({
          where: { sectionId: "current" },
        });

        const historicalImages = Array.isArray(historicalEntry.images)
          ? (historicalEntry.images as any[])
          : [];

        if (historicalImages.length > 0) {
          await tx.instagramImage.createMany({
            data: historicalImages.map((img: any, index: number) => ({
              sectionId: "current",
              imageUrl: img.imageUrl,
              altText: img.altText ?? null,
              postUrl: img.postUrl ?? null,
              order: typeof img.order === "number" ? img.order : index,
              isActive: img.isActive !== undefined ? Boolean(img.isActive) : true,
            })),
          });
        }

        return {
          id: updatedSetting.id,
          heading: updatedSetting.heading,
          handle: updatedSetting.handle,
          profileUrl: updatedSetting.profileUrl,
          isActive: updatedSetting.isActive,
          version: updatedSetting.version,
          updatedAt: updatedSetting.updatedAt,
          updatedBy: updatedSetting.updatedBy,
          restoredFromVersion: historicalEntry.version,
        };
      },
      { maxWait: 20000, timeout: 60000 }
    );
  }
}
