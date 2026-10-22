"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  ArrowLeft,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStorefront } from "@/providers/storefront-provider";
import { formatInr } from "@/lib/utils";
import { OrderClientService } from "@/services/order-client-service";
import { type Order } from "@/types/order";
import { CustomerAuthService } from "@/services/customer-auth-service";
import { INDIAN_STATES } from "@/lib/profile-constants";

export default function CheckoutPage() {
  const {
    customer,
    isAuthenticated,
    isCustomerAuthLoading,
    cartItems,
    subtotalInr,
    clearCart,
    openAuthModal,
    notify,
  } = useStorefront();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const country = "India";
  const paymentMethod = "UPI"; // Strictly UPI only. COD is not available.

  const [gstRate, setGstRate] = useState<number>(3.0);
  const [isGstInclusive, setIsGstInclusive] = useState<boolean>(true);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const router = useRouter();
  const idempotencyRef = useRef<string>("");

  // Initialize unique idempotency key once per checkout session
  useEffect(() => {
    const key = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    idempotencyRef.current = key;
    setIdempotencyKey(key);
  }, []);

  // Fetch active GST rate from MongoDB setting
  useEffect(() => {
    fetch("/api/v1/gst/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data?.setting) {
          setGstRate(Number(data.data.setting.percentage) || 3.0);
          setIsGstInclusive(Boolean(data.data.setting.isInclusive));
        }
      })
      .catch(() => {});
  }, []);

  // Redirect incomplete profiles to setup
  useEffect(() => {
    if (!isCustomerAuthLoading && isAuthenticated && customer) {
      if (!customer.isProfileComplete) {
        router.push("/profile/setup?returnUrl=/checkout");
      }
    }
  }, [isCustomerAuthLoading, isAuthenticated, customer, router]);

  // Auto-fill shipping address from verified customer profile
  useEffect(() => {
    if (customer) {
      if (!fullName) {
        setFullName(customer.profile?.recipientName || customer.fullName || "");
      }
      if (customer.profile) {
        if (!phone && customer.profile.phone) setPhone(customer.profile.phone);
        if (!addressLine && customer.profile.streetAddress) setAddressLine(customer.profile.streetAddress);
        if (!city && customer.profile.city) setCity(customer.profile.city);
        if (!state && customer.profile.state) setState(customer.profile.state);
        if (!postalCode && customer.profile.pinCode) setPostalCode(customer.profile.pinCode);
      }
    }
  }, [customer, fullName, phone, addressLine, city, state, postalCode]);

  // Fallback: If customer.profile wasn't cached yet, fetch directly from MongoDB
  useEffect(() => {
    if (isAuthenticated && customer && !customer.profile) {
      CustomerAuthService.getProfile()
        .then((details) => {
          if (details?.profile) {
            setFullName((prev) => prev || details.profile?.recipientName || details.fullName);
            setPhone((prev) => prev || details.profile?.phone || "");
            setAddressLine((prev) => prev || details.profile?.streetAddress || "");
            setCity((prev) => prev || details.profile?.city || "");
            setState((prev) => prev || details.profile?.state || "");
            setPostalCode((prev) => prev || details.profile?.pinCode || "");
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, customer]);

  // If user is a guest, prompt login modal with returnUrl = "/checkout"
  useEffect(() => {
    if (!isCustomerAuthLoading && !isAuthenticated) {
      openAuthModal("login", "/checkout");
    }
  }, [isCustomerAuthLoading, isAuthenticated, openAuthModal]);

  // Calculate inclusive GST snapshot amount for display
  const calculatedTaxInr = isGstInclusive
    ? Math.round((subtotalInr - subtotalInr / (1 + gstRate / 100)) * 100) / 100
    : Math.round((subtotalInr * (gstRate / 100)) * 100) / 100;

  const totalPayableInr = isGstInclusive ? subtotalInr : subtotalInr + calculatedTaxInr;

  // Loading customer session check
  if (isCustomerAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C5A572] mb-3" />
        <p className="text-sm text-[#666666]">Verifying customer authentication...</p>
      </div>
    );
  }

  // Guest prompt view
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="h-14 w-14 rounded-full bg-[#FAF8F5] text-[#C5A572] flex items-center justify-center mb-5 border border-[#EAE6DF]">
          <Lock className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-3">
          Sign In to Complete Checkout
        </h1>
        <p className="text-sm text-[#666666] leading-relaxed mb-6">
          To ensure the insured delivery and security of your PERALAGAE jewellery orders,
          please sign in or create an account to proceed.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login", "/checkout")}
          className="px-8 py-3.5 bg-black hover:bg-[#222222] text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Order Completed Confirmation View
  if (completedOrder) {
    return (
      <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-10 shadow-sm text-center">
          <div className="h-16 w-16 rounded-full bg-[#FAF8F5] text-[#C5A572] flex items-center justify-center mx-auto mb-5 border border-[#EAE6DF]">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-[#C5A572] uppercase mb-1">
            Test Order Placed
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-2">
            Thank You for Your Order
          </h1>
          <p className="text-sm text-[#666666] mb-6">
            A confirmation receipt has been generated for{" "}
            <span className="font-medium text-[#111111]">{customer?.email}</span>
          </p>

          <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Order Number:</span>
              <span className="font-semibold text-[#111111] font-mono">{completedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Total Amount:</span>
              <span className="font-semibold text-[#111111]">
                {formatInr(completedOrder.totalInr)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">GST Breakdown:</span>
              <span className="text-xs text-[#555555]">
                {completedOrder.gstRate}% included ({formatInr(completedOrder.taxInr)})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Delivery Method:</span>
              <span className="font-medium text-[#15803D]">
                Insured Express Delivery (Free)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Payment Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                SIMULATED (Test Order)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/orders/${completedOrder.id}`}
              className="px-7 py-3.5 bg-black hover:bg-[#222222] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Track Order</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/orders"
              className="px-6 py-3.5 bg-white border border-[#E5E5E5] hover:bg-[#FAF8F5] text-[#222222] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3.5 bg-white border border-[#E5E5E5] hover:bg-[#FAF8F5] text-[#222222] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="h-16 w-16 rounded-full bg-[#FAF8F5] text-[#666666] flex items-center justify-center mb-5 border border-[#EAE6DF]">
          <ShoppingBag className="h-7 w-7 stroke-[1.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-sm text-[#666666] leading-relaxed mb-6">
          Explore our signature jewellery collection and add pieces to your cart to begin checkout.
        </p>
        <Link
          href="/shop"
          className="px-8 py-3.5 bg-black hover:bg-[#222222] text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlacingOrder) return; // Concurrency/idempotency protection against rapid repeated clicks
    setFormError(null);

    // Frontend validation with notifications
    if (!fullName.trim() || fullName.trim().length < 2) {
      const msg = "Please enter your full recipient name.";
      setFormError(msg);
      notify.warning("Missing shipping details", { description: msg });
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      const msg = "Please enter a valid phone number for delivery updates.";
      setFormError(msg);
      notify.warning("Invalid phone number", { description: msg });
      return;
    }
    if (!addressLine.trim() || addressLine.trim().length < 5) {
      const msg = "Please enter your full street address.";
      setFormError(msg);
      notify.warning("Missing street address", { description: msg });
      return;
    }
    if (!city.trim()) {
      const msg = "Please enter your city.";
      setFormError(msg);
      notify.warning("Missing city", { description: msg });
      return;
    }
    if (!state.trim()) {
      const msg = "Please enter your state.";
      setFormError(msg);
      notify.warning("Missing state", { description: msg });
      return;
    }
    if (!postalCode.trim() || postalCode.trim().length < 4) {
      const msg = "Please enter a valid PIN / postal code.";
      setFormError(msg);
      notify.warning("Invalid PIN code", { description: msg });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const order = await OrderClientService.createOrder({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || "India",
        },
        paymentMethod: "UPI",
        idempotencyKey: idempotencyRef.current || idempotencyKey,
      });

      clearCart();
      setCompletedOrder(order);
      notify.success("Test order placed successfully!", {
        description: `Order #${order.orderNumber} created under UPI simulation.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      const message = error?.message || "Failed to place order. Please try again.";
      setFormError(message);
      notify.error("Order placement failed", {
        description: message,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-10 sm:py-14 text-[#111111]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-black uppercase tracking-wider transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Shipping Address & UPI Simulation Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-9 rounded-2xl border border-[#E8E8E8] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#EAE6DF] pb-5 mb-6">
              <h1 className="text-xl sm:text-2xl font-serif text-[#111111]">
                Insured Express Checkout
              </h1>
              <p className="text-xs text-[#777777] mt-1">
                Ordering as{" "}
                <span className="font-semibold text-[#111111]">{customer?.fullName}</span> (
                {customer?.email})
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-6 p-4 bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] rounded-xl flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Shipping Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    1. Shipping Address
                  </h2>
                  {customer?.profile && (
                    <span className="text-[11px] text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7] flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified Profile</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Phone Number (for Courier & OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Street Address & Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Flat, House no., Building, Apartment, Street"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      list="checkout-indian-states"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                    <datalist id="checkout-indian-states">
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full h-11 px-3.5 text-sm bg-white border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value={country}
                      className="w-full h-11 px-3.5 text-sm bg-[#F9F9F9] border border-[#E5E5E5] text-[#777777] rounded-lg cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method - UPI Simulation Mode */}
              <div className="pt-4 border-t border-[#EAE6DF]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    2. Payment Method
                  </h2>
                  <span className="text-[11px] font-semibold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Testing Phase
                  </span>
                </div>

                <div className="border-2 border-[#111111] bg-[#FAF8F5] rounded-xl p-4 sm:p-5 relative shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#111111]">
                          UPI — Payment Simulation
                        </p>
                        <span className="text-[11px] font-medium text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                          Simulated Test Mode
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                        Cash on Delivery (COD) is strictly unavailable. This checkout simulates an instant UPI
                        order transaction without debiting your real bank account.
                      </p>
                      <div className="mt-3 p-3 bg-white border border-[#EAE6DF] rounded-lg text-[11px] text-[#777777] space-y-1">
                        <div className="flex items-center gap-1.5 text-[#B45309] font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Testing Phase Notice</span>
                        </div>
                        <p>
                          Order status will be created as <strong>PLACED</strong> and payment recorded as{" "}
                          <strong>SIMULATED</strong> in MongoDB. It is not marked as real verified money.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  data-testid="place-order-button"
                  className="w-full py-4 bg-black hover:bg-[#222222] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Simulated Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Confirm Test Order ({formatInr(totalPayableInr)})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary with GST Breakdown */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#EAE6DF] shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111] pb-4 border-b border-[#EAE6DF]">
              Order Summary ({cartItems.length} {cartItems.length === 1 ? "Item" : "Items"})
            </h2>

            {/* Cart Items List */}
            <div className="divide-y divide-[#EAE6DF] max-h-96 overflow-y-auto py-2">
              {cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="relative h-16 w-16 bg-[#FAF8F5] rounded-lg overflow-hidden border border-[#EAE6DF] shrink-0">
                    {item.product.image?.src ? (
                      <Image
                        src={item.product.image.src}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-[#888888]">
                        PERALAGAE
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111111] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-[#777777] mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#111111]">
                      {formatInr(item.product.priceInr * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & GST Breakdown */}
            <div className="border-t border-[#EAE6DF] pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-[#666666]">
                <span>Item Subtotal</span>
                <span className="font-medium text-[#111111]">{formatInr(subtotalInr)}</span>
              </div>

              <div className="flex justify-between text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-[#15803D]" />
                  <span>Insured Express Shipping</span>
                </span>
                <span className="font-semibold text-[#15803D] uppercase text-xs">Free</span>
              </div>

              <div className="flex justify-between text-xs text-[#777777] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE6DF]">
                <span>GST ({gstRate}%) Included:</span>
                <span className="font-medium text-[#333333]">{formatInr(calculatedTaxInr)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#111111] pt-3 border-t border-[#EAE6DF]">
                <span>Final Payable Total</span>
                <span>{formatInr(totalPayableInr)}</span>
              </div>
            </div>

            {/* Trust Assurance */}
            <div className="mt-6 pt-5 border-t border-[#EAE6DF] space-y-2 text-xs text-[#777777]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C5A572] shrink-0" />
                <span>100% Certified 22K/18K Hallmarked Jewellery</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#C5A572] shrink-0" />
                <span>Transit Insured Express Delivery across India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
