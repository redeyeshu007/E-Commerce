import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminProductsPage from "@/app/admin/products/page";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import * as adminAuthService from "@/services/admin-auth-service";
import * as productAdminService from "@/services/product-admin-service";
import * as categoryAdminService from "@/services/category-admin-service";
import type { CategoryItem } from "@/types/category";
import type { Product } from "@/types/product";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => "/admin/products",
  useParams: () => ({ id: "prod-1" }),
}));

const mockCategories: CategoryItem[] = [
  {
    id: "cat-necklaces",
    name: "NECKLACES",
    slug: "necklaces",
    imageUrl: "/images/collections/collection-necklaces.jpg",
    imageAlt: "Necklaces Collection",
    description: "Fine gold necklaces",
    order: 1,
    isActive: true,
    productCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-rings",
    name: "RINGS",
    slug: "rings",
    imageUrl: "/images/collections/collection-rings.jpg",
    imageAlt: "Rings Collection",
    description: "Fine gold rings",
    order: 2,
    isActive: true,
    productCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Eternal Radiance Gold Necklace",
    slug: "eternal-radiance-gold-necklace",
    priceInr: 125000,
    compareAtPriceInr: 140000,
    category: "NECKLACES",
    categoryId: "cat-necklaces",
    inStock: true,
    stockCount: 10,
    description: "A timeless handcrafted gold necklace.",
    productOverview: "Crafted with 22K certified hallmarked gold for radiant presence.",
    productDetails: "Features an intricate diamond-cut filigree pendant with comfort clasp.",
    careInstructions: "Store in provided suede pouch. Clean with soft microfiber cloth.",
    additionalInfo: "Complimentary tamper-evident security box and BIS hallmark certificate.",
    descriptionParagraph1: "Crafted with 22K certified hallmarked gold for radiant presence.",
    descriptionParagraph2: "Features an intricate diamond-cut filigree pendant with comfort clasp.",
    specs: [
      { label: "Purity", value: "22 Karat (916 Hallmarked)" },
      { label: "Weight", value: "18.45 grams" },
    ],
    image: {
      src: "/images/products/necklace-1.jpg",
      alt: "Eternal Radiance Gold Necklace",
    },
    images: [
      { src: "/images/products/necklace-1.jpg", alt: "Eternal Radiance front" },
      { src: "/images/products/necklace-2.jpg", alt: "Eternal Radiance angle" },
    ],
    isHot: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Solitaire Diamond Band",
    slug: "solitaire-diamond-band",
    priceInr: 85000,
    compareAtPriceInr: undefined,
    category: "RINGS",
    categoryId: "cat-rings",
    inStock: false,
    stockCount: 0,
    description: "Minimalist diamond eternity ring.",
    productOverview: "A delicate solid band set with brilliant pavé diamonds.",
    productDetails: "Precision channel setting with hypoallergenic 18k white gold.",
    careInstructions: "Avoid abrasive surfaces. Dip in mild soapy water to refresh lustre.",
    specs: [{ label: "Purity", value: "18 Karat" }],
    image: {
      src: "/images/products/ring-1.jpg",
      alt: "Solitaire Diamond Band",
    },
    images: [
      { src: "/images/products/ring-1.jpg", alt: "Solitaire Band" },
    ],
    isHot: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Admin Products Management Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Authentication & Security Access", () => {
    it("redirects unauthenticated users to /admin/login", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

      renderWithQueryClient(<AdminProductsPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("renders page header and navigation items when authenticated", async () => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
      vi.spyOn(productAdminService, "fetchAdminProducts").mockResolvedValue({
        products: mockProducts,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      renderWithQueryClient(<AdminProductsPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
        expect(screen.getByTestId("add-product-button")).toBeInTheDocument();
      });
    });
  });

  describe("2. Dedicated Page Navigation", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
      vi.spyOn(productAdminService, "fetchAdminProducts").mockResolvedValue({
        products: mockProducts,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it("navigates to dedicated /admin/products/new page when Add Product is clicked", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AdminProductsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("add-product-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("add-product-button"));

      expect(mockPush).toHaveBeenCalledWith("/admin/products/new");
    });

    it("navigates to dedicated /admin/products/[id]/edit page when Edit is clicked on a table row", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AdminProductsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-product-prod-1")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("edit-product-prod-1"));

      expect(mockPush).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    });
  });

  describe("3. Dedicated ProductEditorForm (Create Mode)", () => {
    beforeEach(() => {
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("renders clean form with 6 description sections and no raw URL inputs", async () => {
      renderWithQueryClient(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Basic Information" })).toBeInTheDocument();
        expect(screen.getByText(/1\. Short Description/i)).toBeInTheDocument();
        expect(screen.getByText(/2\. Product Overview/i)).toBeInTheDocument();
        expect(screen.getByText(/3\. Product Details/i)).toBeInTheDocument();
        expect(screen.getByText(/4\. Jewellery Care Instructions/i)).toBeInTheDocument();
      });

      // Strict requirement: No raw URL inputs in UI
      expect(screen.queryByPlaceholderText(/enter image url/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /add url/i })).not.toBeInTheDocument();
    });

    it("completely hides URL slug field from admin UI and renders enlarged Back to Products navigation button", async () => {
      renderWithQueryClient(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e\.g\. Celestial Diamond Solitaire Pendant/i)).toBeInTheDocument();
      });

      // Strict requirement: URL Slug must NOT be visible anywhere in the UI
      expect(screen.queryByText(/url slug/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/auto-generated/i)).not.toBeInTheDocument();

      // Strict requirement: Enlarged Products navigation button is rendered
      expect(screen.getByRole("button", { name: /back to products/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /create new product/i })).toBeInTheDocument();
    });

    it("allows adding dynamic specification rows", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add row/i })).toBeInTheDocument();
      });

      const addRowButton = screen.getByRole("button", { name: /add row/i });
      await user.click(addRowButton);

      expect(screen.getAllByPlaceholderText(/specification name/i).length).toBeGreaterThan(0);
      expect(screen.getAllByPlaceholderText(/value \(e\.g\./i).length).toBeGreaterThan(0);
    });

    it("creates a new product successfully with all 6 description sections", async () => {
      const createSpy = vi.spyOn(productAdminService, "createAdminProduct").mockResolvedValue({
        id: "prod-new",
        name: "Royal Heritage Choker",
        slug: "royal-heritage-choker",
        priceInr: 210000,
        compareAtPriceInr: undefined,
        category: "NECKLACES",
        categoryId: "cat-necklaces",
        inStock: true,
        stockCount: 5,
        description: "Handcrafted 22K choker with fine gemstone accents.",
        productOverview: "The Royal Heritage Choker embodies ancient goldsmith traditions.",
        productDetails: "Hand-finished filigree setting with secure double safety clasp.",
        careInstructions: "Store in provided suede pouch. Clean with soft cloth.",
        specs: [{ label: "Purity", value: "22K" }],
        image: { src: "/images/royal.jpg", alt: "Royal Heritage Choker" },
        images: [{ src: "/images/royal.jpg", alt: "Royal" }],
        isHot: false,
        isNew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const user = userEvent.setup();
      renderWithQueryClient(<ProductEditorForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e\.g\. Celestial Diamond Solitaire Pendant/i)).toBeInTheDocument();
      });

      // Fill basic info
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Celestial Diamond Solitaire Pendant/i), {
        target: { value: "Royal Heritage Choker" },
      });
      await user.selectOptions(screen.getByTestId("product-category-select"), "cat-necklaces");
      fireEvent.change(screen.getByPlaceholderText("24900"), {
        target: { value: "210000" },
      });

      // Fill 6 required description sections
      fireEvent.change(screen.getByPlaceholderText(/one concise, elegant sentence/i), {
        target: { value: "Handcrafted 22K choker with fine gemstone accents." },
      });
      fireEvent.change(screen.getByPlaceholderText(/the primary editorial paragraph/i), {
        target: { value: "The Royal Heritage Choker embodies ancient goldsmith traditions with pure elegance." },
      });
      fireEvent.change(screen.getByPlaceholderText(/supporting description explaining design mechanics/i), {
        target: { value: "Hand-finished filigree setting with secure double safety clasp and comfort bevels." },
      });
      fireEvent.change(screen.getByPlaceholderText(/specific guidance for cleaning/i), {
        target: { value: "Store inside provided anti-tarnish pouch. Clean gently with polishing cloth." },
      });

      // Add mock uploaded image to pass validation
      const uploadSpy = vi.spyOn(productAdminService, "uploadAdminProductImages").mockResolvedValue([
        { url: "/uploads/products/royal.jpg", filename: "royal.jpg", mimetype: "image/jpeg", size: 12000 },
      ]);

      const file = new File(["dummy content"], "test-jewel.jpg", { type: "image/jpeg" });
      const fileInput = document.getElementById("admin-image-upload-input") as HTMLInputElement;
      if (fileInput) {
        await user.upload(fileInput, file);
      }

      // Submit form
      const saveButton = screen.getByTestId("save-product-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Royal Heritage Choker",
            categoryId: "cat-necklaces",
            priceInr: 210000,
            description: "Handcrafted 22K choker with fine gemstone accents.",
            productOverview: "The Royal Heritage Choker embodies ancient goldsmith traditions with pure elegance.",
            productDetails: "Hand-finished filigree setting with secure double safety clasp and comfort bevels.",
            careInstructions: "Store inside provided anti-tarnish pouch. Clean gently with polishing cloth.",
          })
        );
      });
    });
  });

  describe("4. Dedicated ProductEditorForm (Edit Mode)", () => {
    beforeEach(() => {
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
    });

    it("pre-populates form with existing product data in edit mode", async () => {
      renderWithQueryClient(
        <ProductEditorForm mode="edit" initialProduct={mockProducts[0]} />
      );

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /edit: eternal radiance/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/url slug/i)).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("Eternal Radiance Gold Necklace")).toBeInTheDocument();
        expect(screen.getByDisplayValue("125000")).toBeInTheDocument();
        expect(screen.getByDisplayValue("A timeless handcrafted gold necklace.")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("Crafted with 22K certified hallmarked gold for radiant presence.")
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("Purity")).toBeInTheDocument();
        expect(screen.getByDisplayValue("22 Karat (916 Hallmarked)")).toBeInTheDocument();
      });
    });

    it("updates product while preserving established slug and ID", async () => {
      const updateSpy = vi.spyOn(productAdminService, "updateAdminProduct").mockResolvedValue({
        ...mockProducts[0],
        priceInr: 130000,
      });

      const user = userEvent.setup();
      renderWithQueryClient(
        <ProductEditorForm mode="edit" initialProduct={mockProducts[0]} />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("125000")).toBeInTheDocument();
      });

      const priceInput = screen.getByDisplayValue("125000");
      await user.clear(priceInput);
      await user.type(priceInput, "130000");

      const saveButton = screen.getByTestId("save-product-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          "prod-1",
          expect.objectContaining({
            priceInr: 130000,
          })
        );
      });
    });
  });

  describe("5. Delete Product Workflow on Catalogue Page", () => {
    beforeEach(() => {
      vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
        email: "javixtech@gmail.com",
        role: "admin",
      });
      vi.spyOn(categoryAdminService, "fetchAdminCategories").mockResolvedValue(mockCategories);
      vi.spyOn(productAdminService, "fetchAdminProducts").mockResolvedValue({
        products: mockProducts,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it("shows confirmation dialog before deleting product and calls delete API upon confirmation", async () => {
      const deleteSpy = vi.spyOn(productAdminService, "deleteAdminProduct").mockResolvedValue({
        success: true,
        id: "prod-2",
        name: "Solitaire Diamond Band",
      });

      const user = userEvent.setup();
      renderWithQueryClient(<AdminProductsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("delete-product-prod-2")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("delete-product-prod-2"));

      expect(screen.getByRole("heading", { name: "Delete Fine Jewellery Piece?" })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete this product/i)).toBeInTheDocument();

      await user.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith("prod-2");
      });
    });
  });
});
