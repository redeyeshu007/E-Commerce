"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ProductEditorForm } from "@/components/admin/product-editor-form";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      try {
        await getAdminSession();
        if (isMounted) setIsVerifying(false);
      } catch (err) {
        console.error("Auth verification failed", err);
        if (isMounted) router.replace("/admin/login");
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAdmin();
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <span className="text-xs uppercase tracking-widest text-[#777777] font-medium">
            Verifying Admin Credentials...
          </span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#1A1A1A]">
      {/* Slide-out Navigation Drawer */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Admin Navbar */}
      <AdminNavbar
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Dedicated Full-Page Product Editor */}
      <main className="flex-1">
        <ProductEditorForm mode="create" />
      </main>
    </div>
  );
}
