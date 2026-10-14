"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { getAdminSession, logoutAdmin, type AdminUser } from "@/services/admin-auth-service";
import { brandConfig } from "@/config/brand";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Authenticate session on initial load
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      try {
        const session = await getAdminSession();
        if (isMounted) {
          setAdmin(session);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          router.replace("/admin/login");
        }
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
    } finally {
      router.replace("/admin/login");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <p className="text-xs uppercase tracking-widest text-[#777777] font-medium">
            Verifying Admin Authentication...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111111]">
      {/* Top Admin Bar */}
      <header className="w-full bg-white border-b border-[#EAE6DF] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-xl font-semibold tracking-[0.18em] uppercase font-jost text-[#111111]">
              {brandConfig.name}
            </span>
            <span className="text-[10px] uppercase tracking-widest bg-[#FAF8F5] border border-[#EAE6DF] text-[#777777] px-2.5 py-0.5 font-medium">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#666666]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>{admin?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#D5D0C7] text-xs font-medium uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white transition-colors duration-200 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Minimal Protected Admin Dashboard Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="border border-[#EAE6DF] bg-white p-8 sm:p-12 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-[#111111] font-jost">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-sm text-[#444444] leading-relaxed">
            Welcome back, <span className="font-semibold text-black">{admin?.email}</span>. You are securely authenticated with administrative privileges.
          </p>

          <p className="mt-1 text-xs text-[#888888]">
            Phase 1 authentication complete. Business modules, product management, and platform configurations will be provisioned in future phases.
          </p>

          {/* Intentionally completely empty remaining content area as required */}
          <div className="mt-12 pt-8 border-t border-dashed border-[#EAE6DF] text-center text-xs text-[#AAAAAA] uppercase tracking-widest">
            — Empty Protected Workspace —
          </div>
        </div>
      </main>
    </div>
  );
}
