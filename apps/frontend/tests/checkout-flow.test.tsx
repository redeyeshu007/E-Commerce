import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StorefrontProvider, useStorefront } from "@/providers/storefront-provider";
import CheckoutPage from "@/app/checkout/page";
import { CartTotals } from "@/components/cart/cart-totals";
import { OrderClientService } from "@/services/order-client-service";
import { CustomerAuthService } from "@/services/customer-auth-service";

const mockProduct = {
  id: "prod-gold-necklace-1",
  name: "Heritage Royal Kundan Necklace",
  slug: "heritage-royal-kundan-necklace",
  category: "NECKLACES",
  priceInr: 125000,
  image: {
    src: "/images/products/necklace-1.jpg",
    alt: "Heritage Royal Kundan Necklace",
  },
  isAvailable: true,
  inStock: true,
};

describe("Protected Checkout & Order Placement Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("1. Guest Checkout Interception", () => {
    it("intercepts guest proceed to checkout and opens authentication modal with returnUrl", async () => {
      function CartTestWrapper() {
        const { isAuthModalOpen, authReturnUrl } = useStorefront();
        return (
          <div>
            <span data-testid="modal-open">{isAuthModalOpen ? "open" : "closed"}</span>
            <span data-testid="return-url">{authReturnUrl || "none"}</span>
            <CartTotals subtotalInr={125000} discountInr={0} appliedCoupon={null} />
          </div>
        );
      }

      render(
        <StorefrontProvider>
          <CartTestWrapper />
        </StorefrontProvider>
      );

      expect(screen.getByTestId("modal-open")).toHaveTextContent("closed");

      const checkoutBtn = screen.getByTestId("proceed-to-checkout-btn");
      fireEvent.click(checkoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId("modal-open")).toHaveTextContent("open");
        expect(screen.getByTestId("return-url")).toHaveTextContent("/checkout");
      });
    });

    it("displays guest sign-in requirement screen when visiting /checkout directly unauthenticated", async () => {
      render(
        <StorefrontProvider>
          <CheckoutPage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Sign In to Complete Checkout" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("2. Authenticated Customer Checkout & Order Creation", () => {
    it("renders checkout form, pre-fills verified customer name, and places order via backend", async () => {
      const mockCustomer = {
        id: "cust-order-123",
        email: "vip@peralagae.com",
        fullName: "Maharani Gayatri Devi",
        role: "customer" as const,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      CustomerAuthService.setStoredCustomer(mockCustomer);

      const createOrderSpy = vi.spyOn(OrderClientService, "createOrder").mockResolvedValue({
        id: "ord-test-999",
        orderNumber: "PLG-2026-TEST-999",
        status: "CONFIRMED",
        subtotalInr: 125000,
        discountInr: 0,
        shippingInr: 0,
        taxInr: 0,
        totalInr: 125000,
        shippingAddress: {},
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        createdAt: new Date().toISOString(),
        items: [
          {
            id: "item-1",
            productId: mockProduct.id,
            productName: mockProduct.name,
            productSlug: mockProduct.slug,
            unitPriceInr: 125000,
            quantity: 1,
            totalPriceInr: 125000,
          },
        ],
      });

      localStorage.setItem(
        "peralagae_cart_items",
        JSON.stringify([{ id: "cart-1", product: mockProduct, quantity: 1 }])
      );

      render(
        <StorefrontProvider>
          <CheckoutPage />
        </StorefrontProvider>
      );

      // Wait for authenticated checkout form to appear
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Insured Express Checkout" })).toBeInTheDocument();
      });

      // Recipient full name is prefilled from verified customer profile
      const nameInput = screen.getByPlaceholderText("e.g. Ananya Sharma");
      expect(nameInput).toHaveValue("Maharani Gayatri Devi");

      // Fill remaining shipping address fields
      fireEvent.change(screen.getByPlaceholderText("+91 98765 43210"), {
        target: { value: "+91 9876543210" },
      });
      fireEvent.change(screen.getByPlaceholderText("Flat, House no., Building, Apartment, Street"), {
        target: { value: "Palace Road, Civil Lines" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. Mumbai"), {
        target: { value: "Jaipur" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. Maharashtra"), {
        target: { value: "Rajasthan" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 400001"), {
        target: { value: "302006" },
      });

      // Submit Place Order
      const submitBtn = screen.getByTestId("place-order-button");
      fireEvent.click(submitBtn);

      // Order created and Order Confirmed screen shown
      await waitFor(() => {
        expect(createOrderSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            items: [{ productId: mockProduct.id, quantity: 1 }],
            shippingAddress: expect.objectContaining({
              fullName: "Maharani Gayatri Devi",
              city: "Jaipur",
              state: "Rajasthan",
              postalCode: "302006",
            }),
          })
        );
        expect(screen.getByRole("heading", { name: "Thank You for Your Order" })).toBeInTheDocument();
        expect(screen.getByText("PLG-2026-TEST-999")).toBeInTheDocument();
      });
    });
  });
});
