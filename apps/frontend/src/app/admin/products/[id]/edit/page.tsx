"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { fetchAdminProductById } from "@/services/product-admin-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import type { Product } from "@/types/product";

function EditProductContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.["id"];
  const productId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verifyAuthAndLoadProduct() {
      try {
        await getAdminSession();

        if (!productId) {
          setErrorMessage("No product identifier was provided in the route.");
          setIsLoadingProduct(false);
          return;
        }

        setIsLoadingProduct(true);
        const data = await fetchAdminProductById(productId);
        if (isMounted) {
          setProduct(data);
          setErrorMessage(null);
        }
      } catch (err: any) {
        console.error("Failed to load product for editing", err);
        if (isMounted) {
          setErrorMessage(
            err?.message || `Failed to locate product "${productId}" in the database.`
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
          setIsLoadingProduct(false);
        }
      }
    }

    verifyAuthAndLoadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId, router]);

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

  if (isVerifying || isLoadingProduct) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <span className="text-xs uppercase tracking-widest text-[#777777] font-medium">
            Loading Product from MongoDB...
          </span>
        </div>
      </main>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#1A1A1A]">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <AdminNavbar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#DC2626] mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-medium text-[#111111]">Product Not Found</h2>
          <p className="text-xs text-[#666666] mt-2 max-w-md mx-auto leading-relaxed">
            {errorMessage || "The requested product does not exist in the database or may have been deleted."}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white hover:bg-[#C5A572] rounded text-xs uppercase tracking-wider font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Products Catalogue</span>
            </Link>
          </div>
        </main>
      </div>
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
        <ProductEditorForm mode="edit" initialProduct={product} />
      </main>
    </div>
  );
}

export default function AdminEditProductPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
            <span className="text-xs uppercase tracking-widest text-[#777777] font-medium">
              Initializing Product Editor...
            </span>
          </div>
        </main>
      }
    >
      <EditProductContent />
    </Suspense>
  );
}
