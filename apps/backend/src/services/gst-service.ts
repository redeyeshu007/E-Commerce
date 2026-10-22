import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface GstSettingDto {
  percentage: number;
  isInclusive: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

const DEFAULT_GST_SETTING: GstSettingDto = {
  percentage: 3.0, // Standard GST for gold and fine jewellery in India
  isInclusive: true, // Display prices are retail GST-inclusive
  updatedAt: new Date(),
  updatedBy: "system",
};

export class GstService {
  private static readonly SETTING_ID = "default";

  /**
   * Retrieves active global GST setting from MongoDB.
   * Initializes default 3% inclusive setting if not present.
   */
  static async getSetting(): Promise<GstSettingDto> {
    try {
      const setting = await prisma.gstSetting.findUnique({
        where: { id: this.SETTING_ID },
      });

      if (!setting) {
        return this.initializeDefaultSetting();
      }

      return {
        percentage: setting.percentage,
        isInclusive: setting.isInclusive,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    } catch (error) {
      logger.warn({ error }, "Failed to fetch GST setting, returning default baseline");
      return DEFAULT_GST_SETTING;
    }
  }

  /**
   * Updates global GST setting in MongoDB with strict bounds validation.
   */
  static async updateSetting(
    percentage: number,
    isInclusive: boolean = true,
    adminIdentifier: string = "admin"
  ): Promise<GstSettingDto> {
    if (typeof percentage !== "number" || isNaN(percentage)) {
      throw Object.assign(new Error("GST percentage must be a valid number"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    if (percentage < 0) {
      throw Object.assign(new Error("GST percentage cannot be negative"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    if (percentage > 40) {
      throw Object.assign(new Error("GST percentage cannot exceed maximum allowed rate of 40%"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    const updated = await prisma.gstSetting.upsert({
      where: { id: this.SETTING_ID },
      create: {
        id: this.SETTING_ID,
        percentage,
        isInclusive,
        updatedBy: adminIdentifier,
      },
      update: {
        percentage,
        isInclusive,
        updatedBy: adminIdentifier,
      },
    });

    logger.info(
      { percentage, isInclusive, updatedBy: adminIdentifier },
      "Global GST setting updated successfully in MongoDB"
    );

    return {
      percentage: updated.percentage,
      isInclusive: updated.isInclusive,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };
  }

  /**
   * Calculates GST and base amount given total and percentage.
   * For GST-inclusive: Tax = Total - (Total / (1 + Rate / 100))
   * For GST-exclusive: Tax = Total * (Rate / 100)
   */
  static calculateTax(
    totalAmountInr: number,
    ratePercentage: number = 3.0,
    isInclusive: boolean = true
  ): { taxInr: number; baseInr: number } {
    if (totalAmountInr <= 0 || ratePercentage <= 0) {
      return { taxInr: 0, baseInr: totalAmountInr };
    }

    if (isInclusive) {
      const baseInr = Math.round((totalAmountInr / (1 + ratePercentage / 100)) * 100) / 100;
      const taxInr = Math.round((totalAmountInr - baseInr) * 100) / 100;
      return { taxInr, baseInr };
    } else {
      const taxInr = Math.round(totalAmountInr * (ratePercentage / 100) * 100) / 100;
      const baseInr = totalAmountInr;
      return { taxInr, baseInr };
    }
  }

  private static async initializeDefaultSetting(): Promise<GstSettingDto> {
    try {
      const created = await prisma.gstSetting.create({
        data: {
          id: this.SETTING_ID,
          percentage: DEFAULT_GST_SETTING.percentage,
          isInclusive: DEFAULT_GST_SETTING.isInclusive,
          updatedBy: DEFAULT_GST_SETTING.updatedBy,
        },
      });

      return {
        percentage: created.percentage,
        isInclusive: created.isInclusive,
        updatedAt: created.updatedAt,
        updatedBy: created.updatedBy,
      };
    } catch {
      return DEFAULT_GST_SETTING;
    }
  }
}
