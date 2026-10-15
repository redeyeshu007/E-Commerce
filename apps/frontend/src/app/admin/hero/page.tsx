"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Upload,
  Info,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  fetchAdminHeroSettings,
  updateAdminHeroSettings,
  uploadAdminHeroImage,
} from "@/services/hero-admin-service";
import {
  HERO_SETTINGS_QUERY_KEY,
  HERO_SETTINGS_UPDATED_EVENT,
} from "@/services/hero-settings-service";
import {
  defaultHeroSettingsData,
  HERO_SLOT_SPECS,
  type HeroSettingsData,
} from "@/types/hero";

interface SlotFormState1 {
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
  description: string;
}

interface SlotFormStateSecondary {
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
}

export default function AdminHeroPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication & Layout state
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Server Data state
  const [savedSettings, setSavedSettings] = useState<HeroSettingsData>(defaultHeroSettingsData);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Editable Form States for the 3 slots
  const [slot1, setSlot1] = useState<SlotFormState1>({
    imageUrl: defaultHeroSettingsData.heroImage1.imageUrl,
    imageAlt: defaultHeroSettingsData.heroImage1.imageAlt,
    normalHeadline: defaultHeroSettingsData.heroImage1.normalHeadline,
    boldHeadline: defaultHeroSettingsData.heroImage1.boldHeadline,
    description: defaultHeroSettingsData.heroImage1.description,
  });

  const [slot2, setSlot2] = useState<SlotFormStateSecondary>({
    imageUrl: defaultHeroSettingsData.heroImage2.imageUrl,
    imageAlt: defaultHeroSettingsData.heroImage2.imageAlt,
    normalHeadline: defaultHeroSettingsData.heroImage2.normalHeadline,
    boldHeadline: defaultHeroSettingsData.heroImage2.boldHeadline,
  });

  const [slot3, setSlot3] = useState<SlotFormStateSecondary>({
    imageUrl: defaultHeroSettingsData.heroImage3.imageUrl,
    imageAlt: defaultHeroSettingsData.heroImage3.imageAlt,
    normalHeadline: defaultHeroSettingsData.heroImage3.normalHeadline,
    boldHeadline: defaultHeroSettingsData.heroImage3.boldHeadline,
  });

  // Local file selection and preview state (before publishing)
  const [pendingFiles, setPendingFiles] = useState<{
    heroImage1?: File;
    heroImage2?: File;
    heroImage3?: File;
  }>({});

  const [previewUrls, setPreviewUrls] = useState<{
    heroImage1?: string;
    heroImage2?: string;
    heroImage3?: string;
  }>({});

  // Slot-specific upload validation errors
  const [slotErrors, setSlotErrors] = useState<{
    heroImage1?: string;
    heroImage2?: string;
    heroImage3?: string;
  }>({});

  // File input refs
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);

  // Verify authentication on mount
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      try {
        await getAdminSession();
        if (isMounted) setIsVerifying(false);
      } catch {
        if (isMounted) router.replace("/?auth=login");
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load hero settings
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await fetchAdminHeroSettings();
      setSavedSettings(data);

      setSlot1({
        imageUrl: data.heroImage1.imageUrl,
        imageAlt: data.heroImage1.imageAlt,
        normalHeadline: data.heroImage1.normalHeadline,
        boldHeadline: data.heroImage1.boldHeadline,
        description: data.heroImage1.description,
      });

      setSlot2({
        imageUrl: data.heroImage2.imageUrl,
        imageAlt: data.heroImage2.imageAlt,
        normalHeadline: data.heroImage2.normalHeadline,
        boldHeadline: data.heroImage2.boldHeadline,
      });

      setSlot3({
        imageUrl: data.heroImage3.imageUrl,
        imageAlt: data.heroImage3.imageAlt,
        normalHeadline: data.heroImage3.normalHeadline,
        boldHeadline: data.heroImage3.boldHeadline,
      });

      // Clear any pending local previews
      setPendingFiles({});
      setPreviewUrls({});
      setSlotErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load hero settings";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isVerifying) {
      loadData();
    }
  }, [isVerifying, loadData]);

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
      router.replace("/?auth=login");
    } catch {
      router.replace("/?auth=login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  // File selection handler
  const handleFileSelect = (
    slotKey: "heroImage1" | "heroImage2" | "heroImage3",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation: format check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setSlotErrors((prev) => ({
        ...prev,
        [slotKey]: "Invalid file format. Please upload a JPEG, PNG, or WebP image.",
      }));
      e.target.value = "";
      return;
    }

    // Client-side validation: size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setSlotErrors((prev) => ({
        ...prev,
        [slotKey]: `File size (${sizeMb}MB) exceeds the maximum 5MB limit.`,
      }));
      e.target.value = "";
      return;
    }

    // Clear previous error for this slot
    setSlotErrors((prev) => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });

    // Revoke previous blob url if exists
    if (previewUrls[slotKey]?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrls[slotKey]!);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => ({ ...prev, [slotKey]: objectUrl }));
    setPendingFiles((prev) => ({ ...prev, [slotKey]: file }));
  };

  // Detect Unsaved Changes
  const hasUnsavedChanges = useMemo(() => {
    if (Object.keys(pendingFiles).length > 0) return true;

    const s1 = savedSettings.heroImage1;
    if (
      slot1.normalHeadline !== s1.normalHeadline ||
      slot1.boldHeadline !== s1.boldHeadline ||
      slot1.description !== s1.description
    ) {
      return true;
    }

    const s2 = savedSettings.heroImage2;
    if (
      slot2.normalHeadline !== s2.normalHeadline ||
      slot2.boldHeadline !== s2.boldHeadline
    ) {
      return true;
    }

    const s3 = savedSettings.heroImage3;
    if (
      slot3.normalHeadline !== s3.normalHeadline ||
      slot3.boldHeadline !== s3.boldHeadline
    ) {
      return true;
    }

    return false;
  }, [savedSettings, slot1, slot2, slot3, pendingFiles]);

  // Cancel Changes: Discard unsaved edits and reset to savedSettings
  const handleCancelChanges = () => {
    // Revoke any blob URLs
    Object.values(previewUrls).forEach((url) => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    setPendingFiles({});
    setPreviewUrls({});
    setSlotErrors({});

    // Reset form inputs back to saved settings
    setSlot1({
      imageUrl: savedSettings.heroImage1.imageUrl,
      imageAlt: savedSettings.heroImage1.imageAlt,
      normalHeadline: savedSettings.heroImage1.normalHeadline,
      boldHeadline: savedSettings.heroImage1.boldHeadline,
      description: savedSettings.heroImage1.description,
    });

    setSlot2({
      imageUrl: savedSettings.heroImage2.imageUrl,
      imageAlt: savedSettings.heroImage2.imageAlt,
      normalHeadline: savedSettings.heroImage2.normalHeadline,
      boldHeadline: savedSettings.heroImage2.boldHeadline,
    });

    setSlot3({
      imageUrl: savedSettings.heroImage3.imageUrl,
      imageAlt: savedSettings.heroImage3.imageAlt,
      normalHeadline: savedSettings.heroImage3.normalHeadline,
      boldHeadline: savedSettings.heroImage3.boldHeadline,
    });

    // Reset file inputs
    if (fileInputRef1.current) fileInputRef1.current.value = "";
    if (fileInputRef2.current) fileInputRef2.current.value = "";
    if (fileInputRef3.current) fileInputRef3.current.value = "";

    setStatusMessage({
      type: "info",
      text: "Unsaved changes discarded. Form reverted to last published configuration.",
    });
  };

  // Save & Publish Changes
  const handleSaveAndPublish = async () => {
    // Validation
    if (!slot1.normalHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 1: Normal headline is required." });
      return;
    }
    if (!slot1.boldHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 1: Bold headline is required." });
      return;
    }
    if (!slot2.normalHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 2: Normal headline is required." });
      return;
    }
    if (!slot2.boldHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 2: Bold headline is required." });
      return;
    }
    if (!slot3.normalHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 3: Normal headline is required." });
      return;
    }
    if (!slot3.boldHeadline.trim()) {
      setStatusMessage({ type: "error", text: "Hero Image 3: Bold headline is required." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      let finalImageUrl1 = slot1.imageUrl;
      let finalImageUrl2 = slot2.imageUrl;
      let finalImageUrl3 = slot3.imageUrl;

      // 1. Upload pending files independently
      if (pendingFiles.heroImage1) {
        const uploadResult = await uploadAdminHeroImage(pendingFiles.heroImage1);
        finalImageUrl1 = uploadResult.url;
      }
      if (pendingFiles.heroImage2) {
        const uploadResult = await uploadAdminHeroImage(pendingFiles.heroImage2);
        finalImageUrl2 = uploadResult.url;
      }
      if (pendingFiles.heroImage3) {
        const uploadResult = await uploadAdminHeroImage(pendingFiles.heroImage3);
        finalImageUrl3 = uploadResult.url;
      }

      // 2. Persist updated configuration
      const payload = {
        heroImage1: {
          imageUrl: finalImageUrl1,
          imageAlt: `${slot1.normalHeadline.trim()} ${slot1.boldHeadline.trim()} - PERALAGAE`,
          normalHeadline: slot1.normalHeadline.trim(),
          boldHeadline: slot1.boldHeadline.trim(),
          description: slot1.description.trim(),
        },
        heroImage2: {
          imageUrl: finalImageUrl2,
          imageAlt: `${slot2.normalHeadline.trim()} ${slot2.boldHeadline.trim()} - PERALAGAE`,
          normalHeadline: slot2.normalHeadline.trim(),
          boldHeadline: slot2.boldHeadline.trim(),
        },
        heroImage3: {
          imageUrl: finalImageUrl3,
          imageAlt: `${slot3.normalHeadline.trim()} ${slot3.boldHeadline.trim()} - PERALAGAE`,
          normalHeadline: slot3.normalHeadline.trim(),
          boldHeadline: slot3.boldHeadline.trim(),
        },
      };

      const updated = await updateAdminHeroSettings(payload);

      // 3. Update state
      setSavedSettings(updated);
      setSlot1({
        imageUrl: updated.heroImage1.imageUrl,
        imageAlt: updated.heroImage1.imageAlt,
        normalHeadline: updated.heroImage1.normalHeadline,
        boldHeadline: updated.heroImage1.boldHeadline,
        description: updated.heroImage1.description,
      });
      setSlot2({
        imageUrl: updated.heroImage2.imageUrl,
        imageAlt: updated.heroImage2.imageAlt,
        normalHeadline: updated.heroImage2.normalHeadline,
        boldHeadline: updated.heroImage2.boldHeadline,
      });
      setSlot3({
        imageUrl: updated.heroImage3.imageUrl,
        imageAlt: updated.heroImage3.imageAlt,
        normalHeadline: updated.heroImage3.normalHeadline,
        boldHeadline: updated.heroImage3.boldHeadline,
      });

      // Clear pending upload state
      setPendingFiles({});
      setPreviewUrls({});
      setSlotErrors({});

      // Reset file input elements
      if (fileInputRef1.current) fileInputRef1.current.value = "";
      if (fileInputRef2.current) fileInputRef2.current.value = "";
      if (fileInputRef3.current) fileInputRef3.current.value = "";

      // Invalidate queries and dispatch live synchronization event
      queryClient.invalidateQueries({ queryKey: HERO_SETTINGS_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(HERO_SETTINGS_UPDATED_EVENT, { detail: updated })
        );
      }

      setStatusMessage({
        type: "success",
        text: `Hero banner changes published successfully (v${updated.version}). The live homepage reflects your updates.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish hero banner changes";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (isVerifying || isLoadingData) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A572] mb-3" />
        <p className="text-xs font-medium uppercase tracking-wider text-[#666666]">
          Loading Hero Images Management...
        </p>
      </div>
    );
  }

  // Active display image URLs (preview if file selected, otherwise current saved image)
  const displayImage1 = previewUrls.heroImage1 || slot1.imageUrl;
  const displayImage2 = previewUrls.heroImage2 || slot2.imageUrl;
  const displayImage3 = previewUrls.heroImage3 || slot3.imageUrl;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#111111]">
      {/* Top Header Navbar */}
      <AdminNavbar
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Slide-out Navigation Drawer */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[#C5A572]">
                  Storefront Content
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-mono text-gray-500">
                  Version {savedSettings.version}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#111111]">
                Hero Images Management
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#666666] max-w-2xl leading-relaxed">
                Independently customize the 3 homepage promotional hero slots.
                Upload replacement images, modify headline copy, and publish updates live.
              </p>
            </div>

            {/* Quick Status Indicator */}
            <div className="self-start sm:self-auto flex items-center gap-2">
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Published & Live
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            data-testid="admin-hero-status-message"
            className={`mb-6 p-4 rounded-lg flex items-start justify-between gap-3 text-xs sm:text-sm shadow-sm transition-all duration-300 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {statusMessage.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {statusMessage.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              {statusMessage.type === "info" && (
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium break-words leading-relaxed">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 transition p-1 shrink-0 -mr-1 -mt-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Informative Guidance Banner */}
        <div className="mb-8 p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-[#C5A572] shrink-0 mt-0.5" />
          <div className="text-xs text-[#555555] leading-relaxed">
            <p className="font-semibold text-[#111111] mb-0.5">
              Strictly Preserved Layout & Proportions
            </p>
            <p>
              The PERALAGAE hero composition uses a 2-column layout: <strong>Hero Image 1</strong> spans the full height of the left column (~3:4 portrait), while <strong>Hero Image 2</strong> and <strong>Hero Image 3</strong> are stacked in the right column (~16:9 landscape). Existing &ldquo;Shop Now&rdquo; CTA buttons, destinations, and responsive grid proportions remain preserved.
            </p>
          </div>
        </div>

        {/* 3 Editable Cards Grid */}
        <div className="space-y-8">
          {/* ── CARD 1: HERO IMAGE 1 ───────────────────────────────────────── */}
          <section
            data-testid="hero-card-1"
            className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-semibold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    Card 1 — Hero Image 1
                  </h2>
                  <p className="text-[11px] text-[#666666]">
                    {HERO_SLOT_SPECS.heroImage1.position}
                  </p>
                </div>
              </div>

              {/* Informative Read-Only Spec Pill */}
              <div className="text-xs bg-gray-50 border border-gray-200 px-3 py-1 rounded text-[#555555] self-start sm:self-auto">
                <span className="font-medium text-[#222222]">Recommended: </span>
                {HERO_SLOT_SPECS.heroImage1.recommendedDimensions} ({HERO_SLOT_SPECS.heroImage1.recommendedAspectRatio})
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Thumbnail & Upload Controls */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#333333]">
                  Image Asset & Preview
                </label>

                {/* Thumbnail Display */}
                <div className="relative aspect-[3/4] max-w-[280px] w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                  <Image
                    src={displayImage1}
                    alt={slot1.imageAlt || "Hero Image 1 preview"}
                    fill
                    sizes="280px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  {previewUrls.heroImage1 && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                      Pending Publish Preview
                    </div>
                  )}
                </div>

                {/* Upload / Replace Control */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef1}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileSelect("heroImage1", e)}
                    className="hidden"
                    id="hero-image-1-upload"
                  />
                  <label
                    htmlFor="hero-image-1-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-[#111111] bg-white border border-[#D1D5DB] rounded hover:bg-[#F9F9F9] cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C5A572]" />
                    <span>Replace Image</span>
                  </label>
                  <p className="mt-1.5 text-[11px] text-[#777777]">
                    Supports JPEG, PNG, or WebP up to 5MB. Applied upon publishing.
                  </p>
                </div>

                {/* Slot-specific validation feedback */}
                {slotErrors.heroImage1 && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {slotErrors.heroImage1}
                  </p>
                )}
              </div>

              {/* Editable Fields */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label
                    htmlFor="hero1-normal-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Normal Headline (Displayed above bold headline)
                  </label>
                  <input
                    type="text"
                    id="hero1-normal-headline"
                    data-testid="hero1-normal-headline-input"
                    value={slot1.normalHeadline}
                    onChange={(e) =>
                      setSlot1((prev) => ({ ...prev, normalHeadline: e.target.value }))
                    }
                    placeholder="e.g. Necklaces &"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Styled in light typography font.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="hero1-bold-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Bold Headline (Displayed below normal headline)
                  </label>
                  <input
                    type="text"
                    id="hero1-bold-headline"
                    data-testid="hero1-bold-headline-input"
                    value={slot1.boldHeadline}
                    onChange={(e) =>
                      setSlot1((prev) => ({ ...prev, boldHeadline: e.target.value }))
                    }
                    placeholder="e.g. Body Jewels"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Main prominent headline displayed on the card.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="hero1-description"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Short Description (Displayed beneath headlines)
                  </label>
                  <textarea
                    id="hero1-description"
                    data-testid="hero1-description-input"
                    rows={3}
                    value={slot1.description}
                    onChange={(e) =>
                      setSlot1((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="e.g. Look to our new season collection for girls."
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors resize-none"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Only Hero Image 1 includes a short description.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── CARD 2: HERO IMAGE 2 ───────────────────────────────────────── */}
          <section
            data-testid="hero-card-2"
            className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-semibold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    Card 2 — Hero Image 2
                  </h2>
                  <p className="text-[11px] text-[#666666]">
                    {HERO_SLOT_SPECS.heroImage2.position}
                  </p>
                </div>
              </div>

              {/* Informative Read-Only Spec Pill */}
              <div className="text-xs bg-gray-50 border border-gray-200 px-3 py-1 rounded text-[#555555] self-start sm:self-auto">
                <span className="font-medium text-[#222222]">Recommended: </span>
                {HERO_SLOT_SPECS.heroImage2.recommendedDimensions} ({HERO_SLOT_SPECS.heroImage2.recommendedAspectRatio})
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Thumbnail & Upload Controls */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#333333]">
                  Image Asset & Preview
                </label>

                {/* Thumbnail Display */}
                <div className="relative aspect-[16/9] max-w-[340px] w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                  <Image
                    src={displayImage2}
                    alt={slot2.imageAlt || "Hero Image 2 preview"}
                    fill
                    sizes="340px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  {previewUrls.heroImage2 && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                      Pending Publish Preview
                    </div>
                  )}
                </div>

                {/* Upload / Replace Control */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef2}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileSelect("heroImage2", e)}
                    className="hidden"
                    id="hero-image-2-upload"
                  />
                  <label
                    htmlFor="hero-image-2-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-[#111111] bg-white border border-[#D1D5DB] rounded hover:bg-[#F9F9F9] cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C5A572]" />
                    <span>Replace Image</span>
                  </label>
                  <p className="mt-1.5 text-[11px] text-[#777777]">
                    Supports JPEG, PNG, or WebP up to 5MB. Applied upon publishing.
                  </p>
                </div>

                {/* Slot-specific validation feedback */}
                {slotErrors.heroImage2 && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {slotErrors.heroImage2}
                  </p>
                )}
              </div>

              {/* Editable Fields (No description field for slot 2) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label
                    htmlFor="hero2-normal-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Normal Headline
                  </label>
                  <input
                    type="text"
                    id="hero2-normal-headline"
                    data-testid="hero2-normal-headline-input"
                    value={slot2.normalHeadline}
                    onChange={(e) =>
                      setSlot2((prev) => ({ ...prev, normalHeadline: e.target.value }))
                    }
                    placeholder="e.g. Just Lunched"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Displayed above the bold headline.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="hero2-bold-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Bold Headline
                  </label>
                  <input
                    type="text"
                    id="hero2-bold-headline"
                    data-testid="hero2-bold-headline-input"
                    value={slot2.boldHeadline}
                    onChange={(e) =>
                      setSlot2((prev) => ({ ...prev, boldHeadline: e.target.value }))
                    }
                    placeholder="e.g. Desk The Hals"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Main title displayed on upper-right banner.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── CARD 3: HERO IMAGE 3 ───────────────────────────────────────── */}
          <section
            data-testid="hero-card-3"
            className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-semibold flex items-center justify-center">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    Card 3 — Hero Image 3
                  </h2>
                  <p className="text-[11px] text-[#666666]">
                    {HERO_SLOT_SPECS.heroImage3.position}
                  </p>
                </div>
              </div>

              {/* Informative Read-Only Spec Pill */}
              <div className="text-xs bg-gray-50 border border-gray-200 px-3 py-1 rounded text-[#555555] self-start sm:self-auto">
                <span className="font-medium text-[#222222]">Recommended: </span>
                {HERO_SLOT_SPECS.heroImage3.recommendedDimensions} ({HERO_SLOT_SPECS.heroImage3.recommendedAspectRatio})
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Thumbnail & Upload Controls */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#333333]">
                  Image Asset & Preview
                </label>

                {/* Thumbnail Display */}
                <div className="relative aspect-[16/9] max-w-[340px] w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                  <Image
                    src={displayImage3}
                    alt={slot3.imageAlt || "Hero Image 3 preview"}
                    fill
                    sizes="340px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  {previewUrls.heroImage3 && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                      Pending Publish Preview
                    </div>
                  )}
                </div>

                {/* Upload / Replace Control */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef3}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileSelect("heroImage3", e)}
                    className="hidden"
                    id="hero-image-3-upload"
                  />
                  <label
                    htmlFor="hero-image-3-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-[#111111] bg-white border border-[#D1D5DB] rounded hover:bg-[#F9F9F9] cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C5A572]" />
                    <span>Replace Image</span>
                  </label>
                  <p className="mt-1.5 text-[11px] text-[#777777]">
                    Supports JPEG, PNG, or WebP up to 5MB. Applied upon publishing.
                  </p>
                </div>

                {/* Slot-specific validation feedback */}
                {slotErrors.heroImage3 && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {slotErrors.heroImage3}
                  </p>
                )}
              </div>

              {/* Editable Fields (No description field for slot 3) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label
                    htmlFor="hero3-normal-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Normal Headline
                  </label>
                  <input
                    type="text"
                    id="hero3-normal-headline"
                    data-testid="hero3-normal-headline-input"
                    value={slot3.normalHeadline}
                    onChange={(e) =>
                      setSlot3((prev) => ({ ...prev, normalHeadline: e.target.value }))
                    }
                    placeholder="e.g. Jewelry &"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Displayed above the bold headline.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="hero3-bold-headline"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                  >
                    Bold Headline
                  </label>
                  <input
                    type="text"
                    id="hero3-bold-headline"
                    data-testid="hero3-bold-headline-input"
                    value={slot3.boldHeadline}
                    onChange={(e) =>
                      setSlot3((prev) => ({ ...prev, boldHeadline: e.target.value }))
                    }
                    placeholder="e.g. Charm Bracelets"
                    className="w-full px-3.5 py-2 text-sm text-[#111111] border border-[#D1D5DB] rounded focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Main title displayed on lower-right banner.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── BOTTOM ACTIONS BAR ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 z-30 mt-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white/95 backdrop-blur border-t border-[#E5E7EB] shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#666666]">
            {hasUnsavedChanges ? (
              <span className="font-medium text-amber-700">
                You have unsaved changes across hero banner slots.
              </span>
            ) : (
              <span>All changes saved and published to the live storefront.</span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Cancel Changes Button */}
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={!hasUnsavedChanges || isSaving}
              data-testid="hero-cancel-changes-button"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border border-[#D1D5DB] rounded text-[#444444] bg-white hover:bg-[#F9F9F9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#888888]" />
              <span>Cancel Changes</span>
            </button>

            {/* Save & Publish Changes Button */}
            <button
              type="button"
              onClick={handleSaveAndPublish}
              disabled={!hasUnsavedChanges || isSaving}
              data-testid="hero-save-publish-button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded text-white bg-[#111111] hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A572]" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#C5A572]" />
                  <span>Save & Publish Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
