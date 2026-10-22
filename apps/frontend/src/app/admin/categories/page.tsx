"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { getAdminSession, logoutAdmin } from "@/services/admin-auth-service";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  reorderAdminCategories,
  deleteAdminCategory,
  uploadAdminCategoryImage,
} from "@/services/category-admin-service";
import {
  CATEGORIES_QUERY_KEY,
  CATEGORIES_UPDATED_EVENT,
} from "@/services/category-public-service";
import type { CategoryItem } from "@/types/category";
import { useNotification } from "@/providers/storefront-provider";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notify = useNotification();

  // Authentication & Layout state
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Categories Data state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Add Category Form State (Category Name, Image, Order, Active only)
  const [addName, setAddName] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addOrder, setAddOrder] = useState<number>(0);
  const [addIsActive, setAddIsActive] = useState(true);
  const [isUploadingAddImage, setIsUploadingAddImage] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Category Form State (Category Name, Image, Order, Active only)
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editOrder, setEditOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);


  // Deletion State
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load categories",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Admin Session on mount
  useEffect(() => {
    let isMounted = true;
    async function verify() {
      try {
        await getAdminSession();
        if (isMounted) {
          setIsVerifying(false);
          loadCategories();
        }
      } catch {
        if (isMounted) {
          router.replace("/?auth=login");
        }
      }
    }
    verify();
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

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Open Add Category Modal
  const handleOpenAddModal = () => {
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 1;
    setAddName("");
    setAddImageUrl("");
    setAddOrder(nextOrder);
    setAddIsActive(true);
    setIsAddModalOpen(true);
  };

  // Add Category Name change handler
  const handleAddNameChange = (val: string) => {
    setAddName(val);
  };

  // Handle Image Upload for Add
  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image file exceeds 5MB size limit." });
      return;
    }

    setIsUploadingAddImage(true);
    try {
      const res = await uploadAdminCategoryImage(file);
      setAddImageUrl(res.url);
      setStatusMessage({ type: "success", text: "Category image uploaded successfully." });
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload image.",
      });
    } finally {
      setIsUploadingAddImage(false);
    }
  };

  // Submit Add Category (Slug is auto-generated strictly from name)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setStatusMessage({ type: "error", text: "Category name is required." });
      return;
    }
    if (!addImageUrl.trim()) {
      setStatusMessage({ type: "error", text: "Category image is required." });
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const autoSlug = slugify(addName);
      const created = await createAdminCategory({
        name: addName.trim(),
        slug: autoSlug,
        imageUrl: addImageUrl.trim(),
        order: addOrder,
        isActive: addIsActive,
      });

      setCategories((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      setIsAddModalOpen(false);
      const successText = `Category "${created.name}" created successfully with slug /${created.slug}.`;
      setStatusMessage({
        type: "success",
        text: successText,
      });
      notify.success("Category created", { description: `"${created.name}" created.` });

      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to create category.";
      setStatusMessage({
        type: "error",
        text: errText,
      });
      notify.error("Creation failed", { description: errText });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditImageUrl(cat.imageUrl);
    setEditOrder(cat.order);
    setEditIsActive(cat.isActive);
  };

  // Handle Image Upload for Edit
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image file exceeds 5MB size limit." });
      return;
    }

    setIsUploadingEditImage(true);
    try {
      const res = await uploadAdminCategoryImage(file);
      setEditImageUrl(res.url);
      setStatusMessage({ type: "success", text: "New category image uploaded successfully." });
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload image.",
      });
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  // Submit Edit Category (Slug is auto-generated strictly from name)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editName.trim()) {
      setStatusMessage({ type: "error", text: "Category name cannot be empty." });
      return;
    }
    if (!editImageUrl.trim()) {
      setStatusMessage({ type: "error", text: "Category image cannot be empty." });
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const autoSlug = slugify(editName);
      const updated = await updateAdminCategory(editingCategory.id, {
        name: editName.trim(),
        slug: autoSlug,
        imageUrl: editImageUrl.trim(),
        order: editOrder,
        isActive: editIsActive,
      });

      setCategories((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.order - b.order)
      );
      setEditingCategory(null);
      const updateSuccessText = `Category "${updated.name}" updated successfully. Associated products preserved.`;
      setStatusMessage({
        type: "success",
        text: updateSuccessText,
      });
      notify.success("Category updated", { description: `"${updated.name}" updated.` });

      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
      }
    } catch (err: unknown) {
      const updateErrText = err instanceof Error ? err.message : "Failed to update category.";
      setStatusMessage({
        type: "error",
        text: updateErrText,
      });
      notify.error("Update failed", { description: updateErrText });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Move Category Up
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const reordered = [...categories];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;

    setCategories(reordered);
    try {
      const result = await reorderAdminCategories(reordered.map((c) => c.id));
      setCategories(result);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save category order.",
      });
      loadCategories();
    }
  };

  // Move Category Down
  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1) return;
    const reordered = [...categories];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;

    setCategories(reordered);
    try {
      const result = await reorderAdminCategories(reordered.map((c) => c.id));
      setCategories(result);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save category order.",
      });
      loadCategories();
    }
  };

  // Confirm Delete Category & Associated Products
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    try {
      const res = await deleteAdminCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setDeletingCategory(null);
      const deleteSuccessText = `Category "${res.deletedCategory.name}" and all ${res.deletedProductCount} associated products permanently deleted.`;
      setStatusMessage({
        type: "success",
        text: deleteSuccessText,
      });
      notify.success("Category deleted", { description: `"${res.deletedCategory.name}" removed.` });

      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
      }
    } catch (err: unknown) {
      const delErrText = err instanceof Error ? err.message : "Failed to delete category.";
      setStatusMessage({
        type: "error",
        text: delErrText,
      });
      notify.error("Delete failed", { description: delErrText });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isVerifying || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A572]" />
          <p className="text-sm font-medium text-gray-600">Loading Category Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans text-[#111111]">
      {/* Top Navigation */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Sidebar Navigation */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 transition-all">
        {/* Page Title & Breadcrumb Header */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Categories</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111]">
                Category Management
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#F5F5F5] text-gray-700 border border-gray-200">
                {categories.length} Categories
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage product categories, organize display order, upload category imagery, and monitor associated product catalogues.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider bg-[#C5A572] hover:bg-[#B39360] text-white rounded transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Global Status Banner */}
        {statusMessage && (
          <div
            data-testid="admin-categories-status-banner"
            className={`mb-5 p-4 rounded-lg flex items-start justify-between gap-3 text-sm transition-all shadow-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 mb-6 shadow-sm flex items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories by name, slug, or description..."
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 text-base sm:text-sm bg-gray-50 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#C5A572] focus:outline-none transition-colors"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-gray-500 hover:text-black transition-colors p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
          {/* Mobile Table Swipe Indicator */}
          <div className="sm:hidden px-3.5 py-2 bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] text-[#777777] flex items-center justify-between">
            <span className="font-medium">Scroll table horizontally to view actions</span>
            <span className="font-semibold text-[#C5A572] text-xs">⟷</span>
          </div>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-left text-xs sm:text-sm text-gray-600 border-collapse min-w-[640px]">
              <thead className="bg-[#FAFAFA] text-gray-500 uppercase font-semibold text-[11px] tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th scope="col" className="px-4 py-3 w-16 text-center">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Image
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category Name & Slug
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Products
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No categories found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-[#F9F9F9] transition-colors duration-150"
                      data-testid={`category-row-${cat.slug}`}
                    >
                      {/* Order Controls */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            aria-label={`Move ${cat.name} up`}
                            className={`p-1 rounded transition-colors ${
                              index === 0
                                ? "text-gray-200 cursor-not-allowed"
                                : "text-gray-500 hover:text-black hover:bg-gray-100"
                            }`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-semibold text-gray-800 text-xs w-5 text-center">
                            {cat.order}
                          </span>
                          <button
                            type="button"
                            disabled={index === filteredCategories.length - 1}
                            onClick={() => handleMoveDown(index)}
                            aria-label={`Move ${cat.name} down`}
                            className={`p-1 rounded transition-colors ${
                              index === filteredCategories.length - 1
                                ? "text-gray-200 cursor-not-allowed"
                                : "text-gray-500 hover:text-black hover:bg-gray-100"
                            }`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50">
                          {cat.imageUrl ? (
                            <Image
                              src={cat.imageUrl}
                              alt={cat.imageAlt || cat.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 uppercase tracking-wide">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          /{cat.slug}
                        </div>
                      </td>

                      {/* Product Count Badge */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {cat.productCount} {cat.productCount === 1 ? "product" : "products"}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3 text-center">
                        {cat.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-black transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 bg-white border border-rose-200 rounded hover:bg-rose-50 hover:border-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ─── ADD CATEGORY MODAL ─────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-category-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
        >
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 id="add-category-title" className="text-base font-semibold text-gray-900">
                Add New Category
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="add-category-name" className="block text-xs font-medium uppercase text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="add-category-name"
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => handleAddNameChange(e.target.value)}
                  placeholder="e.g. ANKLETS & CUFFS"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-[#C5A572] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400 font-mono">
                  Slug: /{slugify(addName) || "slug"}
                </p>
              </div>

              {/* Image Uploader & Live Preview */}
              <div>
                <label className="block text-xs font-medium uppercase text-gray-700 mb-1">
                  Category Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                    {addImageUrl ? (
                      <Image
                        src={addImageUrl}
                        alt="Preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={addFileInputRef}
                      onChange={handleAddImageUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingAddImage}
                      onClick={() => addFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      {isUploadingAddImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image (Max 5MB)</span>
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      value={addImageUrl}
                      onChange={(e) => setAddImageUrl(e.target.value)}
                      placeholder="Or enter permanent image URL (/images/...)"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-category-order" className="block text-xs font-medium uppercase text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    id="add-category-order"
                    type="number"
                    min={1}
                    value={addOrder}
                    onChange={(e) => setAddOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addIsActive}
                      onChange={(e) => setAddIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#C5A572] rounded border-gray-300 focus:ring-[#C5A572]"
                    />
                    <span className="text-sm font-medium text-gray-700">Active & Published</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd || isUploadingAddImage}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium uppercase tracking-wider bg-[#C5A572] hover:bg-[#B39360] text-white rounded transition-colors disabled:opacity-50"
                >
                  {isSubmittingAdd && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT CATEGORY MODAL ────────────────────────────────────────────── */}
      {editingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
        >
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 id="edit-category-title" className="text-base font-semibold text-gray-900">
                Edit Category: {editingCategory.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-black p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                Editing this category preserves its stable identifier (
                <span className="font-mono">{editingCategory.id}</span>) and maintains all{" "}
                <strong>{editingCategory.productCount}</strong> associated product links.
              </div>

              <div>
                <label htmlFor="edit-category-name" className="block text-xs font-medium uppercase text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-category-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-[#C5A572] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400 font-mono">
                  Slug: /{slugify(editName) || "slug"}
                </p>
              </div>

              {/* Image Replacement */}
              <div>
                <label className="block text-xs font-medium uppercase text-gray-700 mb-1">
                  Category Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                    {editImageUrl ? (
                      <Image
                        src={editImageUrl}
                        alt="Preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditImageUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingEditImage}
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      {isUploadingEditImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Image (Max 5MB)</span>
                        </>
                      )}
                    </button>
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="Permanent image URL"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-category-order" className="block text-xs font-medium uppercase text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    id="edit-category-order"
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#C5A572] rounded border-gray-300 focus:ring-[#C5A572]"
                    />
                    <span className="text-sm font-medium text-gray-700">Active & Published</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || isUploadingEditImage}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium uppercase tracking-wider bg-[#C5A572] hover:bg-[#B39360] text-white rounded transition-colors disabled:opacity-50"
                >
                  {isSubmittingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION DIALOG ─────────────────────────────────────── */}
      {deletingCategory && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
        >
          <div className="bg-white rounded-lg shadow-xl border border-red-200 w-full max-w-md p-6 flex flex-col">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 id="delete-category-title" className="text-base font-semibold text-gray-900">
                Delete Category: {deletingCategory.name}
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              This category currently has{" "}
              <strong className="text-gray-900">{deletingCategory.productCount}</strong> associated{" "}
              {deletingCategory.productCount === 1 ? "product" : "products"} in the catalogue.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium mb-6">
              ⚠️ Warning: Confirming deletion will permanently delete the category and all{" "}
              {deletingCategory.productCount} associated products from the database and storefront. This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
