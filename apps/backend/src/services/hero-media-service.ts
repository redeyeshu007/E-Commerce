import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "hero");

export class HeroMediaService {
  /**
   * Saves or updates a media asset in MongoDB.
   */
  static async saveAsset(filename: string, mimeType: string, buffer: Buffer): Promise<void> {
    await prisma.heroMediaAsset.upsert({
      where: { filename },
      create: {
        id: filename,
        filename,
        mimeType,
        size: buffer.length,
        data: buffer as any,
      },
      update: {
        mimeType,
        size: buffer.length,
        data: buffer as any,
      },
    });
    logger.info({ filename, size: buffer.length, mimeType }, "Media asset saved to MongoDB");
  }

  /**
   * Retrieves a media asset binary and MIME type from MongoDB.
   */
  static async getAsset(filename: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const record = await prisma.heroMediaAsset.findUnique({
      where: { filename },
    });
    if (!record) {
      return null;
    }
    return {
      data: Buffer.from(record.data),
      mimeType: record.mimeType,
    };
  }

  /**
   * Synchronizes any existing files on disk into MongoDB if they are missing from the DB.
   */
  static async syncDiskToDatabase(): Promise<void> {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        return;
      }
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        if (file.startsWith(".") || file === ".gitkeep") {
          continue;
        }
        const fullPath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) {
          continue;
        }

        const existing = await prisma.heroMediaAsset.findUnique({
          where: { filename: file },
          select: { id: true },
        });

        if (!existing) {
          const buffer = fs.readFileSync(fullPath);
          const ext = path.extname(file).toLowerCase();
          const mimeType =
            ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

          await prisma.heroMediaAsset.create({
            data: {
              id: file,
              filename: file,
              mimeType,
              size: buffer.length,
              data: buffer,
            },
          });
          logger.info({ file }, "Synced local disk media asset to MongoDB");
        }
      }
    } catch (err) {
      logger.warn({ err }, "Could not sync local disk media assets to MongoDB");
    }
  }
}
