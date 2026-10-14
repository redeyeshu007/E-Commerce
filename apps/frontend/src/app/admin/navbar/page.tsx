"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  Save,
  Undo2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  History,
  Check,
} from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  fetchAdminNavbarSettings,
  updateAdminTopBar,
  updateAdminSecondNavbar,
  fetchAdminNavbarHistory,
  restoreAdminNavbarVersion,
} from "@/services/navbar-admin-service";
import {
  NAVBAR_SETTINGS_QUERY_KEY,
  NAVBAR_SETTINGS_UPDATED_EVENT,
} from "@/services/navbar-settings-service";
import type {
  NavbarSettingsData,
  NavbarHistoryItem,
  TopBarConfig,
  SecondNavbarConfig,
  SecondNavbarLinkItem,
} from "@/types/navbar";

type TabKey = "top_bar" | "second_navbar";

export default function AdminNavbarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication & Layout state
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>("top_bar");

  // Server Data state
  const [serverSettings, setServerSettings] = useState<NavbarSettingsData | null>(null);
  const [historyList, setHistoryList] = useState<NavbarHistoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Top Bar Form State
  const [topBarForm, setTopBarForm] = useState<TopBarConfig>({
    text: "",
    backgroundColor: "#FBC0CE",
    textColor: "#222222",
    visible: true,
    dismissible: true,
  });

  // Second Navbar Form State
  const [secondNavbarForm, setSecondNavbarForm] = useState<SecondNavbarConfig>({
    phone: "",
    phoneHref: "",
    promoText: "",
    ctaText: "",
    ctaHref: "",
    links: [],
    showPhone: true,
    showPromotion: true,
    showLinks: true,
  });

  // Secondary Links Editor State
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [deleteConfirmLinkId, setDeleteConfirmLinkId] = useState<string | null>(null);

  // History & Restore Modal State
  const [restoreConfirmTarget, setRestoreConfirmTarget] = useState<{
    item: NavbarHistoryItem;
    section: "top_bar" | "second_navbar";
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Section-specific inline history filters
  const topBarHistory = useMemo(
    () => historyList.filter((item) => item.section === "top_bar" || item.section === "full"),
    [historyList]
  );
  const secondNavbarHistory = useMemo(
    () => historyList.filter((item) => item.section === "second_navbar" || item.section === "full"),
    [historyList]
  );

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

  // Load navbar settings and history
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [settings, history] = await Promise.all([
        fetchAdminNavbarSettings(),
        fetchAdminNavbarHistory(),
      ]);
      setServerSettings(settings);
      setHistoryList(history);

      // Populate Top Bar form
      setTopBarForm({ ...settings.topBar });

      // Populate Second Navbar form
      setSecondNavbarForm({
        ...settings.secondNavbar,
        links: settings.secondNavbar.links.map((l) => ({ ...l })),
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load navbar settings",
      });
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
    } finally {
      router.replace("/?auth=login");
    }
  };

  // Detect Unsaved Changes
  const hasTopBarChanges = useMemo(() => {
    if (!serverSettings) return false;
    const s = serverSettings.topBar;
    return (
      topBarForm.text !== s.text ||
      topBarForm.backgroundColor !== s.backgroundColor ||
      topBarForm.textColor !== s.textColor ||
      topBarForm.visible !== s.visible ||
      topBarForm.dismissible !== s.dismissible
    );
  }, [serverSettings, topBarForm]);

  const hasSecondNavbarChanges = useMemo(() => {
    if (!serverSettings) return false;
    const s = serverSettings.secondNavbar;
    if (
      secondNavbarForm.phone !== s.phone ||
      secondNavbarForm.phoneHref !== s.phoneHref ||
      secondNavbarForm.promoText !== s.promoText ||
      secondNavbarForm.ctaText !== s.ctaText ||
      secondNavbarForm.ctaHref !== s.ctaHref ||
      secondNavbarForm.showPhone !== s.showPhone ||
      secondNavbarForm.showPromotion !== s.showPromotion ||
      secondNavbarForm.showLinks !== s.showLinks
    ) {
      return true;
    }
    if (secondNavbarForm.links.length !== s.links.length) return true;
    return JSON.stringify(secondNavbarForm.links) !== JSON.stringify(s.links);
  }, [serverSettings, secondNavbarForm]);

  // Top Bar Cancel
  const handleCancelTopBar = () => {
    if (!serverSettings) return;
    setTopBarForm({ ...serverSettings.topBar });
    setStatusMessage({ type: "info", text: "Top Bar changes discarded." });
  };

  // Top Bar Save
  const handleSaveTopBar = async () => {
    if (!topBarForm.text.trim()) {
      setStatusMessage({ type: "error", text: "Announcement text cannot be empty." });
      return;
    }
    if (topBarForm.text.length > 250) {
      setStatusMessage({ type: "error", text: "Announcement text must not exceed 250 characters." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAdminTopBar({
        text: topBarForm.text.trim(),
        backgroundColor: topBarForm.backgroundColor,
        textColor: topBarForm.textColor,
        visible: topBarForm.visible,
        dismissible: topBarForm.dismissible,
      });

      setServerSettings(updated);
      setTopBarForm({ ...updated.topBar });
      setStatusMessage({
        type: "success",
        text: `Top Bar published successfully as v${updated.version}! Storefront is now synchronized.`,
      });

      // Refresh history list and invalidate storefront query
      const newHistory = await fetchAdminNavbarHistory();
      setHistoryList(newHistory);
      queryClient.invalidateQueries({ queryKey: NAVBAR_SETTINGS_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(NAVBAR_SETTINGS_UPDATED_EVENT));
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to publish Top Bar changes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Second Navbar Cancel
  const handleCancelSecondNavbar = () => {
    if (!serverSettings) return;
    setSecondNavbarForm({
      ...serverSettings.secondNavbar,
      links: serverSettings.secondNavbar.links.map((l) => ({ ...l })),
    });
    setStatusMessage({ type: "info", text: "Second Navbar changes discarded." });
  };

  // Second Navbar Save
  const handleSaveSecondNavbar = async () => {
    if (!secondNavbarForm.promoText.trim()) {
      setStatusMessage({ type: "error", text: "Promotional message cannot be empty." });
      return;
    }
    if (secondNavbarForm.promoText.length > 120) {
      setStatusMessage({ type: "error", text: "Promotional message must not exceed 120 characters." });
      return;
    }
    if (secondNavbarForm.links.length === 0) {
      setStatusMessage({ type: "error", text: "At least one secondary navigation link is required." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAdminSecondNavbar({
        phone: secondNavbarForm.phone.trim(),
        phoneHref: secondNavbarForm.phoneHref.trim() || `tel:${secondNavbarForm.phone.replace(/\s+/g, "")}`,
        promoText: secondNavbarForm.promoText.trim(),
        ctaText: secondNavbarForm.ctaText.trim(),
        ctaHref: secondNavbarForm.ctaHref.trim() || "/shop",
        links: secondNavbarForm.links,
        showPhone: secondNavbarForm.showPhone,
        showPromotion: secondNavbarForm.showPromotion,
        showLinks: secondNavbarForm.showLinks,
      });

      setServerSettings(updated);
      setSecondNavbarForm({
        ...updated.secondNavbar,
        links: updated.secondNavbar.links.map((l) => ({ ...l })),
      });
      setStatusMessage({
        type: "success",
        text: `Second Navbar published successfully as v${updated.version}! Storefront is now synchronized.`,
      });

      // Refresh history list and invalidate storefront query
      const newHistory = await fetchAdminNavbarHistory();
      setHistoryList(newHistory);
      queryClient.invalidateQueries({ queryKey: NAVBAR_SETTINGS_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(NAVBAR_SETTINGS_UPDATED_EVENT));
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to publish Second Navbar changes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Secondary Links Reordering & Management
  const handleMoveLink = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= secondNavbarForm.links.length) return;

    const newLinks = [...secondNavbarForm.links];
    const temp = newLinks[index];
    const swap = newLinks[targetIndex];
    if (temp && swap) {
      newLinks[index] = swap;
      newLinks[targetIndex] = temp;
      setSecondNavbarForm((prev) => ({ ...prev, links: newLinks }));
    }
  };

  const handleUpdateLink = (id: string, field: "label" | "href", value: string) => {
    setSecondNavbarForm((prev) => ({
      ...prev,
      links: prev.links.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkHref.trim()) {
      setStatusMessage({ type: "error", text: "Link label and destination URL are both required." });
      return;
    }
    const newId = `link_${Date.now()}`;
    const newLink: SecondNavbarLinkItem = {
      id: newId,
      label: newLinkLabel.trim(),
      href: newLinkHref.trim(),
      isImplemented: true,
    };
    setSecondNavbarForm((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));
    setNewLinkLabel("");
    setNewLinkHref("");
    setStatusMessage(null);
  };

  const handleConfirmDeleteLink = () => {
    if (!deleteConfirmLinkId) return;
    if (secondNavbarForm.links.length <= 1) {
      setStatusMessage({
        type: "error",
        text: "Cannot delete the only navigation link. Keep at least one link.",
      });
      setDeleteConfirmLinkId(null);
      return;
    }
    setSecondNavbarForm((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== deleteConfirmLinkId),
    }));
    setDeleteConfirmLinkId(null);
  };

  // Restore Version Execution
  const handleExecuteRestore = async () => {
    if (!restoreConfirmTarget) return;
    const { item, section } = restoreConfirmTarget;
    setIsRestoring(true);
    setStatusMessage(null);
    try {
      const restored = await restoreAdminNavbarVersion(item.id, section);
      setServerSettings(restored);
      if (section === "top_bar") {
        setTopBarForm({ ...restored.topBar });
      } else {
        setSecondNavbarForm({
          ...restored.secondNavbar,
          links: restored.secondNavbar.links.map((l) => ({ ...l })),
        });
      }
      setRestoreConfirmTarget(null);
      const sectionName = section === "top_bar" ? "Top Bar" : "Second Navbar";
      setStatusMessage({
        type: "success",
        text: `Version ${item.version} of the ${sectionName} successfully restored and published as v${restored.version}! Live storefront updated.`,
      });

      // Refresh history list and storefront cache
      const newHistory = await fetchAdminNavbarHistory();
      setHistoryList(newHistory);
      queryClient.invalidateQueries({ queryKey: NAVBAR_SETTINGS_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(NAVBAR_SETTINGS_UPDATED_EVENT));
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to restore version snapshot",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (isVerifying || isLoadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C5A572]" />
          <p className="text-xs uppercase tracking-widest text-[#888888] font-medium">
            Loading Navbar Management System...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-[#1A1A1A]">
      {/* Slide-out Navigation Drawer */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Top Admin Navbar */}
      <AdminNavbar
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-medium tracking-tight text-[#111111]">
                Navbar Management
              </h1>
              {serverSettings && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                  v{serverSettings.version} Published
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#666666]">
              Manage the storefront announcement bar and secondary navigation bar. Changes publish directly to the live website.
            </p>
          </div>

          {/* Quick Refresh / Status */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoadingData || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4B5563] bg-white border border-[#D1D5DB] rounded hover:bg-[#F9FAFB] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              title="Reload current settings from server"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {statusMessage && (
          <div
            className={`mt-4 p-4 rounded-md border flex items-start justify-between gap-3 text-sm transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {statusMessage.type === "error" && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {statusMessage.type === "info" && (
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="mt-6 border-b border-[#E5E7EB]">
          <nav className="flex space-x-8" aria-label="Navbar Sections">
            <button
              type="button"
              onClick={() => setActiveTab("top_bar")}
              className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "top_bar"
                  ? "border-[#C5A572] text-[#111111] font-semibold"
                  : "border-transparent text-[#666666] hover:text-[#111111] hover:border-gray-300"
              }`}
            >
              <span>Top Bar</span>
              {hasTopBarChanges && (
                <span className="w-2 h-2 rounded-full bg-[#C5A572]" title="Unsaved changes" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("second_navbar")}
              className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "second_navbar"
                  ? "border-[#C5A572] text-[#111111] font-semibold"
                  : "border-transparent text-[#666666] hover:text-[#111111] hover:border-gray-300"
              }`}
            >
              <span>Second Navbar</span>
              {hasSecondNavbarChanges && (
                <span className="w-2 h-2 rounded-full bg-[#C5A572]" title="Unsaved changes" />
              )}
            </button>
          </nav>
        </div>

        {/* ─── TAB 1: TOP BAR MANAGEMENT ───────────────────────────────────── */}
        {activeTab === "top_bar" && (
          <div className="mt-8 space-y-8">
            {/* Live Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#888888]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Live Storefront Preview
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {hasTopBarChanges ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      Previewing Unsaved Changes
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Live Storefront Matches Preview
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Rendering Container */}
              <div
                className="w-full mx-auto transition-all duration-300 rounded overflow-hidden border border-gray-200 shadow-inner"
              >
                {topBarForm.visible ? (
                  <div
                    className="relative w-full py-2.5 px-8 flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: topBarForm.backgroundColor,
                      color: topBarForm.textColor,
                    }}
                  >
                    <p className="text-center text-xs sm:text-[13px] font-normal leading-snug tracking-wide">
                      {topBarForm.text || "Your promotional announcement here..."}
                    </p>
                    {topBarForm.dismissible && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#222222] opacity-70"
                        title="Dismiss close icon (active on storefront)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="py-4 px-6 bg-gray-100 text-center text-xs text-gray-500 italic">
                    Top Bar is currently marked HIDDEN (will not be displayed to customers)
                  </div>
                )}
              </div>
            </div>

            {/* Editor Form Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-medium text-[#111111] mb-5">
                Top Bar Announcement Settings
              </h2>

              <div className="space-y-6">
                {/* Announcement Text Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="announcement-text"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333]"
                    >
                      Announcement Text <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-xs ${
                        topBarForm.text.length > 250 ? "text-rose-600 font-bold" : "text-gray-400"
                      }`}
                    >
                      {topBarForm.text.length} / 250
                    </span>
                  </div>
                  <textarea
                    id="announcement-text"
                    rows={3}
                    value={topBarForm.text}
                    onChange={(e) => setTopBarForm((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="e.g. SUMMER SALE, Get 40% Off for all products."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use a comma (e.g. <span className="font-mono">SUMMER SALE, Get 40% Off</span>) to create natural responsive line breaks on mobile.
                  </p>
                </div>

                {/* Colors & Visibility Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
                  {/* Background Color */}
                  <div>
                    <label
                      htmlFor="bg-color"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                    >
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="bg-color-picker"
                        value={topBarForm.backgroundColor.startsWith("#") ? topBarForm.backgroundColor : "#FBC0CE"}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        id="bg-color"
                        value={topBarForm.backgroundColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono uppercase border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label
                      htmlFor="text-color"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                    >
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="text-color-picker"
                        value={topBarForm.textColor.startsWith("#") ? topBarForm.textColor : "#222222"}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        id="text-color"
                        value={topBarForm.textColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs font-mono uppercase border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex flex-col justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-2">
                      Visibility
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={topBarForm.visible}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, visible: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#111111]"></div>
                      <span className="ml-3 text-xs font-medium text-gray-700">
                        {topBarForm.visible ? "Visible on Storefront" : "Hidden"}
                      </span>
                    </label>
                  </div>

                  {/* Dismissible Toggle */}
                  <div className="flex flex-col justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-2">
                      Customer Dismissible
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={topBarForm.dismissible}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, dismissible: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#111111]"></div>
                      <span className="ml-3 text-xs font-medium text-gray-700">
                        {topBarForm.dismissible ? "Show Close Button" : "Non-dismissible"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={handleCancelTopBar}
                    disabled={!hasTopBarChanges || isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Cancel Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTopBar}
                    disabled={!hasTopBarChanges || isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#111111] rounded hover:bg-black transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save & Publish Changes</span>
                  </button>
                </div>
              </div>

              {/* Top Bar Version History Section */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-base font-medium text-[#111111]">
                      Top Bar Version History
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Historical versions of the storefront announcement bar. Preview past versions or restore them directly to the live website.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Current Live: v{serverSettings?.version}</span>
                    </span>
                  </div>
                </div>

                {topBarHistory.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <History className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      No previous Top Bar versions recorded yet.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      History will appear after the first successful publication.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Version</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Announcement Text</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Administrator</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topBarHistory.map((item) => {
                          const isCurrentLive =
                            serverSettings && item.version === serverSettings.version;

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-gray-50/80 transition-colors ${
                                isCurrentLive ? "bg-emerald-50/20" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                v{item.version}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {isCurrentLive ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Current Live Version
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Previous Version
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 max-w-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded border border-gray-300 shrink-0"
                                    style={{ backgroundColor: item.snapshot.topBar.backgroundColor }}
                                    title={`Color: ${item.snapshot.topBar.backgroundColor}`}
                                  />
                                  <span className="text-gray-800 truncate font-medium">
                                    {item.snapshot.topBar.visible ? (
                                      `"${item.snapshot.topBar.text}"`
                                    ) : (
                                      <span className="text-gray-400 italic">Hidden on Storefront</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                  {new Date(item.createdAt).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                {item.createdBy || "admin@peralagae.com"}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end">
                                  {isCurrentLive ? (
                                    <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                                      Active Live
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setRestoreConfirmTarget({ item, section: "top_bar" })}
                                      disabled={isRestoring}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-gray-300 rounded transition disabled:opacity-40"
                                      title="Restore this Top Bar version"
                                    >
                                      <RotateCcw className="w-3 h-3 text-[#C5A572]" />
                                      <span>Restore</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ─── TAB 2: SECOND NAVBAR MANAGEMENT ─────────────────────────────── */}
        {activeTab === "second_navbar" && (
          <div className="mt-8 space-y-8">
            {/* Live Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#888888]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Live Storefront Preview
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {hasSecondNavbarChanges ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      Previewing Unsaved Changes
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Live Storefront Matches Preview
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Rendering Container */}
              <div
                className="w-full mx-auto transition-all duration-300 rounded overflow-hidden border border-gray-200 shadow-inner bg-white"
              >
                <div className="w-full border-b border-[#E5E5E5] bg-white text-xs lg:text-[13px] text-black">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
                    {/* Left Group */}
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1">
                      {secondNavbarForm.showPhone && secondNavbarForm.phone && (
                        <span className="font-normal text-black shrink-0">
                          {secondNavbarForm.phone}
                        </span>
                      )}

                      {secondNavbarForm.showPhone &&
                        secondNavbarForm.showPromotion &&
                        secondNavbarForm.promoText && (
                          <span className="h-3 w-px bg-[#E5E5E5] inline-block shrink-0" />
                        )}

                      {secondNavbarForm.showPromotion && secondNavbarForm.promoText && (
                        <span className="text-black inline-flex flex-wrap items-center gap-1.5 leading-snug">
                          <span>{secondNavbarForm.promoText}</span>
                          {secondNavbarForm.ctaText && (
                            <span className="font-semibold text-black underline cursor-pointer shrink-0">
                              {secondNavbarForm.ctaText}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Right Group (Links) */}
                    {secondNavbarForm.showLinks && secondNavbarForm.links.length > 0 && (
                      <div className="flex items-center space-x-6 text-black shrink-0">
                        {secondNavbarForm.links.map((link) => (
                          <span
                            key={link.id}
                            className="hover:opacity-75 transition-opacity cursor-pointer"
                          >
                            {link.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Form Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-medium text-[#111111] mb-5">
                Second Navbar Elements & Links
              </h2>

              <div className="space-y-6">
                {/* Phone & Promo Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone Settings */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="navbar-phone"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#333333]"
                      >
                        Contact Phone Number
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={secondNavbarForm.showPhone}
                          onChange={(e) =>
                            setSecondNavbarForm((prev) => ({
                              ...prev,
                              showPhone: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#111111]"></div>
                        <span className="ml-2 text-xs text-gray-500">Show Phone</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      id="navbar-phone"
                      value={secondNavbarForm.phone}
                      onChange={(e) =>
                        setSecondNavbarForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                      maxLength={30}
                    />

                    <div>
                      <label
                        htmlFor="navbar-phone-href"
                        className="block text-xs text-gray-500 mb-1"
                      >
                        Phone Link Destination
                      </label>
                      <input
                        type="text"
                        id="navbar-phone-href"
                        value={secondNavbarForm.phoneHref}
                        onChange={(e) =>
                          setSecondNavbarForm((prev) => ({ ...prev, phoneHref: e.target.value }))
                        }
                        placeholder="tel:+919876543210"
                        className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  {/* Promotional Message Settings */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="promo-text"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#333333]"
                      >
                        Promotional Message <span className="text-rose-500">*</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={secondNavbarForm.showPromotion}
                          onChange={(e) =>
                            setSecondNavbarForm((prev) => ({
                              ...prev,
                              showPromotion: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#111111]"></div>
                        <span className="ml-2 text-xs text-gray-500">Show Promo</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="promo-text"
                        value={secondNavbarForm.promoText}
                        onChange={(e) =>
                          setSecondNavbarForm((prev) => ({ ...prev, promoText: e.target.value }))
                        }
                        placeholder="Summer Sale 15% off!"
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                        maxLength={120}
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-gray-400">
                        {secondNavbarForm.promoText.length}/120
                      </span>
                    </div>

                    {secondNavbarForm.promoText.length > 80 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Long promotional text will wrap cleanly across breakpoints.</span>
                      </p>
                    )}

                    {/* CTA Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cta-label" className="block text-xs text-gray-500 mb-1">
                          CTA Label
                        </label>
                        <input
                          type="text"
                          id="cta-label"
                          value={secondNavbarForm.ctaText}
                          onChange={(e) =>
                            setSecondNavbarForm((prev) => ({ ...prev, ctaText: e.target.value }))
                          }
                          placeholder="Shop Now!"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                          maxLength={40}
                        />
                      </div>
                      <div>
                        <label htmlFor="cta-href" className="block text-xs text-gray-500 mb-1">
                          CTA URL
                        </label>
                        <input
                          type="text"
                          id="cta-href"
                          value={secondNavbarForm.ctaHref}
                          onChange={(e) =>
                            setSecondNavbarForm((prev) => ({ ...prev, ctaHref: e.target.value }))
                          }
                          placeholder="/shop"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Links Management */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#333333]">
                        Secondary Navigation Links
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add, reorder, edit, or remove secondary navigation items displayed on the right strip.
                      </p>
                    </div>

                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={secondNavbarForm.showLinks}
                        onChange={(e) =>
                          setSecondNavbarForm((prev) => ({
                            ...prev,
                            showLinks: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#111111]"></div>
                      <span className="ml-2 text-xs text-gray-500">Show Links Strip</span>
                    </label>
                  </div>

                  {/* Links Table / List */}
                  <div className="space-y-2 mb-4">
                    {secondNavbarForm.links.map((link, index) => (
                      <div
                        key={link.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded"
                      >
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveLink(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed rounded"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLink(index, "down")}
                            disabled={index === secondNavbarForm.links.length - 1}
                            className="p-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed rounded"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Label Input */}
                        <div className="flex-1 min-w-[140px]">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleUpdateLink(link.id, "label", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-black focus:border-black outline-none"
                            placeholder="Link label"
                            maxLength={50}
                          />
                        </div>

                        {/* URL Input */}
                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            value={link.href}
                            onChange={(e) => handleUpdateLink(link.id, "href", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded bg-white focus:ring-1 focus:ring-black focus:border-black outline-none"
                            placeholder="/#store-locator"
                          />
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmLinkId(link.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition shrink-0"
                          title="Remove Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Link Strip */}
                  <div className="p-3 bg-white border border-dashed border-gray-300 rounded flex flex-wrap sm:flex-nowrap items-center gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <input
                        type="text"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="New link label (e.g. Track Order)"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                        maxLength={50}
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="text"
                        value={newLinkHref}
                        onChange={(e) => setNewLinkHref(e.target.value)}
                        placeholder="Destination URL (e.g. /track-order)"
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-[#F5F5F5] hover:bg-gray-200 border border-gray-300 rounded transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelSecondNavbar}
                  disabled={!hasSecondNavbarChanges || isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Cancel Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSecondNavbar}
                  disabled={!hasSecondNavbarChanges || isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#111111] rounded hover:bg-black transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Publish Changes</span>
                </button>
              </div>
            </div>

            {/* Second Navbar Version History Section */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-base font-medium text-[#111111]">
                      Second Navbar Version History
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Historical versions of the secondary navigation strip. Preview past versions or restore them directly to the live website.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Current Live: v{serverSettings?.version}</span>
                    </span>
                  </div>
                </div>

                {secondNavbarHistory.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <History className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      No previous Second Navbar versions recorded yet.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      History will appear after the first successful publication.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Version</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Content Summary</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Administrator</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {secondNavbarHistory.map((item) => {
                          const isCurrentLive =
                            serverSettings && item.version === serverSettings.version;

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-gray-50/80 transition-colors ${
                                isCurrentLive ? "bg-emerald-50/20" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                v{item.version}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {isCurrentLive ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Current Live Version
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Previous Version
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 max-w-sm">
                                <div className="space-y-1">
                                  <div className="text-gray-800 font-medium truncate">
                                    {item.snapshot.secondNavbar.promoText ? (
                                      <span>&ldquo;{item.snapshot.secondNavbar.promoText}&rdquo;</span>
                                    ) : (
                                      <span className="text-gray-400 italic">No promotional text</span>
                                    )}
                                    {item.snapshot.secondNavbar.ctaText && (
                                      <span className="text-gray-500 text-[11px] ml-1">
                                        ({item.snapshot.secondNavbar.ctaText})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-2">
                                    {item.snapshot.secondNavbar.phone && (
                                      <span>Phone: {item.snapshot.secondNavbar.phone}</span>
                                    )}
                                    <span>•</span>
                                    <span>{item.snapshot.secondNavbar.links.length} secondary link(s)</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                  {new Date(item.createdAt).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                {item.createdBy || "admin@peralagae.com"}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end">
                                  {isCurrentLive ? (
                                    <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                                      Active Live
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setRestoreConfirmTarget({ item, section: "second_navbar" })}
                                      disabled={isRestoring}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-gray-300 rounded transition disabled:opacity-40"
                                      title="Restore this Second Navbar version"
                                    >
                                      <RotateCcw className="w-3 h-3 text-[#C5A572]" />
                                      <span>Restore</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ─── MODAL: CONFIRM RESTORE THIS VERSION ─────────────────────────── */}
        {restoreConfirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <div className="p-2 bg-amber-50 rounded-full border border-amber-200">
                  <RotateCcw className="w-5 h-5 shrink-0 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Restore This Version?
                </h3>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {`You are about to restore this previous version of the ${
                  restoreConfirmTarget.section === "top_bar" ? "Top Bar" : "Second Navbar"
                }. The selected content will replace the current published content on the live PERALAGAE website. Your current live version will be saved in history before the restoration.`}
              </p>

              <div className="mt-4 p-3.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-900 font-mono text-sm">
                    Version v{restoreConfirmTarget.item.version}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Published on{" "}
                    {new Date(restoreConfirmTarget.item.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {restoreConfirmTarget.section === "top_bar" && (
                  <div>
                    <span className="font-semibold text-gray-800">Top Bar Announcement: </span>
                    <span className="text-gray-600">
                      &ldquo;{restoreConfirmTarget.item.snapshot.topBar.text}&rdquo;
                    </span>
                  </div>
                )}

                {restoreConfirmTarget.section === "second_navbar" && (
                  <div>
                    <span className="font-semibold text-gray-800">Second Navbar Content: </span>
                    <span className="text-gray-600">
                      &ldquo;{restoreConfirmTarget.item.snapshot.secondNavbar.promoText}&rdquo;
                      {restoreConfirmTarget.item.snapshot.secondNavbar.phone
                        ? ` • Phone: ${restoreConfirmTarget.item.snapshot.secondNavbar.phone}`
                        : ""}
                    </span>
                  </div>
                )}

                {restoreConfirmTarget.item.createdBy && (
                  <div className="pt-1 text-[11px] text-gray-500 font-mono">
                    Administrator: {restoreConfirmTarget.item.createdBy}
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Your current live version (v{serverSettings?.version}) will be saved in history before the restoration.
                </span>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRestoreConfirmTarget(null)}
                  disabled={isRestoring}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#111111] hover:bg-black rounded transition shadow-sm disabled:opacity-40"
                >
                  {isRestoring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm & Publish</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ─── MODAL 3: CONFIRM DELETE LINK ──────────────────────────────────── */}
      {deleteConfirmLinkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-semibold text-gray-900">
                Remove Navigation Link?
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              This action will remove the navigation link from the Second Navbar. You must click &ldquo;Save & Publish Changes&rdquo; to apply this to the live website.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmLinkId(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLink}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition"
              >
                Remove Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
