import fs from "node:fs";
import path from "node:path";
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
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

// Data persistence file path
const DATA_DIR = path.resolve(process.cwd(), "data");
const SETTINGS_FILE_PATH = path.join(DATA_DIR, "hero-settings.json");

let memoryHeroSettings: HeroSettings = { ...defaultHeroSettings };

/**
 * Loads hero settings from disk file if available, or initializes with defaults.
 */
function initializeSettings(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && parsed.heroImage1 && parsed.heroImage2 && parsed.heroImage3) {
        memoryHeroSettings = parsed;
        logger.info("Hero settings loaded successfully from disk persistence");
        return;
      }
    }

    // Write defaults if not existing or invalid
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(defaultHeroSettings, null, 2), "utf-8");
    memoryHeroSettings = { ...defaultHeroSettings };
    logger.info("Hero settings initialized with default configuration");
  } catch (err) {
    logger.warn({ err }, "Failed to read/write hero-settings.json; using in-memory state");
  }
}

// Initialize on module load
initializeSettings();

/**
 * Persists current settings to disk.
 */
function persistSettings(settings: HeroSettings): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${SETTINGS_FILE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2), "utf-8");
    fs.renameSync(tempPath, SETTINGS_FILE_PATH);
  } catch (err) {
    logger.error({ err }, "Failed to persist hero settings to disk");
  }
}

export class HeroService {
  /**
   * Resets settings back to baseline defaults (useful in tests).
   */
  static resetToDefault(): void {
    memoryHeroSettings = {
      ...defaultHeroSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };
    persistSettings(memoryHeroSettings);
  }

  /**
   * Retrieves the current published Hero Settings.
   */
  static async getSettings(): Promise<HeroSettings> {
    return { ...memoryHeroSettings };
  }

  /**
   * Updates an individual slot independently without touching the other two slots.
   */
  static async updateSlot(
    slotId: "heroImage1" | "heroImage2" | "heroImage3",
    input: HeroSlot1UpdateInput | HeroSlot2UpdateInput | HeroSlot3UpdateInput,
    adminUser = "admin"
  ): Promise<HeroSettings> {
    const current = { ...memoryHeroSettings };
    const now = new Date().toISOString();

    if (slotId === "heroImage1") {
      const slotInput = input as HeroSlot1UpdateInput;
      current.heroImage1 = {
        ...current.heroImage1,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage1.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage1.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage1.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage1.boldHeadline,
        description: slotInput.description !== undefined ? slotInput.description : current.heroImage1.description,
      };
    } else if (slotId === "heroImage2") {
      const slotInput = input as HeroSlot2UpdateInput;
      current.heroImage2 = {
        ...current.heroImage2,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage2.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage2.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage2.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage2.boldHeadline,
      };
    } else if (slotId === "heroImage3") {
      const slotInput = input as HeroSlot3UpdateInput;
      current.heroImage3 = {
        ...current.heroImage3,
        imageUrl: slotInput.imageUrl !== undefined ? slotInput.imageUrl : current.heroImage3.imageUrl,
        imageAlt: slotInput.imageAlt !== undefined ? slotInput.imageAlt : current.heroImage3.imageAlt,
        normalHeadline: slotInput.normalHeadline !== undefined ? slotInput.normalHeadline : current.heroImage3.normalHeadline,
        boldHeadline: slotInput.boldHeadline !== undefined ? slotInput.boldHeadline : current.heroImage3.boldHeadline,
      };
    } else {
      throw new Error(`Invalid slot identifier: ${slotId}`);
    }

    current.version += 1;
    current.updatedAt = now;
    current.updatedBy = adminUser;

    memoryHeroSettings = current;
    persistSettings(current);

    logger.info({ slotId, version: current.version, adminUser }, "Hero slot updated and persisted");
    return { ...memoryHeroSettings };
  }

  /**
   * Updates multiple hero slots at once while preserving slots that are not included in the payload.
   */
  static async updateSettings(
    input: HeroSettingsUpdateInput,
    adminUser = "admin"
  ): Promise<HeroSettings> {
    const current = { ...memoryHeroSettings };
    const now = new Date().toISOString();
    let hasChanges = false;

    if (input.heroImage1) {
      current.heroImage1 = {
        ...current.heroImage1,
        imageUrl: input.heroImage1.imageUrl !== undefined ? input.heroImage1.imageUrl : current.heroImage1.imageUrl,
        imageAlt: input.heroImage1.imageAlt !== undefined ? input.heroImage1.imageAlt : current.heroImage1.imageAlt,
        normalHeadline: input.heroImage1.normalHeadline !== undefined ? input.heroImage1.normalHeadline : current.heroImage1.normalHeadline,
        boldHeadline: input.heroImage1.boldHeadline !== undefined ? input.heroImage1.boldHeadline : current.heroImage1.boldHeadline,
        description: input.heroImage1.description !== undefined ? input.heroImage1.description : current.heroImage1.description,
      };
      hasChanges = true;
    }

    if (input.heroImage2) {
      current.heroImage2 = {
        ...current.heroImage2,
        imageUrl: input.heroImage2.imageUrl !== undefined ? input.heroImage2.imageUrl : current.heroImage2.imageUrl,
        imageAlt: input.heroImage2.imageAlt !== undefined ? input.heroImage2.imageAlt : current.heroImage2.imageAlt,
        normalHeadline: input.heroImage2.normalHeadline !== undefined ? input.heroImage2.normalHeadline : current.heroImage2.normalHeadline,
        boldHeadline: input.heroImage2.boldHeadline !== undefined ? input.heroImage2.boldHeadline : current.heroImage2.boldHeadline,
      };
      hasChanges = true;
    }

    if (input.heroImage3) {
      current.heroImage3 = {
        ...current.heroImage3,
        imageUrl: input.heroImage3.imageUrl !== undefined ? input.heroImage3.imageUrl : current.heroImage3.imageUrl,
        imageAlt: input.heroImage3.imageAlt !== undefined ? input.heroImage3.imageAlt : current.heroImage3.imageAlt,
        normalHeadline: input.heroImage3.normalHeadline !== undefined ? input.heroImage3.normalHeadline : current.heroImage3.normalHeadline,
        boldHeadline: input.heroImage3.boldHeadline !== undefined ? input.heroImage3.boldHeadline : current.heroImage3.boldHeadline,
      };
      hasChanges = true;
    }

    if (hasChanges) {
      current.version += 1;
      current.updatedAt = now;
      current.updatedBy = adminUser;

      memoryHeroSettings = current;
      persistSettings(current);
      logger.info({ version: current.version, adminUser }, "Hero settings updated and persisted");
    }

    return { ...memoryHeroSettings };
  }
}
