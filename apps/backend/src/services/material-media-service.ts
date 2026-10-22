import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "materials");

export class MaterialMediaService {
  /**
   * Saves or updates a material media asset in MongoDB.
   */
  static async saveAsset(filename: string, mimeType: string, buffer: Buffer): Promise<void> {
    await prisma.materialMediaAsset.upsert({
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
    logger.info({ filename, size: buffer.length, mimeType }, "Material media asset saved to MongoDB");
  }

  /**
   * Retrieves a material media asset binary and MIME type from MongoDB.
   */
  static async getAsset(filename: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const record = await prisma.materialMediaAsset.findUnique({
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
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        const existing = await prisma.materialMediaAsset.findUnique({
          where: { filename: file },
          select: { id: true },
        });

        if (!existing) {
          const ext = path.extname(file).toLowerCase();
          let mimeType = "image/jpeg";
          if (ext === ".png") mimeType = "image/png";
          if (ext === ".webp") mimeType = "image/webp";

          const data = fs.readFileSync(fullPath);
          await this.saveAsset(file, mimeType, data);
        }
      }
    } catch (err) {
      logger.warn({ err }, "Material media asset disk-to-DB sync warning");
    }
  }
}
