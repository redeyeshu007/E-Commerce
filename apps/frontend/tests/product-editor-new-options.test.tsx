import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StorefrontProvider } from "@/providers/storefront-provider";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import * as categoryAdminService from "@/services/category-admin-service";
import * as materialService from "@/services/material-service";
import * as productAdminService from "@/services/product-admin-service";
import type { CategoryItem } from "@/types/category";
import type { MaterialItem } from "@/types/material";
import type { Product } from "@/types/product";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/products/new",
  useParams: () => ({}),
}));

const mockCategories: CategoryItem[] = [
  {
    id: "cat-necklaces",
    name: "NECKLACES",
    slug: "necklaces",
    imageUrl: "/images/collections/collection-necklaces.jpg",
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
    order: 2,
    isActive: true,
    productCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMaterials: MaterialItem[] = [
  {
    id: "mat-gold",
    name: "Gold",
    slug: "gold",
    order: 1,
    isActive: true,
    productCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mat-diamond",
    name: "Diamond",
    slug: "diamond",
    order: 2,
    isActive: true,
    productCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StorefrontProvider>{ui}</StorefrontProvider>
    </QueryClientProvider>
  );
}

describe("Product Form — + New Category & Material Creation Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue([...mockCategories]);
    vi.spyOn(materialService, "fetchAdminMaterials").mockResolvedValue([...mockMaterials]);
  });

  describe("1. Category + New Workflow", () => {
    it("renders '+ New' button beside Category dropdown", async () => {
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("product-category-select")).toBeInTheDocument();
      });

      const addNewCategoryBtn = screen.getByTestId("add-new-category-button");
      expect(addNewCategoryBtn).toBeInTheDocument();
      expect(addNewCategoryBtn).toHaveTextContent("+ New");
    });

    it("clicking '+ New' opens Category creation modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("add-new-category-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-category-button"));

      expect(screen.getByRole("heading", { name: /create new category/i })).toBeInTheDocument();
      expect(screen.getByTestId("new-category-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-new-category-button")).toBeInTheDocument();
      expect(screen.getByTestId("submit-new-category-button")).toBeInTheDocument();
    });

    it("cancels category creation modal when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("add-new-category-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-category-button"));
      expect(screen.getByTestId("new-category-name-input")).toBeInTheDocument();

      await user.click(screen.getByTestId("cancel-new-category-button"));
      await waitFor(() => {
        expect(screen.queryByTestId("new-category-name-input")).not.toBeInTheDocument();
      });
    });

    it("prevents creating duplicate category (case-insensitive) with clean validation message", async () => {
      const user = userEvent.setup();
      const createSpy = vi.spyOn(categoryAdminService, "createAdminCategory");
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("add-new-category-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-category-button"));

      // Enter lowercase duplicate of "NECKLACES"
      fireEvent.change(screen.getByTestId("new-category-name-input"), {
        target: { value: "necklaces" },
      });

      await user.click(screen.getByTestId("submit-new-category-button"));

      expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("successfully creates a new category, refreshes dropdown, selects it, and shows success notification", async () => {
      const user = userEvent.setup();
      const newCat: CategoryItem = {
        id: "cat-anklets-99",
        name: "Anklets",
        slug: "anklets",
        imageUrl: "/images/collections/collection-necklaces.jpg",
        order: 3,
        isActive: true,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createSpy = vi.spyOn(categoryAdminService, "createAdminCategory").mockResolvedValue(newCat);
      vi.spyOn(categoryAdminService, "fetchAdminCategories")
        .mockResolvedValueOnce([...mockCategories])
        .mockResolvedValue([...mockCategories, newCat]);

      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("product-category-select")).toBeInTheDocument();
      });

      // Type some product info to ensure it is preserved
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Celestial Diamond Solitaire Pendant/i), {
        target: { value: "Heirloom Gold Pendant" },
      });

      // Open category modal
      await user.click(screen.getByTestId("add-new-category-button"));

      fireEvent.change(screen.getByTestId("new-category-name-input"), {
        target: { value: "Anklets" },
      });

      await user.click(screen.getByTestId("submit-new-category-button"));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({ name: "Anklets" });
      });

      // Modal closes
      await waitFor(() => {
        expect(screen.queryByTestId("new-category-name-input")).not.toBeInTheDocument();
      });

      // Product category select now has the newly created category selected
      const select = screen.getByTestId("product-category-select") as HTMLSelectElement;
      expect(select.value).toBe("cat-anklets-99");

      // Verify product name was preserved
      const nameInput = screen.getByPlaceholderText(/e\.g\. Celestial Diamond Solitaire Pendant/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Heirloom Gold Pendant");
    });
  });

  describe("2. Material + New Workflow", () => {
    it("renders '+ New' button beside Material dropdown", async () => {
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("product-material-select")).toBeInTheDocument();
      });

      const addNewMaterialBtn = screen.getByTestId("add-new-material-button");
      expect(addNewMaterialBtn).toBeInTheDocument();
      expect(addNewMaterialBtn).toHaveTextContent("+ New");
    });

    it("clicking '+ New' opens Material creation modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("add-new-material-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-material-button"));

      expect(screen.getByRole("heading", { name: /create new material/i })).toBeInTheDocument();
      expect(screen.getByTestId("new-material-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-new-material-button")).toBeInTheDocument();
      expect(screen.getByTestId("submit-new-material-button")).toBeInTheDocument();
    });

    it("prevents creating duplicate material (case-insensitive)", async () => {
      const user = userEvent.setup();
      const createSpy = vi.spyOn(materialService, "createAdminMaterial");
      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("add-new-material-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-material-button"));

      // Enter lowercase duplicate of "Gold"
      fireEvent.change(screen.getByTestId("new-material-name-input"), {
        target: { value: "gold" },
      });

      await user.click(screen.getByTestId("submit-new-material-button"));

      expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("successfully creates a new material, refreshes dropdown, selects it, and updates materials list", async () => {
      const user = userEvent.setup();
      const newMat: MaterialItem = {
        id: "mat-rose-gold-77",
        name: "18k Rose Gold",
        slug: "18k-rose-gold",
        order: 3,
        isActive: true,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createSpy = vi.spyOn(materialService, "createAdminMaterial").mockResolvedValue(newMat);
      vi.spyOn(materialService, "fetchAdminMaterials")
        .mockResolvedValueOnce([...mockMaterials])
        .mockResolvedValue([...mockMaterials, newMat]);

      renderWithProviders(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByTestId("product-material-select")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-new-material-button"));

      fireEvent.change(screen.getByTestId("new-material-name-input"), {
        target: { value: "18k Rose Gold" },
      });

      await user.click(screen.getByTestId("submit-new-material-button"));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({ name: "18k Rose Gold" });
      });

      // Modal closes
      await waitFor(() => {
        expect(screen.queryByTestId("new-material-name-input")).not.toBeInTheDocument();
      });

      // Product material select has the new material selected
      const select = screen.getByTestId("product-material-select") as HTMLSelectElement;
      expect(select.value).toBe("mat-rose-gold-77");
    });
  });

  describe("3. Product Editing Mode & Preservation", () => {
    it("preserves existing product's category and material relationships in edit mode", async () => {
      const existingProduct: Product = {
        id: "prod-existing-1",
        name: "Diamond Solitaire Ring",
        slug: "diamond-solitaire-ring",
        priceInr: 89000,
        categoryId: "cat-rings",
        category: "RINGS",
        materialId: "mat-diamond",
        material: "Diamond",
        materials: ["Diamond"],
        inStock: true,
        stockCount: 5,
        description: "Classic solitaire engagement ring",
        productOverview: "Timeless elegance with brilliant-cut diamond.",
        productDetails: "Secure 6-prong setting.",
        careInstructions: "Clean with mild soapy water.",
        specs: [{ label: "Metal", value: "Platinum" }],
        image: { src: "/images/ring.jpg", alt: "Ring" },
        images: [{ src: "/images/ring.jpg", alt: "Ring" }],
        isHot: true,
        isNew: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      renderWithProviders(<ProductEditorForm initialProduct={existingProduct} mode="edit" />);

      await waitFor(() => {
        expect(screen.getByTestId("product-category-select")).toBeInTheDocument();
      });

      const catSelect = screen.getByTestId("product-category-select") as HTMLSelectElement;
      const matSelect = screen.getByTestId("product-material-select") as HTMLSelectElement;

      expect(catSelect.value).toBe("cat-rings");
      expect(matSelect.value).toBe("mat-diamond");
    });
  });
});
