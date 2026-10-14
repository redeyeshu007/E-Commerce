"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";

/**
 * Minimal Admin Dashboard Shell
 *
 * Requirements:
 * - Minimal white-and-neutral visual design
 * - White page background, dark charcoal text, subtle light-grey divider
 * - Simple top navbar containing only brand, ADMIN label, and Logout
 * - Content area containing only the heading and subtle supporting line
 * - Rest of dashboard content area left completely empty (no KPI widgets, cards, tables, or charts)
 * - Session verification on load; redirects to /admin/login if unauthenticated
 */
export default function AdminDashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Authenticate session on initial load
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      try {
        await getAdminSession();
        if (isMounted) {
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          router.replace("/?auth=login");
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
      router.replace("/?auth=login");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C5A572]" />
          <p className="text-xs uppercase tracking-widest text-[#888888] font-medium">
            Verifying Admin Authentication...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1A1A1A]">
      {/* Minimal Top Admin Navbar */}
      <AdminNavbar onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      {/* Minimal Admin Dashboard Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#1A1A1A]">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-[#666666]">
          Welcome to the PERALAGAE administration panel.
        </p>

        {/* Intentionally completely empty remaining content area — full KPI dashboard deferred to final phase */}
      </main>
    </div>
  );
}
