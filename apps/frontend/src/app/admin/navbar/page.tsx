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
  const [topBarHistory, setTopBarHistory] = useState<NavbarHistoryItem[]>([]);
  const [secondNavbarHistory, setSecondNavbarHistory] = useState<NavbarHistoryItem[]>([]);
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

  // Second Navbar Form State — Promotional Message Only
  const [secondNavbarPromo, setSecondNavbarPromo] = useState("");

  // History & Restore Modal State
  const [restoreConfirmTarget, setRestoreConfirmTarget] = useState<{
    item: NavbarHistoryItem;
    section: "top_bar" | "second_navbar";
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

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

  // Load navbar settings and separate history streams
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [settings, topHistory, secondHistory] = await Promise.all([
        fetchAdminNavbarSettings(),
        fetchAdminNavbarHistory("top_bar"),
        fetchAdminNavbarHistory("second_navbar"),
      ]);
      setServerSettings(settings);
      setTopBarHistory(topHistory);
      setSecondNavbarHistory(secondHistory);

      // Populate Top Bar form
      setTopBarForm({ ...settings.topBar });

      // Populate Second Navbar promo message
      setSecondNavbarPromo(settings.secondNavbar.promoText);
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
    return secondNavbarPromo !== serverSettings.secondNavbar.promoText;
  }, [serverSettings, secondNavbarPromo]);

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
      const versionLabel = updated.topBarVersion ?? updated.version;
      setStatusMessage({
        type: "success",
        text: `Top Bar published successfully as v${versionLabel}! Storefront is now synchronized.`,
      });

      // Refresh Top Bar history only
      const newTopHistory = await fetchAdminNavbarHistory("top_bar");
      setTopBarHistory(newTopHistory);
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
    setSecondNavbarPromo(serverSettings.secondNavbar.promoText);
    setStatusMessage({ type: "info", text: "Second Navbar changes discarded." });
  };

  // Second Navbar Save — Promotional Message Only
  const handleSaveSecondNavbar = async () => {
    if (!secondNavbarPromo.trim()) {
      setStatusMessage({ type: "error", text: "Promotional message cannot be empty." });
      return;
    }
    if (secondNavbarPromo.length > 120) {
      setStatusMessage({ type: "error", text: "Promotional message must not exceed 120 characters." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAdminSecondNavbar({
        promoText: secondNavbarPromo.trim(),
      });

      setServerSettings(updated);
      setSecondNavbarPromo(updated.secondNavbar.promoText);
      const versionLabel = updated.secondNavbarVersion ?? updated.version;
      setStatusMessage({
        type: "success",
        text: `Second Navbar published successfully as v${versionLabel}! Storefront is now synchronized.`,
      });

      // Refresh Second Navbar history only
      const newSecondHistory = await fetchAdminNavbarHistory("second_navbar");
      setSecondNavbarHistory(newSecondHistory);
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

  // Version Restore Execution
  const handleExecuteRestore = async () => {
    if (!restoreConfirmTarget) return;

    setIsRestoring(true);
    try {
      const { item, section } = restoreConfirmTarget;
      const updated = await restoreAdminNavbarVersion(item.id, section);

      setServerSettings(updated);
      if (section === "top_bar") {
        setTopBarForm({ ...updated.topBar });
        const newTopHistory = await fetchAdminNavbarHistory("top_bar");
        setTopBarHistory(newTopHistory);
      } else {
        setSecondNavbarPromo(updated.secondNavbar.promoText);
        const newSecondHistory = await fetchAdminNavbarHistory("second_navbar");
        setSecondNavbarHistory(newSecondHistory);
      }

      const sectionTitle = section === "top_bar" ? "Top Bar" : "Second Navbar";
      const newVer = section === "top_bar" ? (updated.topBarVersion ?? updated.version) : (updated.secondNavbarVersion ?? updated.version);
      setStatusMessage({
        type: "success",
        text: `Version ${item.version} of the ${sectionTitle} successfully restored and published as v${newVer}! Storefront is now synchronized.`,
      });

      queryClient.invalidateQueries({ queryKey: NAVBAR_SETTINGS_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(NAVBAR_SETTINGS_UPDATED_EVENT));
      }
      setRestoreConfirmTarget(null);
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
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <p className="text-sm font-medium text-gray-600">Loading Navbar Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans">
      {/* Top Navigation */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Sidebar Navigation */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 transition-all">
        {/* Page Title & Breadcrumb Header */}
        <div className="mb-5 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Navbar</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111]">
              Navbar Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage the storefront announcement bar and secondary navigation bar with live previews and independent version histories.
            </p>
          </div>
        </div>

        {/* Global Status Banner */}
        {statusMessage && (
          <div
            className={`mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-lg flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-sm transition-all duration-300 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              {statusMessage.type === "success" && (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              )}
              {statusMessage.type === "error" && (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              )}
              {statusMessage.type === "info" && (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <span className="font-medium break-words leading-relaxed">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 transition p-1 shrink-0 -mr-1 -mt-1 sm:mt-0"
            >
              &times;
            </button>
          </div>
        )}

        {/* Section Tabs: Horizontally scrollable on mobile */}
        <div className="border-b border-[#E5E7EB] -mx-3.5 px-3.5 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-5 sm:space-x-8 min-w-max pb-px" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab("top_bar")}
              className={`py-3 sm:py-3.5 px-1 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "top_bar"
                  ? "border-black text-black font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>Top Bar (Announcement)</span>
              {hasTopBarChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("second_navbar")}
              className={`py-3 sm:py-3.5 px-1 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "second_navbar"
                  ? "border-black text-black font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>Second Navbar</span>
              {hasSecondNavbarChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
              )}
            </button>
          </nav>
        </div>

        {/* ─── TAB 1: TOP BAR MANAGEMENT ───────────────────────────────────── */}
        {activeTab === "top_bar" && (
          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {/* Live Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#888888]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Live Storefront Preview
                  </span>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
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
              <div className="w-full mx-auto transition-all duration-300 rounded overflow-hidden border border-gray-200 shadow-inner">
                {topBarForm.visible ? (
                  <div
                    className="w-full py-2 sm:py-2.5 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center transition-colors duration-200 relative break-words"
                    style={{
                      backgroundColor: topBarForm.backgroundColor,
                      color: topBarForm.textColor,
                    }}
                  >
                    <span className="max-w-2xl px-5 sm:px-2 leading-relaxed">{topBarForm.text || "Your announcement message here..."}</span>
                    {topBarForm.dismissible && (
                      <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 opacity-60 text-base cursor-pointer p-1">
                        &times;
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 italic">
                    Top Bar is currently hidden from the storefront (Visibility Toggle: Off)
                  </div>
                )}
              </div>
            </div>

            {/* Editor Form Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-base font-medium text-[#111111]">
                  Top Bar Announcement Settings
                </h2>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* Announcement Text Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="topbar-text"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333]"
                    >
                      Announcement Text <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400 font-mono">
                      {topBarForm.text.length}/250
                    </span>
                  </div>
                  <textarea
                    id="topbar-text"
                    rows={2}
                    value={topBarForm.text}
                    onChange={(e) => setTopBarForm((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="e.g. SUMMER SALE, Get 40% Off for all products."
                    className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition"
                    maxLength={250}
                  />
                  {topBarForm.text.trim().length === 0 && (
                    <p className="text-xs text-rose-500 mt-1">Announcement text cannot be empty.</p>
                  )}
                </div>

                {/* Styling Options: Colors & Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  {/* Background Color */}
                  <div>
                    <label
                      htmlFor="topbar-bg-color"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                    >
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="topbar-bg-color"
                        value={topBarForm.backgroundColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={topBarForm.backgroundColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label
                      htmlFor="topbar-text-color"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333] mb-1.5"
                    >
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="topbar-text-color"
                        value={topBarForm.textColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={topBarForm.textColor}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex flex-col justify-end pt-1 sm:pt-0">
                    <label className="flex items-center cursor-pointer gap-2.5 py-1">
                      <input
                        type="checkbox"
                        checked={topBarForm.visible}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, visible: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      <span className="text-xs font-medium text-gray-800">Show on Storefront</span>
                    </label>
                  </div>

                  {/* Dismissible Toggle */}
                  <div className="flex flex-col justify-end pt-1 sm:pt-0">
                    <label className="flex items-center cursor-pointer gap-2.5 py-1">
                      <input
                        type="checkbox"
                        checked={topBarForm.dismissible}
                        onChange={(e) =>
                          setTopBarForm((prev) => ({ ...prev, dismissible: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      <span className="text-xs font-medium text-gray-800">Dismissible Close (x)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Responsive mobile stacking */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCancelTopBar}
                  disabled={!hasTopBarChanges || isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Cancel Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTopBar}
                  disabled={!hasTopBarChanges || isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 text-xs font-medium text-white bg-[#111111] rounded hover:bg-black transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h2 className="text-base font-medium text-[#111111]">
                    Top Bar Version History
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Historical versions of the announcement bar. Restore past versions directly to the live website.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Current Live: v{serverSettings?.topBarVersion ?? 1}</span>
                  </span>
                </div>
              </div>

              {topBarHistory.length === 0 ? (
                <div className="py-10 sm:py-12 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <History className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    No previous Top Bar versions recorded yet.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    History will appear after the first successful publication.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3 sm:px-4">Version</th>
                        <th className="py-3 px-3 sm:px-4">Status</th>
                        <th className="py-3 px-3 sm:px-4">Announcement Text</th>
                        <th className="py-3 px-3 sm:px-4">Date & Time</th>
                        <th className="py-3 px-3 sm:px-4">Administrator</th>
                        <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topBarHistory.map((item) => {
                        const isCurrentLive =
                          serverSettings && item.version === (serverSettings.topBarVersion ?? 1);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50/80 transition-colors ${
                              isCurrentLive ? "bg-emerald-50/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-3 sm:px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                              v{item.version}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
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
                            <td className="py-3.5 px-3 sm:px-4 max-w-xs sm:max-w-sm">
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
                            <td className="py-3.5 px-3 sm:px-4 text-gray-600 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                {new Date(item.createdAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                              {item.createdBy || "admin@peralagae.com"}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
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
          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {/* Live Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#888888]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Live Storefront Preview
                  </span>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
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

              {/* Preview Rendering Container: Shows full storefront second navbar with live promoText */}
              <div className="w-full mx-auto transition-all duration-300 rounded overflow-hidden border border-gray-200 shadow-inner bg-white">
                <div className="w-full border-b border-[#E5E5E5] bg-white text-xs lg:text-[13px] text-black">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-x-4 gap-y-2 px-3 sm:px-4 py-2 sm:py-2.5">
                    {/* Left Group */}
                    <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-5 gap-y-1.5 min-w-0">
                      {serverSettings?.secondNavbar.showPhone && serverSettings?.secondNavbar.phone && (
                        <span className="font-normal text-black shrink-0 text-[11px] sm:text-xs lg:text-[13px]">
                          {serverSettings.secondNavbar.phone}
                        </span>
                      )}

                      {serverSettings?.secondNavbar.showPhone &&
                        serverSettings?.secondNavbar.showPromotion &&
                        secondNavbarPromo && (
                          <span className="h-3 w-px bg-[#E5E5E5] inline-block shrink-0" />
                        )}

                      {serverSettings?.secondNavbar.showPromotion && secondNavbarPromo && (
                        <span className="text-black inline-flex flex-wrap items-center gap-1.5 leading-snug break-words text-[11px] sm:text-xs lg:text-[13px]">
                          <span className="break-words">{secondNavbarPromo}</span>
                          {serverSettings?.secondNavbar.ctaText && (
                            <span className="font-semibold text-black underline cursor-pointer shrink-0">
                              {serverSettings.secondNavbar.ctaText}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Right Group (Secondary Links: hidden on xs mobile, matching storefront utility bar) */}
                    {serverSettings?.secondNavbar.showLinks && (serverSettings?.secondNavbar.links.length ?? 0) > 0 && (
                      <div className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-black shrink-0 text-xs lg:text-[13px]">
                        {serverSettings?.secondNavbar.links.map((link) => (
                          <span
                            key={link.id}
                            className="hover:opacity-75 transition-opacity cursor-pointer whitespace-nowrap"
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

            {/* Editor Form Card: Promotional Message ONLY */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="mb-4 sm:mb-5">
                <h2 className="text-base font-medium text-[#111111]">
                  Second Navbar Promotional Message
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Edit the promotional message displayed on the storefront secondary navigation strip. Other elements such as contact phone, CTA, and secondary links continue to render from their configured values.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="promo-text"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#333333]"
                    >
                      Promotional Message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400 font-mono">
                      {secondNavbarPromo.length}/120
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="promo-text"
                      value={secondNavbarPromo}
                      onChange={(e) => setSecondNavbarPromo(e.target.value)}
                      placeholder="e.g. Summer Sale 15% off!"
                      className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 pr-16 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition"
                      maxLength={120}
                    />
                  </div>

                  {secondNavbarPromo.trim().length === 0 && (
                    <p className="text-xs text-rose-500 mt-1">
                      Promotional message cannot be empty.
                    </p>
                  )}

                  {secondNavbarPromo.length > 80 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Long promotional text will wrap cleanly across breakpoints on the storefront.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Responsive mobile stacking */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCancelSecondNavbar}
                  disabled={!hasSecondNavbarChanges || isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Cancel Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSecondNavbar}
                  disabled={!hasSecondNavbarChanges || isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 text-xs font-medium text-white bg-[#111111] rounded hover:bg-black transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h2 className="text-base font-medium text-[#111111]">
                    Second Navbar Version History
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Historical versions of the Second Navbar promotional message. Restore past versions directly to the live website.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Current Live: v{serverSettings?.secondNavbarVersion ?? 1}</span>
                  </span>
                </div>
              </div>

              {secondNavbarHistory.length === 0 ? (
                <div className="py-10 sm:py-12 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <History className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    No previous Second Navbar versions recorded yet.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    History will appear after the first successful publication.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[580px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3 sm:px-4">Version</th>
                        <th className="py-3 px-3 sm:px-4">Status</th>
                        <th className="py-3 px-3 sm:px-4">Content Summary</th>
                        <th className="py-3 px-3 sm:px-4">Date & Time</th>
                        <th className="py-3 px-3 sm:px-4">Administrator</th>
                        <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {secondNavbarHistory.map((item) => {
                        const isCurrentLive =
                          serverSettings && item.version === (serverSettings.secondNavbarVersion ?? 1);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50/80 transition-colors ${
                              isCurrentLive ? "bg-emerald-50/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-3 sm:px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                              v{item.version}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
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
                            <td className="py-3.5 px-3 sm:px-4 max-w-xs sm:max-w-sm">
                              <div className="text-gray-800 font-medium truncate">
                                {item.snapshot.secondNavbar.promoText ? (
                                  <span>&ldquo;{item.snapshot.secondNavbar.promoText}&rdquo;</span>
                                ) : (
                                  <span className="text-gray-400 italic">No promotional text</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-gray-600 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                {new Date(item.createdAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                              {item.createdBy || "admin@peralagae.com"}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
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

      {/* ─── MODAL: CONFIRM RESTORE THIS VERSION (Responsive Drawer/Modal) ─── */}
      {restoreConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-full border border-amber-200 shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Restore This Version?
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {`You are about to restore this previous version of the ${
                restoreConfirmTarget.section === "top_bar" ? "Top Bar" : "Second Navbar"
              }. The selected ${
                restoreConfirmTarget.section === "top_bar" ? "announcement" : "promotional message"
              } will replace the current published content on the live PERALAGAE website. Your current live version will be saved in history before the restoration.`}
            </p>

            <div className="mt-4 p-3.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200 gap-1">
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
                  <span className="font-semibold text-gray-800">Promotional Message: </span>
                  <span className="text-gray-600">
                    &ldquo;{restoreConfirmTarget.item.snapshot.secondNavbar.promoText}&rdquo;
                  </span>
                </div>
              )}

              {restoreConfirmTarget.item.createdBy && (
                <div className="pt-1 text-[11px] text-gray-500 font-mono">
                  Administrator: {restoreConfirmTarget.item.createdBy}
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 flex items-start sm:items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed">
                Your current live version (v{
                  restoreConfirmTarget.section === "top_bar"
                    ? (serverSettings?.topBarVersion ?? 1)
                    : (serverSettings?.secondNavbarVersion ?? 1)
                }) will be saved in history before the restoration.
              </span>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setRestoreConfirmTarget(null)}
                disabled={isRestoring}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-40 text-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-medium text-white bg-[#111111] hover:bg-black rounded transition shadow-sm disabled:opacity-40"
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
    </div>
  );
}
