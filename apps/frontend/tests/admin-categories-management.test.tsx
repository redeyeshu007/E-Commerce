import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminCategoriesPage from "@/app/admin/categories/page";
import * as adminAuthService from "@/services/admin-auth-service";
import * as categoryAdminService from "@/services/category-admin-service";
import type { CategoryItem } from "@/types/category";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/categories",
}));

const mockCategories: CategoryItem[] = [
  {
    id: "cat-necklaces",
    name: "NECKLACES",
    slug: "necklaces",
    imageUrl: "/images/collections/collection-necklaces.jpg",
    imageAlt: "Necklaces Collection",
    description: "Handcrafted 18k and 22k gold necklaces",
    order: 1,
    isActive: true,
    productCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-rings",
    name: "RINGS",
    slug: "rings",
    imageUrl: "/images/collections/collection-rings.jpg",
    imageAlt: "Rings Collection",
    description: "Fine gold engagement and stackable rings",
    order: 2,
    isActive: true,
    productCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-bracelets",
    name: "BRACELETS",
    slug: "bracelets",
    imageUrl: "/images/collections/collection-bracelets.jpg",
    imageAlt: "Bracelets Collection",
    description: "Elegant wrist chains and tennis bracelets",
    order: 3,
    isActive: true,
    productCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("PERALAGAE Admin Category Management Suite (/admin/categories)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin Authorization Protection", () => {
    it("redirects unauthenticated users to /?auth=login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/?auth=login");
      });
    });
  });

  describe("2. Category Management Screen & Preservation of Existing Categories", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("renders page heading, short description, category count, search bar, and add button", async () => {
      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Category Management" })).toBeInTheDocument();
        expect(screen.getByText("3 Categories")).toBeInTheDocument();
        expect(
          screen.getByText(/Manage product categories, organize display order/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /add category/i })).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/search categories by name, slug, or description/i)
        ).toBeInTheDocument();
      });
    });

    it("displays existing categories with images, titles, slugs, product counts, and status", async () => {
      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
        expect(screen.getByText("RINGS")).toBeInTheDocument();
        expect(screen.getByText("BRACELETS")).toBeInTheDocument();

        expect(screen.getByText("/necklaces")).toBeInTheDocument();
        expect(screen.getByText("/rings")).toBeInTheDocument();
        expect(screen.getByText("/bracelets")).toBeInTheDocument();

        expect(screen.getAllByText(/5 products/i)).toHaveLength(2); // Necklaces and Rings
        expect(screen.getByText(/4 products/i)).toBeInTheDocument(); // Bracelets
      });
    });

    it("filters categories live as administrator types in search query", async () => {
      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /search categories by name, slug, or description/i
      );
      await userEvent.type(searchInput, "rings");

      expect(screen.getByText("RINGS")).toBeInTheDocument();
      expect(screen.queryByText("NECKLACES")).not.toBeInTheDocument();
      expect(screen.queryByText("BRACELETS")).not.toBeInTheDocument();
    });
  });

  describe("3. Add Category Workflow", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("opens Add Category modal, validates required fields, and creates new category", async () => {
      const createdCategory: CategoryItem = {
        id: "cat-anklets",
        name: "ANKLETS",
        slug: "anklets",
        imageUrl: "/images/collections/anklets.jpg",
        imageAlt: "Anklets Collection",
        description: "Fine gold ankle jewelry",
        order: 4,
        isActive: true,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createSpy = vi
        .spyOn(categoryAdminService, "createAdminCategory")
        .mockResolvedValue(createdCategory);

      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add category/i })).toBeInTheDocument();
      });

      // Open Add Modal
      await userEvent.click(screen.getByRole("button", { name: /add category/i }));
      expect(screen.getByRole("heading", { name: "Add New Category" })).toBeInTheDocument();

      // Enter details
      const nameInput = screen.getByPlaceholderText(/e\.g\. ANKLETS & CUFFS/i);
      await userEvent.type(nameInput, "ANKLETS");

      const imageUrlInput = screen.getByPlaceholderText(/Or enter permanent image URL/i);
      await userEvent.type(imageUrlInput, "/images/collections/anklets.jpg");

      // Submit
      const submitBtn = screen.getByRole("button", { name: /save category/i });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "ANKLETS",
            slug: "anklets",
            imageUrl: "/images/collections/anklets.jpg",
          })
        );
      });
    });
  });

  describe("4. Edit Category Workflow", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("opens Edit modal with prefilled data and submits updates without breaking associations", async () => {
      const updatedCategory: CategoryItem = {
        ...mockCategories[0],
        name: "GOLD NECKLACES",
        slug: "gold-necklaces",
      };

      const updateSpy = vi
        .spyOn(categoryAdminService, "updateAdminCategory")
        .mockResolvedValue(updatedCategory);

      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      });

      // Find first edit button
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      await userEvent.click(editButtons[0]);

      expect(screen.getByRole("heading", { name: "Edit Category: NECKLACES" })).toBeInTheDocument();

      // Submit edit
      const saveBtn = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveBtn);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          "cat-necklaces",
          expect.objectContaining({
            name: "NECKLACES",
            slug: "necklaces",
          })
        );
      });
    });
  });

  describe("5. Delete Category & Associated Products Safety", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("displays confirmation dialog with authoritative product count and warning", async () => {
      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      });

      // Click delete on NECKLACES (has 5 products)
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      // Confirm dialog opens
      expect(
        screen.getByRole("heading", { name: "Delete Category: NECKLACES" })
      ).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(
        screen.getByText(/Warning: Confirming deletion will permanently delete the category and all/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
    });

    it("cancels deletion when Cancel button is clicked, leaving category intact", async () => {
      const deleteSpy = vi.spyOn(categoryAdminService, "deleteAdminCategory");

      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelBtn);

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("heading", { name: "Delete Category: NECKLACES" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("NECKLACES")).toBeInTheDocument();
    });

    it("permanently deletes category and cascades products when confirmed", async () => {
      const deleteSpy = vi
        .spyOn(categoryAdminService, "deleteAdminCategory")
        .mockResolvedValue({
          deletedCategory: mockCategories[0],
          deletedProductCount: 5,
        });

      renderWithQueryClient(<AdminCategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText("NECKLACES")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith("cat-necklaces");
        expect(
          screen.getByText(/permanently deleted/i)
        ).toBeInTheDocument();
      });
    });
  });
});
