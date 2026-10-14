import crypto from "node:crypto";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export interface TopBarSettings {
  text: string;
  backgroundColor: string;
  textColor: string;
  visible: boolean;
  dismissible: boolean;
}

export interface TopBarUpdateInput {
  text?: string | undefined;
  backgroundColor?: string | undefined;
  textColor?: string | undefined;
  visible?: boolean | undefined;
  dismissible?: boolean | undefined;
}

export interface SecondNavbarLink {
  id: string;
  label: string;
  href: string;
  isImplemented: boolean;
}

export interface SecondNavbarSettings {
  phone: string;
  phoneHref: string;
  promoText: string;
  ctaText: string;
  ctaHref: string;
  links: SecondNavbarLink[];
  showPhone: boolean;
  showPromotion: boolean;
  showLinks: boolean;
}

export interface SecondNavbarUpdateInput {
  phone?: string | undefined;
  phoneHref?: string | undefined;
  promoText?: string | undefined;
  ctaText?: string | undefined;
  ctaHref?: string | undefined;
  links?: SecondNavbarLink[] | undefined;
  showPhone?: boolean | undefined;
  showPromotion?: boolean | undefined;
  showLinks?: boolean | undefined;
}

export interface NavbarSettings {
  id: string;
  topBar: TopBarSettings;
  secondNavbar: SecondNavbarSettings;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface NavbarHistoryRecord {
  id: string;
  section: "top_bar" | "second_navbar" | "full";
  snapshot: NavbarSettings;
  description: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export const defaultTopBarSettings: TopBarSettings = {
  text: "SUMMER SALE, Get 40% Off for all products.",
  backgroundColor: "#FBC0CE",
  textColor: "#222222",
  visible: true,
  dismissible: true,
};

export const defaultSecondNavbarSettings: SecondNavbarSettings = {
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  promoText: "Summer Sale 15% off!",
  ctaText: "Shop Now!",
  ctaHref: "/shop",
  links: [
    {
      id: "find-store",
      label: "Find a Store",
      href: "/#store-locator",
      isImplemented: true,
    },
    {
      id: "faqs",
      label: "FAQs",
      href: "/#faqs",
      isImplemented: false,
    },
    {
      id: "subscribe",
      label: "Subscribe",
      href: "/#newsletter-section",
      isImplemented: true,
    },
  ],
  showPhone: true,
  showPromotion: true,
  showLinks: true,
};

export function getDefaultNavbarSettings(): NavbarSettings {
  return {
    id: "current",
    topBar: { ...defaultTopBarSettings },
    secondNavbar: {
      ...defaultSecondNavbarSettings,
      links: defaultSecondNavbarSettings.links.map((l) => ({ ...l })),
    },
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
  };
}

// Global in-memory storage fallback for offline / disconnected DB state
let memorySettings: NavbarSettings = getDefaultNavbarSettings();
let memoryHistory: NavbarHistoryRecord[] = [
  {
    id: "hist_init_default",
    section: "full",
    snapshot: getDefaultNavbarSettings(),
    description: "Initial baseline published configuration",
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
];

let dbCooldownUntil = 0;

async function tryPrisma<T>(fn: () => Promise<T>): Promise<T | null> {
  if (Date.now() < dbCooldownUntil) {
    return null;
  }
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database operation timed out")), 1000)
      ),
    ]);
    return result;
  } catch (err) {
    dbCooldownUntil = Date.now() + 15000;
    logger.warn({ err }, "Database query failed or timed out; activated fallback cooldown");
    return null;
  }
}

export class NavbarService {
  /**
   * Resets cooldown (useful in tests if needed)
   */
  static resetCooldown(): void {
    dbCooldownUntil = 0;
  }

  /**
   * Retrieves the current active Navbar settings.
   */
  static async getSettings(): Promise<NavbarSettings> {
    const record = await tryPrisma(() =>
      prisma.navbarSetting.findUnique({
        where: { id: "current" },
      })
    );

    if (record) {
      const parsedLinks: SecondNavbarLink[] = Array.isArray(record.secondLinks)
        ? (record.secondLinks as unknown as SecondNavbarLink[])
        : defaultSecondNavbarSettings.links;

      return {
        id: record.id,
        topBar: {
          text: record.topBarText,
          backgroundColor: record.topBarBgColor,
          textColor: record.topBarTextColor,
          visible: record.topBarVisible,
          dismissible: record.topBarDismissible,
        },
        secondNavbar: {
          phone: record.secondPhone,
          phoneHref: record.secondPhoneHref,
          promoText: record.secondPromoText,
          ctaText: record.secondCtaText,
          ctaHref: record.secondCtaHref,
          links: parsedLinks,
          showPhone: record.secondPhoneVisible,
          showPromotion: record.secondPromoVisible,
          showLinks: record.secondLinksVisible,
        },
        version: record.version,
        updatedAt: record.updatedAt.toISOString(),
        updatedBy: record.updatedBy || "admin",
      };
    }

    return memorySettings;
  }

  /**
   * Updates Top Bar settings, snapshots the previous version to history, and publishes the new version.
   */
  static async updateTopBar(
    updates: TopBarUpdateInput,
    adminEmail = "admin@peralagae.com",
    customDescription?: string
  ): Promise<NavbarSettings> {
    const current = await this.getSettings();

    // Snapshot current version before applying changes
    const snapshotToSave: NavbarSettings = JSON.parse(JSON.stringify(current));
    await this.saveHistorySnapshot(
      "top_bar",
      snapshotToSave,
      customDescription || `Updated announcement text: "${updates.text?.slice(0, 40) || current.topBar.text.slice(0, 40)}..."`,
      adminEmail
    );

    const newVersion = current.version + 1;
    const newTopBar: TopBarSettings = {
      ...current.topBar,
      text: updates.text !== undefined ? updates.text.trim() : current.topBar.text,
      backgroundColor: updates.backgroundColor !== undefined ? updates.backgroundColor : current.topBar.backgroundColor,
      textColor: updates.textColor !== undefined ? updates.textColor : current.topBar.textColor,
      visible: updates.visible !== undefined ? updates.visible : current.topBar.visible,
      dismissible: updates.dismissible !== undefined ? updates.dismissible : current.topBar.dismissible,
    };

    const newSettings: NavbarSettings = {
      ...current,
      topBar: newTopBar,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    await tryPrisma(() =>
      prisma.navbarSetting.upsert({
        where: { id: "current" },
        create: {
          id: "current",
          topBarText: newTopBar.text,
          topBarBgColor: newTopBar.backgroundColor,
          topBarTextColor: newTopBar.textColor,
          topBarVisible: newTopBar.visible,
          topBarDismissible: newTopBar.dismissible,
          secondPhone: current.secondNavbar.phone,
          secondPhoneHref: current.secondNavbar.phoneHref,
          secondPromoText: current.secondNavbar.promoText,
          secondCtaText: current.secondNavbar.ctaText,
          secondCtaHref: current.secondNavbar.ctaHref,
          secondLinks: current.secondNavbar.links as unknown as object,
          secondPhoneVisible: current.secondNavbar.showPhone,
          secondPromoVisible: current.secondNavbar.showPromotion,
          secondLinksVisible: current.secondNavbar.showLinks,
          version: newVersion,
          updatedBy: adminEmail,
        },
        update: {
          topBarText: newTopBar.text,
          topBarBgColor: newTopBar.backgroundColor,
          topBarTextColor: newTopBar.textColor,
          topBarVisible: newTopBar.visible,
          topBarDismissible: newTopBar.dismissible,
          version: newVersion,
          updatedBy: adminEmail,
        },
      })
    );

    memorySettings = newSettings;
    return newSettings;
  }

  /**
   * Updates Second Navbar settings, snapshots the previous version to history, and publishes the new version.
   */
  static async updateSecondNavbar(
    updates: SecondNavbarUpdateInput,
    adminEmail = "admin@peralagae.com",
    customDescription?: string
  ): Promise<NavbarSettings> {
    const current = await this.getSettings();

    // Snapshot current version before applying changes
    const snapshotToSave: NavbarSettings = JSON.parse(JSON.stringify(current));
    await this.saveHistorySnapshot(
      "second_navbar",
      snapshotToSave,
      customDescription || `Updated second navbar: promo "${updates.promoText?.slice(0, 30) || current.secondNavbar.promoText.slice(0, 30)}..."`,
      adminEmail
    );

    const newVersion = current.version + 1;
    const newSecondNavbar: SecondNavbarSettings = {
      ...current.secondNavbar,
      phone: updates.phone !== undefined ? updates.phone.trim() : current.secondNavbar.phone,
      phoneHref: updates.phoneHref !== undefined ? updates.phoneHref.trim() : current.secondNavbar.phoneHref,
      promoText: updates.promoText !== undefined ? updates.promoText.trim() : current.secondNavbar.promoText,
      ctaText: updates.ctaText !== undefined ? updates.ctaText.trim() : current.secondNavbar.ctaText,
      ctaHref: updates.ctaHref !== undefined ? updates.ctaHref.trim() : current.secondNavbar.ctaHref,
      links: updates.links ? updates.links.map((l) => ({ ...l, label: l.label.trim(), href: l.href.trim() })) : current.secondNavbar.links,
      showPhone: updates.showPhone !== undefined ? updates.showPhone : current.secondNavbar.showPhone,
      showPromotion: updates.showPromotion !== undefined ? updates.showPromotion : current.secondNavbar.showPromotion,
      showLinks: updates.showLinks !== undefined ? updates.showLinks : current.secondNavbar.showLinks,
    };

    const newSettings: NavbarSettings = {
      ...current,
      secondNavbar: newSecondNavbar,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    await tryPrisma(() =>
      prisma.navbarSetting.upsert({
        where: { id: "current" },
        create: {
          id: "current",
          topBarText: current.topBar.text,
          topBarBgColor: current.topBar.backgroundColor,
          topBarTextColor: current.topBar.textColor,
          topBarVisible: current.topBar.visible,
          topBarDismissible: current.topBar.dismissible,
          secondPhone: newSecondNavbar.phone,
          secondPhoneHref: newSecondNavbar.phoneHref,
          secondPromoText: newSecondNavbar.promoText,
          secondCtaText: newSecondNavbar.ctaText,
          secondCtaHref: newSecondNavbar.ctaHref,
          secondLinks: newSecondNavbar.links as unknown as object,
          secondPhoneVisible: newSecondNavbar.showPhone,
          secondPromoVisible: newSecondNavbar.showPromotion,
          secondLinksVisible: newSecondNavbar.showLinks,
          version: newVersion,
          updatedBy: adminEmail,
        },
        update: {
          secondPhone: newSecondNavbar.phone,
          secondPhoneHref: newSecondNavbar.phoneHref,
          secondPromoText: newSecondNavbar.promoText,
          secondCtaText: newSecondNavbar.ctaText,
          secondCtaHref: newSecondNavbar.ctaHref,
          secondLinks: newSecondNavbar.links as unknown as object,
          secondPhoneVisible: newSecondNavbar.showPhone,
          secondPromoVisible: newSecondNavbar.showPromotion,
          secondLinksVisible: newSecondNavbar.showLinks,
          version: newVersion,
          updatedBy: adminEmail,
        },
      })
    );

    memorySettings = newSettings;
    return newSettings;
  }

  /**
   * Retrieves all historical version snapshots.
   */
  static async getHistory(): Promise<NavbarHistoryRecord[]> {
    const records = await tryPrisma(() =>
      prisma.navbarHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    );

    if (records && records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        section: r.section as "top_bar" | "second_navbar" | "full",
        snapshot: r.snapshot as unknown as NavbarSettings,
        description: r.description || "Version snapshot",
        version: r.version,
        createdAt: r.createdAt.toISOString(),
        createdBy: r.createdBy || "admin",
      }));
    }

    return [...memoryHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Restores a previously saved snapshot.
   * If a specific section is specified (or indicated by targetRecord), restores only that section
   * so restoring Top Bar does not overwrite Second Navbar, and vice versa.
   * Saves the current active state before restoring so the operation is fully reversible.
   */
  static async restoreHistory(
    historyId: string,
    adminEmail = "admin@peralagae.com",
    targetSection?: "top_bar" | "second_navbar" | "full"
  ): Promise<NavbarSettings> {
    const historyList = await this.getHistory();
    const targetRecord = historyList.find((h) => h.id === historyId);

    if (!targetRecord) {
      throw new Error(`Version history snapshot '${historyId}' not found`);
    }

    const current = await this.getSettings();
    const restoreSection = targetSection || (targetRecord.section !== "full" ? targetRecord.section : "full");

    // Preserve current state into history before restoring
    await this.saveHistorySnapshot(
      restoreSection,
      JSON.parse(JSON.stringify(current)),
      `Pre-restore backup before restoring ${restoreSection === "top_bar" ? "Top Bar" : restoreSection === "second_navbar" ? "Second Navbar" : "navbar"} version ${targetRecord.version}`,
      adminEmail
    );

    const newVersion = Math.max(current.version, targetRecord.version) + 1;
    let restoredSettings: NavbarSettings;

    if (restoreSection === "top_bar") {
      // Restore ONLY Top Bar, preserve current Second Navbar
      restoredSettings = {
        ...current,
        topBar: { ...targetRecord.snapshot.topBar },
        version: newVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };
    } else if (restoreSection === "second_navbar") {
      // Restore ONLY Second Navbar, preserve current Top Bar
      restoredSettings = {
        ...current,
        secondNavbar: {
          ...targetRecord.snapshot.secondNavbar,
          links: targetRecord.snapshot.secondNavbar.links.map((l) => ({ ...l })),
        },
        version: newVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };
    } else {
      restoredSettings = {
        ...targetRecord.snapshot,
        version: newVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };
    };

    await tryPrisma(() =>
      prisma.navbarSetting.upsert({
        where: { id: "current" },
        create: {
          id: "current",
          topBarText: restoredSettings.topBar.text,
          topBarBgColor: restoredSettings.topBar.backgroundColor,
          topBarTextColor: restoredSettings.topBar.textColor,
          topBarVisible: restoredSettings.topBar.visible,
          topBarDismissible: restoredSettings.topBar.dismissible,
          secondPhone: restoredSettings.secondNavbar.phone,
          secondPhoneHref: restoredSettings.secondNavbar.phoneHref,
          secondPromoText: restoredSettings.secondNavbar.promoText,
          secondCtaText: restoredSettings.secondNavbar.ctaText,
          secondCtaHref: restoredSettings.secondNavbar.ctaHref,
          secondLinks: restoredSettings.secondNavbar.links as unknown as object,
          secondPhoneVisible: restoredSettings.secondNavbar.showPhone,
          secondPromoVisible: restoredSettings.secondNavbar.showPromotion,
          secondLinksVisible: restoredSettings.secondNavbar.showLinks,
          version: newVersion,
          updatedBy: adminEmail,
        },
        update: {
          topBarText: restoredSettings.topBar.text,
          topBarBgColor: restoredSettings.topBar.backgroundColor,
          topBarTextColor: restoredSettings.topBar.textColor,
          topBarVisible: restoredSettings.topBar.visible,
          topBarDismissible: restoredSettings.topBar.dismissible,
          secondPhone: restoredSettings.secondNavbar.phone,
          secondPhoneHref: restoredSettings.secondNavbar.phoneHref,
          secondPromoText: restoredSettings.secondNavbar.promoText,
          secondCtaText: restoredSettings.secondNavbar.ctaText,
          secondCtaHref: restoredSettings.secondNavbar.ctaHref,
          secondLinks: restoredSettings.secondNavbar.links as unknown as object,
          secondPhoneVisible: restoredSettings.secondNavbar.showPhone,
          secondPromoVisible: restoredSettings.secondNavbar.showPromotion,
          secondLinksVisible: restoredSettings.secondNavbar.showLinks,
          version: newVersion,
          updatedBy: adminEmail,
        },
      })
    );

    memorySettings = restoredSettings;
    return restoredSettings;
  }

  /**
   * Helper to persist a history snapshot.
   */
  private static async saveHistorySnapshot(
    section: "top_bar" | "second_navbar" | "full",
    snapshot: NavbarSettings,
    description: string,
    createdBy: string
  ): Promise<NavbarHistoryRecord> {
    const id = `hist_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const newRecord: NavbarHistoryRecord = {
      id,
      section,
      snapshot,
      description,
      version: snapshot.version,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    await tryPrisma(() =>
      prisma.navbarHistory.create({
        data: {
          id,
          section,
          snapshot: snapshot as unknown as object,
          description,
          version: snapshot.version,
          createdBy,
        },
      })
    );

    memoryHistory.unshift(newRecord);
    // Keep max 100 entries in memory
    if (memoryHistory.length > 100) {
      memoryHistory = memoryHistory.slice(0, 100);
    }

    return newRecord;
  }
}
