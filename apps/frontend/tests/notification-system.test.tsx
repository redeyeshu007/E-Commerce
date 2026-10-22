import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  NotificationPopupItem,
  NotificationContainer,
  type NotificationItem,
} from "@/components/ui/notification";
import { StorefrontProvider, useStorefront, useNotification } from "@/providers/storefront-provider";
import type { Product } from "@/types/product";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockProductInStock: Product = {
  id: "prod-1",
  name: "22K Gold Diamond Choker",
  slug: "22k-gold-diamond-choker",
  priceInr: 125000,
  inStock: true,
  stockCount: 5,
  isAvailable: true,
  image: { src: "/images/choker.jpg", alt: "Choker" },
  images: [{ src: "/images/choker.jpg", alt: "Choker" }],
  category: "Necklaces",
};

const mockProductOutOfStock: Product = {
  id: "prod-2",
  name: "Solitaire Platinum Ring",
  slug: "solitaire-platinum-ring",
  priceInr: 95000,
  inStock: false,
  stockCount: 0,
  isAvailable: false,
  image: { src: "/images/ring.jpg", alt: "Ring" },
  images: [{ src: "/images/ring.jpg", alt: "Ring" }],
  category: "Rings",
};

describe("PERALAGAE Global Popup Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. NotificationPopupItem Component", () => {
    it("renders success notification with appropriate role and text", () => {
      const onDismiss = vi.fn();
      const notification: NotificationItem = {
        id: "notif-1",
        type: "success",
        message: "Added to cart successfully.",
        description: "22K Gold Diamond Choker has been added.",
        createdAt: Date.now(),
      };

      render(<NotificationPopupItem notification={notification} onDismiss={onDismiss} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Added to cart successfully.")).toBeInTheDocument();
      expect(screen.getByText("22K Gold Diamond Choker has been added.")).toBeInTheDocument();
    });

    it("renders error notification with assertive alert role", () => {
      const onDismiss = vi.fn();
      const notification: NotificationItem = {
        id: "notif-err",
        type: "error",
        message: "Order placement failed",
        description: "Payment declined by issuing bank.",
        createdAt: Date.now(),
      };

      render(<NotificationPopupItem notification={notification} onDismiss={onDismiss} />);

      const alertEl = screen.getByRole("alert");
      expect(alertEl).toBeInTheDocument();
      expect(alertEl).toHaveAttribute("aria-live", "assertive");
      expect(screen.getByText("Order placement failed")).toBeInTheDocument();
      expect(screen.getByText("Payment declined by issuing bank.")).toBeInTheDocument();
    });

    it("renders warning and info types correctly", () => {
      const onDismiss = vi.fn();
      const warningNotif: NotificationItem = {
        id: "notif-warn",
        type: "warning",
        message: "Out of Stock",
        description: "Item unavailable.",
        createdAt: Date.now(),
      };

      const { rerender } = render(
        <NotificationPopupItem notification={warningNotif} onDismiss={onDismiss} />
      );
      expect(screen.getByText("Out of Stock")).toBeInTheDocument();

      const infoNotif: NotificationItem = {
        id: "notif-info",
        type: "info",
        message: "Item removed from cart.",
        createdAt: Date.now(),
      };

      rerender(<NotificationPopupItem notification={infoNotif} onDismiss={onDismiss} />);
      expect(screen.getByText("Item removed from cart.")).toBeInTheDocument();
    });

    it("renders optional action button and triggers callback", () => {
      const onDismiss = vi.fn();
      const onActionClick = vi.fn();
      const notification: NotificationItem = {
        id: "notif-action",
        type: "success",
        message: "Item Added",
        action: {
          label: "View Cart",
          onClick: onActionClick,
        },
        createdAt: Date.now(),
      };

      render(<NotificationPopupItem notification={notification} onDismiss={onDismiss} />);

      const actionBtn = screen.getByRole("button", { name: "View Cart" });
      expect(actionBtn).toBeInTheDocument();
      fireEvent.click(actionBtn);
      expect(onActionClick).toHaveBeenCalledTimes(1);
    });

    it("manually dismisses on close button click", async () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      const notification: NotificationItem = {
        id: "notif-close",
        type: "info",
        message: "Manual dismissal test",
        createdAt: Date.now(),
      };

      render(<NotificationPopupItem notification={notification} onDismiss={onDismiss} />);

      const dismissBtn = screen.getByRole("button", { name: /Dismiss notification/i });
      fireEvent.click(dismissBtn);

      // Fast-forward exit animation delay (220ms)
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(onDismiss).toHaveBeenCalledWith("notif-close");
    });

    it("automatically dismisses after configured duration", async () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      const notification: NotificationItem = {
        id: "notif-auto",
        type: "success",
        message: "Auto dismiss test",
        duration: 3000,
        createdAt: Date.now(),
      };

      render(<NotificationPopupItem notification={notification} onDismiss={onDismiss} />);

      // Advance 3000ms + exit animation delay
      act(() => {
        vi.advanceTimersByTime(3300);
      });

      expect(onDismiss).toHaveBeenCalledWith("notif-auto");
    });
  });

  describe("2. NotificationContainer Component", () => {
    it("renders nothing when notifications list is empty", () => {
      const { container } = render(
        <NotificationContainer notifications={[]} onDismiss={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders list of active notifications inside fixed viewport aside", () => {
      const notifications: NotificationItem[] = [
        { id: "1", type: "success", message: "First notification", createdAt: 1 },
        { id: "2", type: "info", message: "Second notification", createdAt: 2 },
      ];

      render(<NotificationContainer notifications={notifications} onDismiss={vi.fn()} />);

      const aside = screen.getByLabelText("Notifications");
      expect(aside).toBeInTheDocument();
      expect(screen.getByText("First notification")).toBeInTheDocument();
      expect(screen.getByText("Second notification")).toBeInTheDocument();
    });
  });

  describe("3. StorefrontProvider Integrated Notifications", () => {
    function TestConsumer() {
      const {
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        cartItems,
        notify,
      } = useStorefront();

      return (
        <div>
          <button
            onClick={() => addToCart(mockProductInStock, 1)}
            data-testid="add-in-stock-btn"
          >
            Add In Stock
          </button>
          <button
            onClick={() => addToCart(mockProductOutOfStock, 1)}
            data-testid="add-out-of-stock-btn"
          >
            Add Out of Stock
          </button>
          <button
            onClick={() => updateQuantity(mockProductInStock.id, 2)}
            data-testid="update-qty-btn"
          >
            Update Qty
          </button>
          <button
            onClick={() => removeFromCart(mockProductInStock.id)}
            data-testid="remove-item-btn"
          >
            Remove Item
          </button>
          <button onClick={() => clearCart()} data-testid="clear-cart-btn">
            Clear Cart
          </button>
          <button
            onClick={() => toggleWishlist(mockProductInStock)}
            data-testid="toggle-wishlist-btn"
          >
            Toggle Wishlist
          </button>
          <button
            onClick={() => {
              notify.success("Custom Message");
            }}
            data-testid="manual-notify-btn"
          >
            Manual Notify
          </button>
          <div data-testid="cart-count">{cartItems.length}</div>
        </div>
      );
    }

    it("shows success popup when product is added to cart", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      const addBtn = screen.getByTestId("add-in-stock-btn");
      fireEvent.click(addBtn);

      expect(await screen.findByText("Added to cart successfully.")).toBeInTheDocument();
      expect(
        screen.getByText(`"${mockProductInStock.name}" has been added to your shopping bag.`)
      ).toBeInTheDocument();
    });

    it("shows warning popup when attempting to add out of stock product", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      const outOfStockBtn = screen.getByTestId("add-out-of-stock-btn");
      fireEvent.click(outOfStockBtn);

      expect(await screen.findByText("Out of Stock")).toBeInTheDocument();
      expect(
        screen.getByText(`Sorry, "${mockProductOutOfStock.name}" is currently out of stock.`)
      ).toBeInTheDocument();
    });

    it("shows success popup when cart quantity is updated", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      // First add product
      fireEvent.click(screen.getByTestId("add-in-stock-btn"));
      expect(await screen.findByText("Added to cart successfully.")).toBeInTheDocument();

      // Now update quantity
      fireEvent.click(screen.getByTestId("update-qty-btn"));
      expect(await screen.findByText("Cart updated.")).toBeInTheDocument();
    });

    it("shows info popup when item is removed from cart", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      // Add product
      fireEvent.click(screen.getByTestId("add-in-stock-btn"));
      expect(await screen.findByText("Added to cart successfully.")).toBeInTheDocument();

      // Remove product
      fireEvent.click(screen.getByTestId("remove-item-btn"));
      expect(await screen.findByText("Item removed from cart.")).toBeInTheDocument();
    });

    it("shows wishlist added and removed feedback on toggle", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      const wishlistBtn = screen.getByTestId("toggle-wishlist-btn");

      // First toggle: Add
      fireEvent.click(wishlistBtn);
      expect(await screen.findByText("Added to wishlist.")).toBeInTheDocument();

      // Wait a bit and toggle again: Remove
      fireEvent.click(wishlistBtn);
      expect(await screen.findByText("Removed from wishlist.")).toBeInTheDocument();
    });

    it("deduplicates identical notifications fired within 1500ms to prevent duplicates", async () => {
      render(
        <StorefrontProvider>
          <TestConsumer />
        </StorefrontProvider>
      );

      const manualBtn = screen.getByTestId("manual-notify-btn");

      // Click rapidly twice
      fireEvent.click(manualBtn);
      fireEvent.click(manualBtn);

      const popups = await screen.findAllByText("Custom Message");
      // Only 1 notification should be rendered because of deduplication
      expect(popups).toHaveLength(1);
    });

    it("limits visible notifications to at most 3", async () => {
      function MultiNotifyConsumer() {
        const notify = useNotification();
        return (
          <button
            onClick={() => {
              notify.info("Message 1");
              notify.info("Message 2");
              notify.info("Message 3");
              notify.info("Message 4");
            }}
            data-testid="multi-notify-btn"
          >
            Send 4
          </button>
        );
      }

      render(
        <StorefrontProvider>
          <MultiNotifyConsumer />
        </StorefrontProvider>
      );

      fireEvent.click(screen.getByTestId("multi-notify-btn"));

      const items = await screen.findAllByText(/Message/);
      expect(items.length).toBeLessThanOrEqual(3);
      expect(screen.queryByText("Message 1")).not.toBeInTheDocument();
      expect(screen.getByText("Message 2")).toBeInTheDocument();
      expect(screen.getByText("Message 3")).toBeInTheDocument();
      expect(screen.getByText("Message 4")).toBeInTheDocument();
    });
  });
});
