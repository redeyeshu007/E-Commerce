import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "instagram");
const FRONTEND_INSTA_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "images", "instagram");

export class InstagramMediaService {
  /**
   * Saves or updates an Instagram media asset in MongoDB.
   */
  static async saveAsset(filename: string, mimeType: string, buffer: Buffer): Promise<void> {
    await prisma.instagramMediaAsset.upsert({
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
    logger.info({ filename, size: buffer.length, mimeType }, "Instagram media asset saved to MongoDB");
  }

  /**
   * Retrieves an Instagram media asset binary and MIME type from MongoDB.
   */
  static async getAsset(filename: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const record = await prisma.instagramMediaAsset.findUnique({
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
   * Synchronizes disk image assets into MongoDB if they are not yet in the DB.
   */
  static async syncDiskToDatabase(): Promise<void> {
    const dirsToCheck = [UPLOADS_DIR, FRONTEND_INSTA_DIR];

    for (const dir of dirsToCheck) {
      try {
        if (!fs.existsSync(dir)) {
          continue;
        }
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith(".") || file === ".gitkeep") {
            continue;
          }
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) continue;

          const existing = await prisma.instagramMediaAsset.findUnique({
            where: { filename: file },
            select: { id: true },
          });

          if (!existing) {
            const ext = path.extname(file).toLowerCase();
            let mimeType = "image/jpeg";
            if (ext === ".png") mimeType = "image/png";
            if (ext === ".webp") mimeType = "image/webp";
            if (ext === ".gif") mimeType = "image/gif";

            const data = fs.readFileSync(fullPath);
            await this.saveAsset(file, mimeType, data);
          }
        }
      } catch (err) {
        logger.warn({ err, dir }, "Instagram media asset disk-to-DB sync warning");
      }
    }
  }
}
