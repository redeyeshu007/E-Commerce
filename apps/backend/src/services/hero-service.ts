import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface HeroImageSlot1 {
  id: "heroImage1";
  name: "Hero Image 1";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
  description: string;
}

export interface HeroImageSlot2 {
  id: "heroImage2";
  name: "Hero Image 2";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
}

export interface HeroImageSlot3 {
  id: "heroImage3";
  name: "Hero Image 3";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
}

export interface HeroSettings {
  id: string;
  heroImage1: HeroImageSlot1;
  heroImage2: HeroImageSlot2;
  heroImage3: HeroImageSlot3;
  version: number;
  heroImage1Version: number;
  heroImage2Version: number;
  heroImage3Version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface HeroSlot1UpdateInput {
  imageUrl?: string | undefined;
  imageAlt?: string | undefined;
  normalHeadline?: string | undefined;
  boldHeadline?: string | undefined;
  description?: string | undefined;
}

export interface HeroSlot2UpdateInput {
  imageUrl?: string | undefined;
  imageAlt?: string | undefined;
  normalHeadline?: string | undefined;
  boldHeadline?: string | undefined;
}

export interface HeroSlot3UpdateInput {
  imageUrl?: string | undefined;
  imageAlt?: string | undefined;
  normalHeadline?: string | undefined;
  boldHeadline?: string | undefined;
}

export interface HeroSettingsUpdateInput {
  heroImage1?: HeroSlot1UpdateInput | undefined;
  heroImage2?: HeroSlot2UpdateInput | undefined;
  heroImage3?: HeroSlot3UpdateInput | undefined;
}

export interface HeroHistoryItem {
  id: string;
  slotId: "heroImage1" | "heroImage2" | "heroImage3";
  version: number;
  imageUrl: string;
  normalHeadline: string;
  boldHeadline: string;
  description?: string | undefined;
  createdAt: string;
  createdBy: string;
  isCurrent?: boolean | undefined;
}

export const defaultHeroSettings: HeroSettings = {
  id: "current",
  heroImage1: {
    id: "heroImage1",
    name: "Hero Image 1",
    imageUrl: "/images/hero/banner-necklaces.jpg",
    imageAlt: "Necklaces & Body Jewels - PERALAGAE",
    normalHeadline: "Necklaces &",
    boldHeadline: "Body Jewels",
    description: "Look to our new season collection for girls.",
  },
  heroImage2: {
    id: "heroImage2",
    name: "Hero Image 2",
    imageUrl: "/images/hero/banner-desk-hals.jpg",
    imageAlt: "Just Lunched Desk The Hals - PERALAGAE",
    normalHeadline: "Just Lunched",
    boldHeadline: "Desk The Hals",
  },
  heroImage3: {
    id: "heroImage3",
    name: "Hero Image 3",
    imageUrl: "/images/hero/banner-charm-bracelets.jpg",
    imageAlt: "Jewelry & Charm Bracelets - PERALAGAE",
    normalHeadline: "Jewelry &",
    boldHeadline: "Charm Bracelets",
  },
  version: 1,
  heroImage1Version: 1,
  heroImage2Version: 1,
  heroImage3Version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

// Data persistence file paths for legacy import
const DATA_DIR = path.resolve(process.cwd(), "data");
const SETTINGS_FILE_PATH = path.join(DATA_DIR, "hero-settings.json");
const HISTORY_FILE_PATH = path.join(DATA_DIR, "hero-history.json");

// In-memory cache for fast read performance
let memoryHeroSettings: HeroSettings = { ...defaultHeroSettings };
let memoryHero1History: HeroHistoryItem[] = [];
let memoryHero2History: HeroHistoryItem[] = [];
let memoryHero3History: HeroHistoryItem[] = [];
let isSeeded = false;

function createDefaultHistory(): {
  heroImage1: HeroHistoryItem[];
  heroImage2: HeroHistoryItem[];
  heroImage3: HeroHistoryItem[];
} {
  const initDate = new Date().toISOString();
  return {
    heroImage1: [
      {
        id: "hist_hero1_init",
        slotId: "heroImage1",
        version: 1,
        imageUrl: defaultHeroSettings.heroImage1.imageUrl,
        normalHeadline: defaultHeroSettings.heroImage1.normalHeadline,
        boldHeadline: defaultHeroSettings.heroImage1.boldHeadline,
        description: defaultHeroSettings.heroImage1.description,
        createdAt: initDate,
        createdBy: "system",
      },
    ],
    heroImage2: [
      {
        id: "hist_hero2_init",
        slotId: "heroImage2",
        version: 1,
        imageUrl: defaultHeroSettings.heroImage2.imageUrl,
        normalHeadline: defaultHeroSettings.heroImage2.normalHeadline,
        boldHeadline: defaultHeroSettings.heroImage2.boldHeadline,
        createdAt: initDate,
        createdBy: "system",
      },
    ],
    heroImage3: [
      {
        id: "hist_hero3_init",
        slotId: "heroImage3",
        version: 1,
        imageUrl: defaultHeroSettings.heroImage3.imageUrl,
        normalHeadline: defaultHeroSettings.heroImage3.normalHeadline,
        boldHeadline: defaultHeroSettings.heroImage3.boldHeadline,
        createdAt: initDate,
        createdBy: "system",
      },
    ],
  };
}

export class HeroService {
  /**
   * Safely and idempotently reconciles PostgreSQL with legacy JSON or default hero settings & history.
   * If legacy JSON has a newer version than current DB record, upgrades DB safely.
   * Never overwrites newer valid DB data with older defaults.
   */
  static async syncLegacyData(): Promise<void> {
    if (isSeeded) return;
    try {
      const existingSettings = await prisma.heroSetting.findUnique({
        where: { id: "current" },
      });

      let initialSettings = defaultHeroSettings;
      let hasFileSettings = false;

      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        try {
          const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, "utf-8"));
          if (raw && raw.heroImage1 && raw.heroImage2 && raw.heroImage3) {
            initialSettings = {
              ...defaultHeroSettings,
              ...raw,
              heroImage1Version: raw.heroImage1Version ?? 1,
              heroImage2Version: raw.heroImage2Version ?? 1,
              heroImage3Version: raw.heroImage3Version ?? 1,
              version: raw.version ?? 1,
            };
            hasFileSettings = true;
          }
        } catch {
          // Use default if file parse fails
        }
      }

      if (!existingSettings) {
        await prisma.heroSetting.create({
          data: {
            id: "current",
            heroImage1: initialSettings.heroImage1 as unknown as object,
            heroImage2: initialSettings.heroImage2 as unknown as object,
            heroImage3: initialSettings.heroImage3 as unknown as object,
            heroImage1Version: initialSettings.heroImage1Version,
            heroImage2Version: initialSettings.heroImage2Version,
            heroImage3Version: initialSettings.heroImage3Version,
            version: initialSettings.version,
            updatedBy: initialSettings.updatedBy || "system",
          },
        });
        logger.info("Hero settings initialized in PostgreSQL");
      } else if (hasFileSettings && initialSettings.version > existingSettings.version) {
        // Reconcile: file contains newer valid saved changes than current database record
        await prisma.heroSetting.update({
          where: { id: "current" },
          data: {
            heroImage1: initialSettings.heroImage1 as unknown as object,
            heroImage2: initialSettings.heroImage2 as unknown as object,
            heroImage3: initialSettings.heroImage3 as unknown as object,
            heroImage1Version: initialSettings.heroImage1Version,
            heroImage2Version: initialSettings.heroImage2Version,
            heroImage3Version: initialSettings.heroImage3Version,
            version: initialSettings.version,
            updatedBy: initialSettings.updatedBy || "system",
          },
        });
        logger.info(
          { fileVersion: initialSettings.version, dbVersion: existingSettings.version },
          "Reconciled hero settings: upgraded database record to newer saved version"
        );
      }

      // Reconcile history from history JSON file without deleting existing DB records
      if (fs.existsSync(HISTORY_FILE_PATH)) {
        try {
          const rawHist = JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, "utf-8"));
          const allItems = [
            ...(Array.isArray(rawHist.heroImage1) ? rawHist.heroImage1 : []),
            ...(Array.isArray(rawHist.heroImage2) ? rawHist.heroImage2 : []),
            ...(Array.isArray(rawHist.heroImage3) ? rawHist.heroImage3 : []),
          ];

          for (const item of allItems) {
            const id = item.id || `hist_${item.slotId}_${item.version}`;
            const existing = await prisma.heroHistory.findUnique({ where: { id } });
            if (!existing) {
              await prisma.heroHistory.create({
                data: {
                  id,
                  slotId: item.slotId,
                  version: item.version,
                  imageUrl: item.imageUrl,
                  normalHeadline: item.normalHeadline,
                  boldHeadline: item.boldHeadline,
                  description: item.description ?? null,
                  createdAt: new Date(item.createdAt || Date.now()),
                  createdBy: item.createdBy || "system",
                },
              });
            }
          }
          logger.info("Hero history reconciled in PostgreSQL");
        } catch (err) {
          logger.warn({ err }, "Could not sync history file items");
        }
      }

      isSeeded = true;
    } catch (err) {
      logger.warn({ err }, "Could not sync legacy hero data to PostgreSQL");
    }
  }

  /**
   * Synchronizes live hero settings and history to persistent local files as a durable backup.
   */
  private static async syncToFileBackup(settings: HeroSettings): Promise<void> {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");

      const h1 = await prisma.heroHistory.findMany({
        where: { slotId: "heroImage1" },
        orderBy: { version: "desc" },
      });
      const h2 = await prisma.heroHistory.findMany({
        where: { slotId: "heroImage2" },
        orderBy: { version: "desc" },
      });
      const h3 = await prisma.heroHistory.findMany({
        where: { slotId: "heroImage3" },
        orderBy: { version: "desc" },
      });

      const histData = {
        heroImage1: h1.map((r) => ({
          ...r,
          description: r.description ?? undefined,
          createdAt: r.createdAt.toISOString(),
        })),
        heroImage2: h2.map((r) => ({
          ...r,
          description: r.description ?? undefined,
          createdAt: r.createdAt.toISOString(),
        })),
        heroImage3: h3.map((r) => ({
          ...r,
          description: r.description ?? undefined,
          createdAt: r.createdAt.toISOString(),
        })),
      };
      fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(histData, null, 2), "utf-8");
    } catch (err) {
      logger.warn({ err }, "Could not write hero backup files to disk");
    }
  }

  /**
   * Resets in-memory cache back to baseline defaults for testing.
   * Does NOT wipe persistent PostgreSQL database records or version history.
   */
  static async resetToDefault(): Promise<void> {
    memoryHeroSettings = {
      ...defaultHeroSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };
    const defHist = createDefaultHistory();
    memoryHero1History = defHist.heroImage1;
    memoryHero2History = defHist.heroImage2;
    memoryHero3History = defHist.heroImage3;

    // Only reset database if explicitly requested in isolated test mode
    if (process.env["ALLOW_DATABASE_RESET"] === "true") {
      try {
        await prisma.heroSetting.upsert({
          where: { id: "current" },
          create: {
            id: "current",
            heroImage1: defaultHeroSettings.heroImage1 as unknown as object,
            heroImage2: defaultHeroSettings.heroImage2 as unknown as object,
            heroImage3: defaultHeroSettings.heroImage3 as unknown as object,
            heroImage1Version: 1,
            heroImage2Version: 1,
            heroImage3Version: 1,
            version: 1,
            updatedBy: "system",
          },
          update: {
            heroImage1: defaultHeroSettings.heroImage1 as unknown as object,
            heroImage2: defaultHeroSettings.heroImage2 as unknown as object,
            heroImage3: defaultHeroSettings.heroImage3 as unknown as object,
            heroImage1Version: 1,
            heroImage2Version: 1,
            heroImage3Version: 1,
            version: 1,
            updatedBy: "system",
          },
        });
      } catch {
        // In-memory fallback
      }
    }
  }

  /**
   * Retrieves current published Hero Settings from Supabase PostgreSQL.
   */
  static async getSettings(): Promise<HeroSettings> {
    try {
      await this.syncLegacyData();

      const record = await prisma.heroSetting.findUnique({
        where: { id: "current" },
      });

      if (record) {
        const formatted: HeroSettings = {
          id: record.id,
          heroImage1: record.heroImage1 as unknown as HeroImageSlot1,
          heroImage2: record.heroImage2 as unknown as HeroImageSlot2,
          heroImage3: record.heroImage3 as unknown as HeroImageSlot3,
          version: record.version,
          heroImage1Version: record.heroImage1Version,
          heroImage2Version: record.heroImage2Version,
          heroImage3Version: record.heroImage3Version,
          updatedAt: record.updatedAt.toISOString(),
          updatedBy: record.updatedBy || "system",
        };
        memoryHeroSettings = formatted;
        return formatted;
      }
      throw new Error("Hero settings record not found in PostgreSQL database");
    } catch (err) {
      logger.error({ err }, "Database fetch failed for hero settings");
      throw err;
    }
  }

  /**
   * Retrieves independent history for a specific slot from Supabase PostgreSQL.
   */
  static async getHistory(slotId: "heroImage1" | "heroImage2" | "heroImage3"): Promise<HeroHistoryItem[]> {
    const current = await this.getSettings();
    let currentVersion: number;
    if (slotId === "heroImage1") {
      currentVersion = current.heroImage1Version;
    } else if (slotId === "heroImage2") {
      currentVersion = current.heroImage2Version;
    } else {
      currentVersion = current.heroImage3Version;
    }

    try {
      await this.syncLegacyData();

      const records = await prisma.heroHistory.findMany({
        where: { slotId },
        orderBy: { version: "desc" },
        take: 100,
      });

      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          slotId: r.slotId as "heroImage1" | "heroImage2" | "heroImage3",
          version: r.version,
          imageUrl: r.imageUrl,
          normalHeadline: r.normalHeadline,
          boldHeadline: r.boldHeadline,
          description: r.description ?? undefined,
          createdAt: r.createdAt.toISOString(),
          createdBy: r.createdBy || "system",
          isCurrent: r.version === currentVersion,
        }));
      }
    } catch (err) {
      logger.warn({ err, slotId }, "Failed to fetch hero history from database");
    }

    // Memory fallback
    let list: HeroHistoryItem[];
    if (slotId === "heroImage1") {
      list = memoryHero1History;
    } else if (slotId === "heroImage2") {
      list = memoryHero2History;
    } else {
      list = memoryHero3History;
    }

    if (list.length === 0) {
      const defHist = createDefaultHistory();
      list = defHist[slotId];
    }

    return list.map((item) => ({
      ...item,
      isCurrent: item.version === currentVersion,
    }));
  }

  /**
   * Updates an individual slot independently in Supabase PostgreSQL:
   * Increments that slot's version, creates an independent history record,
   * leaves sibling slots untouched, and throws honestly if database fails.
   */
  static async updateSlot(
    slotId: "heroImage1" | "heroImage2" | "heroImage3",
    input: HeroSlot1UpdateInput | HeroSlot2UpdateInput | HeroSlot3UpdateInput,
    adminUser = "admin"
  ): Promise<HeroSettings> {
    await this.syncLegacyData();
    const current = await this.getSettings();
    const now = new Date();

    let newSlotVersion: number;
    let updatedSlot: HeroImageSlot1 | HeroImageSlot2 | HeroImageSlot3;
    let historyRecordData: {
      id: string;
      slotId: string;
      version: number;
      imageUrl: string;
      normalHeadline: string;
      boldHeadline: string;
      description?: string;
      createdBy: string;
      createdAt: Date;
    };

    if (slotId === "heroImage1") {
      const slotInput = input as HeroSlot1UpdateInput;
      const s1: HeroImageSlot1 = {
        ...current.heroImage1,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage1.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage1.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage1.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage1.boldHeadline,
        description: slotInput.description !== undefined ? slotInput.description : current.heroImage1.description,
      };
      updatedSlot = s1;
      newSlotVersion = (current.heroImage1Version || 1) + 1;

      historyRecordData = {
        id: `hist_hero1_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage1",
        version: newSlotVersion,
        imageUrl: s1.imageUrl,
        normalHeadline: s1.normalHeadline,
        boldHeadline: s1.boldHeadline,
        description: s1.description,
        createdBy: adminUser,
        createdAt: now,
      };
    } else if (slotId === "heroImage2") {
      const slotInput = input as HeroSlot2UpdateInput;
      const s2: HeroImageSlot2 = {
        ...current.heroImage2,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage2.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage2.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage2.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage2.boldHeadline,
      };
      updatedSlot = s2;
      newSlotVersion = (current.heroImage2Version || 1) + 1;

      historyRecordData = {
        id: `hist_hero2_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage2",
        version: newSlotVersion,
        imageUrl: s2.imageUrl,
        normalHeadline: s2.normalHeadline,
        boldHeadline: s2.boldHeadline,
        createdBy: adminUser,
        createdAt: now,
      };
    } else if (slotId === "heroImage3") {
      const slotInput = input as HeroSlot3UpdateInput;
      const s3: HeroImageSlot3 = {
        ...current.heroImage3,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage3.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage3.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage3.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage3.boldHeadline,
      };
      updatedSlot = s3;
      newSlotVersion = (current.heroImage3Version || 1) + 1;

      historyRecordData = {
        id: `hist_hero3_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage3",
        version: newSlotVersion,
        imageUrl: s3.imageUrl,
        normalHeadline: s3.normalHeadline,
        boldHeadline: s3.boldHeadline,
        createdBy: adminUser,
        createdAt: now,
      };
    } else {
      throw new Error(`Invalid slot identifier: ${slotId}`);
    }

    const newOverallVersion = current.version + 1;

    // Authoritative atomic database write
    const updatePayload: Record<string, unknown> = {
      version: newOverallVersion,
      updatedBy: adminUser,
    };
    if (slotId === "heroImage1") {
      updatePayload["heroImage1"] = updatedSlot as unknown as object;
      updatePayload["heroImage1Version"] = newSlotVersion;
    } else if (slotId === "heroImage2") {
      updatePayload["heroImage2"] = updatedSlot as unknown as object;
      updatePayload["heroImage2Version"] = newSlotVersion;
    } else {
      updatePayload["heroImage3"] = updatedSlot as unknown as object;
      updatePayload["heroImage3Version"] = newSlotVersion;
    }

    // Must NOT silently suppress database errors!
    const [savedRecord] = await prisma.$transaction([
      prisma.heroSetting.upsert({
        where: { id: "current" },
        create: {
          id: "current",
          heroImage1: (slotId === "heroImage1" ? updatedSlot : current.heroImage1) as unknown as object,
          heroImage2: (slotId === "heroImage2" ? updatedSlot : current.heroImage2) as unknown as object,
          heroImage3: (slotId === "heroImage3" ? updatedSlot : current.heroImage3) as unknown as object,
          heroImage1Version: slotId === "heroImage1" ? newSlotVersion : current.heroImage1Version,
          heroImage2Version: slotId === "heroImage2" ? newSlotVersion : current.heroImage2Version,
          heroImage3Version: slotId === "heroImage3" ? newSlotVersion : current.heroImage3Version,
          version: newOverallVersion,
          updatedBy: adminUser,
        },
        update: updatePayload,
      }),
      prisma.heroHistory.create({
        data: historyRecordData,
      }),
    ]);

    const result: HeroSettings = {
      id: savedRecord.id,
      heroImage1: savedRecord.heroImage1 as unknown as HeroImageSlot1,
      heroImage2: savedRecord.heroImage2 as unknown as HeroImageSlot2,
      heroImage3: savedRecord.heroImage3 as unknown as HeroImageSlot3,
      version: savedRecord.version,
      heroImage1Version: savedRecord.heroImage1Version,
      heroImage2Version: savedRecord.heroImage2Version,
      heroImage3Version: savedRecord.heroImage3Version,
      updatedAt: savedRecord.updatedAt.toISOString(),
      updatedBy: savedRecord.updatedBy || adminUser,
    };

    memoryHeroSettings = result;
    await this.syncToFileBackup(result);
    logger.info({ slotId, version: result.version, adminUser }, "Hero slot updated and persisted to PostgreSQL");
    return result;
  }

  /**
   * Updates multiple hero slots at once while preserving slots that are not included.
   */
  static async updateSettings(
    input: HeroSettingsUpdateInput,
    adminUser = "admin"
  ): Promise<HeroSettings> {
    if (input.heroImage1) {
      await this.updateSlot("heroImage1", input.heroImage1, adminUser);
    }
    if (input.heroImage2) {
      await this.updateSlot("heroImage2", input.heroImage2, adminUser);
    }
    if (input.heroImage3) {
      await this.updateSlot("heroImage3", input.heroImage3, adminUser);
    }
    return this.getSettings();
  }

  /**
   * Restores a historic snapshot of an individual hero image slot:
   * 1. Confirms target record exists in that slot's history.
   * 2. Takes a backup snapshot of current live slot before restoring.
   * 3. Restores image and text from historic snapshot.
   * 4. Increments that slot's independent version counter.
   * 5. Creates a newly published history record.
   * 6. Leaves the other two slots completely unchanged!
   * 7. Must throw on DB failure (no false success).
   */
  static async restoreSlot(
    slotId: "heroImage1" | "heroImage2" | "heroImage3",
    targetVersion: number,
    adminUser = "admin"
  ): Promise<HeroSettings> {
    await this.syncLegacyData();

    // 1. Locate the target history item in PostgreSQL
    const targetRecord = await prisma.heroHistory.findFirst({
      where: { slotId, version: targetVersion },
    });

    if (!targetRecord) {
      throw new Error(`History version ${targetVersion} not found for ${slotId}`);
    }

    const current = await this.getSettings();
    const now = new Date();

    let preRestoreSlotVersion: number;
    let restoredSlotVersion: number;
    let preRecordData: {
      id: string;
      slotId: string;
      version: number;
      imageUrl: string;
      normalHeadline: string;
      boldHeadline: string;
      description?: string;
      createdBy: string;
      createdAt: Date;
    };
    let postRecordData: {
      id: string;
      slotId: string;
      version: number;
      imageUrl: string;
      normalHeadline: string;
      boldHeadline: string;
      description?: string;
      createdBy: string;
      createdAt: Date;
    };
    let restoredSlot: HeroImageSlot1 | HeroImageSlot2 | HeroImageSlot3;

    if (slotId === "heroImage1") {
      preRestoreSlotVersion = (current.heroImage1Version || 1) + 1;
      restoredSlotVersion = preRestoreSlotVersion + 1;

      preRecordData = {
        id: `hist_hero1_${Date.now()}_pre_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage1",
        version: preRestoreSlotVersion,
        imageUrl: current.heroImage1.imageUrl,
        normalHeadline: current.heroImage1.normalHeadline,
        boldHeadline: current.heroImage1.boldHeadline,
        description: current.heroImage1.description,
        createdAt: now,
        createdBy: adminUser,
      };

      const s1: HeroImageSlot1 = {
        ...current.heroImage1,
        imageUrl: targetRecord.imageUrl,
        normalHeadline: targetRecord.normalHeadline,
        boldHeadline: targetRecord.boldHeadline,
        description: targetRecord.description || current.heroImage1.description,
      };
      restoredSlot = s1;

      postRecordData = {
        id: `hist_hero1_${Date.now()}_restored_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage1",
        version: restoredSlotVersion,
        imageUrl: s1.imageUrl,
        normalHeadline: s1.normalHeadline,
        boldHeadline: s1.boldHeadline,
        description: s1.description,
        createdAt: now,
        createdBy: adminUser,
      };
    } else if (slotId === "heroImage2") {
      preRestoreSlotVersion = (current.heroImage2Version || 1) + 1;
      restoredSlotVersion = preRestoreSlotVersion + 1;

      preRecordData = {
        id: `hist_hero2_${Date.now()}_pre_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage2",
        version: preRestoreSlotVersion,
        imageUrl: current.heroImage2.imageUrl,
        normalHeadline: current.heroImage2.normalHeadline,
        boldHeadline: current.heroImage2.boldHeadline,
        createdAt: now,
        createdBy: adminUser,
      };

      const s2: HeroImageSlot2 = {
        ...current.heroImage2,
        imageUrl: targetRecord.imageUrl,
        normalHeadline: targetRecord.normalHeadline,
        boldHeadline: targetRecord.boldHeadline,
      };
      restoredSlot = s2;

      postRecordData = {
        id: `hist_hero2_${Date.now()}_restored_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage2",
        version: restoredSlotVersion,
        imageUrl: s2.imageUrl,
        normalHeadline: s2.normalHeadline,
        boldHeadline: s2.boldHeadline,
        createdAt: now,
        createdBy: adminUser,
      };
    } else if (slotId === "heroImage3") {
      preRestoreSlotVersion = (current.heroImage3Version || 1) + 1;
      restoredSlotVersion = preRestoreSlotVersion + 1;

      preRecordData = {
        id: `hist_hero3_${Date.now()}_pre_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage3",
        version: preRestoreSlotVersion,
        imageUrl: current.heroImage3.imageUrl,
        normalHeadline: current.heroImage3.normalHeadline,
        boldHeadline: current.heroImage3.boldHeadline,
        createdAt: now,
        createdBy: adminUser,
      };

      const s3: HeroImageSlot3 = {
        ...current.heroImage3,
        imageUrl: targetRecord.imageUrl,
        normalHeadline: targetRecord.normalHeadline,
        boldHeadline: targetRecord.boldHeadline,
      };
      restoredSlot = s3;

      postRecordData = {
        id: `hist_hero3_${Date.now()}_restored_${crypto.randomBytes(3).toString("hex")}`,
        slotId: "heroImage3",
        version: restoredSlotVersion,
        imageUrl: s3.imageUrl,
        normalHeadline: s3.normalHeadline,
        boldHeadline: s3.boldHeadline,
        createdAt: now,
        createdBy: adminUser,
      };
    } else {
      throw new Error(`Invalid slot identifier: ${slotId}`);
    }

    const newOverallVersion = current.version + 1;
    const updatePayload: Record<string, unknown> = {
      version: newOverallVersion,
      updatedBy: adminUser,
    };
    if (slotId === "heroImage1") {
      updatePayload["heroImage1"] = restoredSlot as unknown as object;
      updatePayload["heroImage1Version"] = restoredSlotVersion;
    } else if (slotId === "heroImage2") {
      updatePayload["heroImage2"] = restoredSlot as unknown as object;
      updatePayload["heroImage2Version"] = restoredSlotVersion;
    } else {
      updatePayload["heroImage3"] = restoredSlot as unknown as object;
      updatePayload["heroImage3Version"] = restoredSlotVersion;
    }

    // Atomic transaction for pre-snapshot, post-snapshot, and settings update
    const [savedRecord] = await prisma.$transaction([
      prisma.heroSetting.upsert({
        where: { id: "current" },
        create: {
          id: "current",
          heroImage1: (slotId === "heroImage1" ? restoredSlot : current.heroImage1) as unknown as object,
          heroImage2: (slotId === "heroImage2" ? restoredSlot : current.heroImage2) as unknown as object,
          heroImage3: (slotId === "heroImage3" ? restoredSlot : current.heroImage3) as unknown as object,
          heroImage1Version: slotId === "heroImage1" ? restoredSlotVersion : current.heroImage1Version,
          heroImage2Version: slotId === "heroImage2" ? restoredSlotVersion : current.heroImage2Version,
          heroImage3Version: slotId === "heroImage3" ? restoredSlotVersion : current.heroImage3Version,
          version: newOverallVersion,
          updatedBy: adminUser,
        },
        update: updatePayload,
      }),
      prisma.heroHistory.create({ data: preRecordData }),
      prisma.heroHistory.create({ data: postRecordData }),
    ]);

    const result: HeroSettings = {
      id: savedRecord.id,
      heroImage1: savedRecord.heroImage1 as unknown as HeroImageSlot1,
      heroImage2: savedRecord.heroImage2 as unknown as HeroImageSlot2,
      heroImage3: savedRecord.heroImage3 as unknown as HeroImageSlot3,
      version: savedRecord.version,
      heroImage1Version: savedRecord.heroImage1Version,
      heroImage2Version: savedRecord.heroImage2Version,
      heroImage3Version: savedRecord.heroImage3Version,
      updatedAt: savedRecord.updatedAt.toISOString(),
      updatedBy: savedRecord.updatedBy || adminUser,
    };

    memoryHeroSettings = result;
    await this.syncToFileBackup(result);
    logger.info({ slotId, targetVersion, restoredToVersion: result.version }, "Hero slot version restored successfully in PostgreSQL");
    return result;
  }
}
