import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "products");

export class ProductMediaService {
  /**
   * Saves or updates a product media asset in MongoDB.
   */
  static async saveAsset(filename: string, mimeType: string, buffer: Buffer): Promise<void> {
    await prisma.productMediaAsset.upsert({
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
    logger.info({ filename, size: buffer.length, mimeType }, "Product media asset saved to MongoDB");
  }

  /**
   * Retrieves a product media asset binary and MIME type from MongoDB.
   */
  static async getAsset(filename: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const record = await prisma.productMediaAsset.findUnique({
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
   * Deletes a product media asset from MongoDB.
   */
  static async deleteAsset(filename: string): Promise<void> {
    try {
      await prisma.productMediaAsset.delete({
        where: { filename },
      });
      logger.info({ filename }, "Deleted product media asset from MongoDB");
    } catch {
      // Ignore if record already absent
    }
  }

  /**
   * Seeds existing disk images from uploads/products into MongoDB if not present.
   */
  static async syncLocalDiskImagesToDb(): Promise<void> {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        return;
      }
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(UPLOADS_DIR, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const existing = await prisma.productMediaAsset.findUnique({
          where: { filename: file },
        });
        if (!existing) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          await this.saveAsset(file, mimeType, buffer);
          logger.info({ file }, "Synced local disk product image to MongoDB");
        }
      }
    } catch (err) {
      logger.warn({ err }, "Could not sync local disk product images to MongoDB");
    }
  }
}
