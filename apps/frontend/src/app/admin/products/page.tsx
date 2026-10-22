"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { fetchAdminCategories } from "@/services/category-admin-service";
import {
  fetchAdminProducts,
  deleteAdminProduct,
  PRODUCTS_UPDATED_EVENT,
  PRODUCTS_ADMIN_QUERY_KEY,
} from "@/services/product-admin-service";
import type { Product } from "@/types/product";
import type { CategoryItem } from "@/types/category";
import { useNotification } from "@/providers/storefront-provider";

export default function AdminProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notify = useNotification();

  // Authentication & Layout
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Products Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Status Feedback
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Delete Action Modal
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verify Admin Session on Mount
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

  // Load Categories for Filter Dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const cats = await fetchAdminCategories();
        if (isMounted) setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories for filter", err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Products from MongoDB via API
  const loadProducts = async (page = 1) => {
    try {
      setIsLoading(true);
      const params: Parameters<typeof fetchAdminProducts>[0] = {
        page,
        pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (selectedStockStatus === "in_stock") {
        params.inStock = true;
      } else if (selectedStockStatus === "out_of_stock") {
        params.inStock = false;
      }

      const res = await fetchAdminProducts(params);
      setProducts(res.products);
      setTotalCount(res.total);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages || Math.ceil(res.total / pageSize) || 1);
    } catch (err: any) {
      console.error("Failed to fetch admin products", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to load products from database.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isVerifying) {
      loadProducts(1);
    }
  }, [isVerifying, selectedCategory, selectedStockStatus]);

  // Listen to cross-component product updates
  useEffect(() => {
    const handleProductsUpdated = () => {
      loadProducts(currentPage);
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    };
  }, [currentPage]);

  // Handle Logout
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

  // Dedicated Page Routing Handlers
  const handleOpenAddPage = () => {
    router.push("/admin/products/new");
  };

  const handleOpenEditPage = (product: Product) => {
    router.push(`/admin/products/${encodeURIComponent(product.id)}/edit`);
  };

  // Delete Product Workflow with Database Persistence
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setIsDeleting(true);
      setStatusMessage(null);

      await deleteAdminProduct(deletingProduct.id);

      setStatusMessage({
        type: "success",
        text: `"${deletingProduct.name}" has been permanently removed from the catalogue.`,
      });
      notify.success("Product removed", {
        description: `"${deletingProduct.name}" has been deleted.`,
      });

      setDeletingProduct(null);

      // Invalidate and reload
      queryClient.invalidateQueries({ queryKey: PRODUCTS_ADMIN_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
      }
      const nextTotal = totalCount - 1;
      const nextMaxPage = Math.ceil(nextTotal / pageSize) || 1;
      const targetPage = currentPage > nextMaxPage ? nextMaxPage : currentPage;
      await loadProducts(targetPage);
    } catch (err: any) {
      console.error("Failed to delete product", err);
      const errorMsg = err?.message || "Failed to delete product from database.";
      setStatusMessage({
        type: "error",
        text: errorMsg,
      });
      notify.error("Delete failed", {
        description: errorMsg,
      });
    } finally {
      setIsDeleting(false);
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

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          data-testid="admin-status-banner"
          className={`fixed top-20 right-6 z-50 max-w-md w-full p-4 rounded shadow-lg border transition-all duration-300 flex items-start gap-3 ${
            statusMessage.type === "success"
              ? "bg-[#F0FDF4] border-[#86EFAC] text-[#166534]"
              : statusMessage.type === "error"
              ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
              : "bg-[#F0F9FF] border-[#BAE6FD] text-[#075985]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16A34A] mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
            {statusMessage.text}
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[#888888] hover:text-black p-1 -mr-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header with Title and Dedicated Add Product Route Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 sm:pb-6 border-b border-[#EAEAEA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C5A572]">
                Catalogue Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#111111] mt-1 font-serif">
              Products
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#666666]">
              Manage fine jewellery pieces, pricing, imagery, inventory status, and specifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => loadProducts(currentPage)}
              disabled={isLoading}
              className="p-2.5 text-[#666666] hover:text-black hover:bg-white border border-[#E5E7EB] rounded transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
              title="Refresh Products"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={handleOpenAddPage}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111111] text-white hover:bg-[#C5A572] transition-colors rounded text-xs uppercase tracking-wider font-medium shadow-sm min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 bg-white border border-[#EAEAEA] rounded shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadProducts(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 sm:py-2 text-base sm:text-xs border border-[#E5E7EB] rounded focus:outline-none focus:ring-1 focus:ring-[#C5A572] bg-white placeholder:text-[#999999]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  loadProducts(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category & Stock Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666666] font-medium uppercase tracking-wider shrink-0 sm:hidden md:inline">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 sm:py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#C5A572]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666666] font-medium uppercase tracking-wider shrink-0 sm:hidden md:inline">
                Stock:
              </span>
              <select
                value={selectedStockStatus}
                onChange={(e) =>
                  setSelectedStockStatus(e.target.value as "all" | "in_stock" | "out_of_stock")
                }
                className="w-full px-3 py-2 sm:py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#C5A572]"
              >
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadProducts(1)}
              className="w-full px-4 py-2 sm:py-1.5 text-xs uppercase tracking-wider font-semibold text-black bg-[#F5F5F5] hover:bg-[#EAEAEA] rounded transition-colors text-center min-h-[36px] sm:min-h-0 flex items-center justify-center"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Product Count Indicator */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#777777] px-1">
          <span>
            Showing <strong className="text-black">{products.length}</strong> of{" "}
            <strong className="text-black">{totalCount}</strong> products
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Products Table */}
        <div className="mt-3 bg-white border border-[#EAEAEA] rounded shadow-xs overflow-hidden">
          {/* Mobile Table Swipe Indicator */}
          <div className="sm:hidden px-3.5 py-2 bg-[#FAFAFA] border-b border-[#EAEAEA] text-[11px] text-[#777777] flex items-center justify-between">
            <span className="font-medium">Scroll table horizontally to view actions</span>
            <span className="font-semibold text-[#C5A572] text-xs">⟷</span>
          </div>
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
              <p className="text-xs uppercase tracking-widest text-[#888888] font-medium">
                Loading jewellery catalogue from database...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#EBDCC2] flex items-center justify-center text-[#C5A572] mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-[#111111]">No products found</h3>
              <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "all" || selectedStockStatus !== "all"
                  ? "No products matched your search or category filter. Try clearing filters."
                  : "Your product catalogue is empty. Click below to add your first fine jewellery piece."}
              </p>
              <button
                type="button"
                onClick={handleOpenAddPage}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white hover:bg-[#C5A572] rounded text-xs uppercase tracking-wider font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Product</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#EAEAEA] bg-[#FDFDFD] text-[11px] uppercase tracking-wider text-[#777777]">
                    <th className="py-3.5 px-4 w-16">Image</th>
                    <th className="py-3.5 px-4">Product Name &amp; Slug</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price (INR)</th>
                    <th className="py-3.5 px-4">Availability</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-xs">
                  {products.map((product) => {
                    const primaryImage =
                      product.images && product.images.length > 0
                        ? product.images[0]?.src
                        : product.image?.src;

                    return (
                      <tr
                        key={product.id}
                        data-testid={`product-row-${product.id}`}
                        className="hover:bg-[#FBFBFA] transition-colors"
                      >
                        {/* Image Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded border border-[#EAEAEA] overflow-hidden bg-[#F5F5F5] relative flex items-center justify-center shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/images/collections/collection-necklaces.jpg";
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#AAAAAA]" />
                            )}
                          </div>
                        </td>

                        {/* Product Title & Slug */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111111] line-clamp-1">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-[#888888] font-mono mt-0.5">
                            /{product.slug}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {product.isHot && (
                              <span className="px-1.5 py-0.5 text-[9px] uppercase font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] rounded">
                                HOT
                              </span>
                            )}
                            {product.isNew && (
                              <span className="px-1.5 py-0.5 text-[9px] uppercase font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC] rounded">
                                NEW
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-medium tracking-wide bg-[#F4F4F5] text-[#3F3F46]">
                            {product.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111111]">
                            ₹{product.priceInr.toLocaleString("en-IN")}
                          </div>
                          {product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr && (
                            <div className="text-[11px] text-[#888888] line-through">
                              ₹{product.compareAtPriceInr.toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>

                        {/* Availability */}
                        <td className="py-3 px-4">
                          {product.inStock !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              In Stock ({product.stockCount ?? 10})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                              Out of Stock
                            </span>
                          )}
                        </td>

                        {/* Actions (Dedicated Page Navigation & Delete Modal) */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              data-testid={`edit-product-${product.id}`}
                              onClick={() => handleOpenEditPage(product)}
                              className="p-2 sm:p-1.5 text-[#555555] hover:text-[#C5A572] hover:bg-[#FAF7F2] rounded transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center border border-transparent hover:border-[#EAEAEA]"
                              title="Edit Product"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              data-testid={`delete-product-${product.id}`}
                              onClick={() => setDeletingProduct(product)}
                              className="p-2 sm:p-1.5 text-[#555555] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center border border-transparent hover:border-[#FCA5A5]"
                              title="Delete Product"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-[#EAEAEA] bg-[#FDFDFD] flex items-center justify-between">
              <span className="text-xs text-[#666666]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => loadProducts(currentPage - 1)}
                  className="p-1.5 border border-[#E5E7EB] rounded text-[#555555] hover:text-black hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => loadProducts(pageNum)}
                    className={`w-7 h-7 text-xs font-medium rounded transition-colors ${
                      pageNum === currentPage
                        ? "bg-[#111111] text-white"
                        : "text-[#555555] hover:bg-[#F5F5F5] border border-transparent"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => loadProducts(currentPage + 1)}
                  className="p-1.5 border border-[#E5E7EB] rounded text-[#555555] hover:text-black hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded border border-[#E5E5E5] shadow-2xl max-w-md w-full p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-medium text-[#111111]">
                  Delete Fine Jewellery Piece?
                </h3>
                <p className="text-xs text-[#888888]">This action cannot be reversed.</p>
              </div>
            </div>

            <div className="p-3 bg-[#FAF7F2] border border-[#EBDCC2] rounded text-xs text-[#55554D] flex items-center gap-3">
              <div className="w-10 h-10 rounded overflow-hidden bg-white shrink-0 border border-[#EAEAEA]">
                <img
                  src={
                    deletingProduct.images?.[0]?.src ||
                    deletingProduct.image?.src ||
                    "/images/collections/collection-necklaces.jpg"
                  }
                  alt={deletingProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 truncate">
                <div className="font-semibold text-black truncate">{deletingProduct.name}</div>
                <div className="text-[11px] text-[#777777]">
                  ₹{deletingProduct.priceInr.toLocaleString("en-IN")} • {deletingProduct.category}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Are you sure you want to delete this product from MongoDB? It will be
              immediately removed from the storefront catalogue and search indexing.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEEEEE]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#555555] hover:text-black hover:bg-[#F5F5F5] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider bg-[#DC2626] text-white hover:bg-[#B91C1C] rounded transition-colors shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
