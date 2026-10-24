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
  CreditCard,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStorefront } from "@/providers/storefront-provider";
import { formatInr } from "@/lib/utils";
import {
  OrderClientService,
  type RazorpayPublicConfig,
} from "@/services/order-client-service";
import { type Order, type RazorpayOrderData } from "@/types/order";
import { CustomerAuthService } from "@/services/customer-auth-service";
import { INDIAN_STATES } from "@/lib/profile-constants";

/**
 * Loads Razorpay Standard Checkout SDK dynamically
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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

  const [gstRate, setGstRate] = useState<number>(3.0);
  const [isGstInclusive, setIsGstInclusive] = useState<boolean>(true);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Tracks pending order created on server to enable safe retry without duplicate orders
  const [pendingOrderData, setPendingOrderData] = useState<{
    order: Order;
    razorpay: RazorpayOrderData;
  } | null>(null);

  // Set only after cryptographic server-side payment verification
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [gatewayConfig, setGatewayConfig] = useState<RazorpayPublicConfig | null>(null);

  const router = useRouter();
  const idempotencyRef = useRef<string>("");

  // Initialize unique idempotency key once per checkout session
  useEffect(() => {
    const key = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    idempotencyRef.current = key;
    setIdempotencyKey(key);
  }, []);

  // Fetch Razorpay public gateway config & pre-load Razorpay checkout script
  useEffect(() => {
    OrderClientService.getRazorpayConfig()
      .then((cfg) => setGatewayConfig(cfg))
      .catch(() => {});
    loadRazorpayScript().catch(() => {});
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
        if (!addressLine && customer.profile.streetAddress)
          setAddressLine(customer.profile.streetAddress);
        if (!city && customer.profile.city) setCity(customer.profile.city);
        if (!state && customer.profile.state) setState(customer.profile.state);
        if (!postalCode && customer.profile.pinCode)
          setPostalCode(customer.profile.pinCode);
      }
    }
  }, [customer, fullName, phone, addressLine, city, state, postalCode]);

  // Fallback: If customer.profile wasn't cached yet, fetch directly from MongoDB
  useEffect(() => {
    if (isAuthenticated && customer && !customer.profile) {
      CustomerAuthService.getProfile()
        .then((details) => {
          if (details?.profile) {
            setFullName(
              (prev) => prev || details.profile?.recipientName || details.fullName
            );
            setPhone((prev) => prev || details.profile?.phone || "");
            setAddressLine(
              (prev) => prev || details.profile?.streetAddress || ""
            );
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

  const totalPayableInr = subtotalInr + calculatedTaxInr;

  // Launches Razorpay modal with server-created order info
  const launchRazorpayCheckout = async (
    order: Order,
    razorpayInfo: RazorpayOrderData
  ) => {
    const isScriptReady = await loadRazorpayScript();
    if (!isScriptReady || !(window as any).Razorpay) {
      const errorMsg =
        "Payment gateway script could not be loaded. Please check your internet connection and try again.";
      setPaymentError(errorMsg);
      notify.error("Gateway Unavailable", { description: errorMsg });
      setIsPlacingOrder(false);
      return;
    }

    const options = {
      key: razorpayInfo.keyId || gatewayConfig?.keyId || "",
      amount: razorpayInfo.amount,
      currency: razorpayInfo.currency || "INR",
      name: "PERALAGAE",
      description: `Order #${order.orderNumber} - Insured Jewellery Purchase`,
      image: "/icon-192x192.png",
      order_id: razorpayInfo.orderId,
      prefill: {
        name: fullName.trim() || razorpayInfo.customer?.name || customer?.fullName || "",
        email: customer?.email || razorpayInfo.customer?.email || "",
        contact: phone.trim() || razorpayInfo.customer?.contact || "",
      },
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: customer?.id || "",
      },
      theme: {
        color: "#000000",
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay using UPI / QR Code",
              instruments: [
                {
                  method: "upi",
                },
              ],
            },
            other: {
              name: "Cards, NetBanking & Wallets",
              instruments: [
                {
                  method: "card",
                },
                {
                  method: "netbanking",
                },
                {
                  method: "wallet",
                },
              ],
            },
          },
          sequence: ["block.upi", "block.other"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        setIsVerifyingPayment(true);
        setPaymentError(null);
        try {
          // Cryptographically verify signature on backend
          const verification = await OrderClientService.verifyPayment({
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verification.verified) {
            clearCart();
            setPendingOrderData(null);
            setCompletedOrder(verification.order);
            notify.success("Payment verified successfully!", {
              description: `Order #${verification.order.orderNumber} confirmed.`,
            });
          } else {
            throw new Error("Payment signature verification failed on the server.");
          }
        } catch (err: unknown) {
          const error = err as Error;
          const msg =
            error?.message ||
            "Payment verification failed. If your account was debited, please contact customer support.";
          setPaymentError(msg);
          notify.error("Verification Error", { description: msg });
        } finally {
          setIsVerifyingPayment(false);
          setIsPlacingOrder(false);
        }
      },
      modal: {
        ondismiss: function () {
          setIsPlacingOrder(false);
          setPaymentError(
            "Payment checkout was closed before completing. You can retry safely whenever you are ready."
          );
          notify.info("Payment Pending", {
            description: "Click 'Retry Payment' to complete your order without placing a new one.",
          });
        },
      },
    };

    try {
      const rzpInstance = new (window as any).Razorpay(options);

      rzpInstance.on("payment.failed", function (response: any) {
        const failureReason =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment was declined or cancelled at the gateway.";
        setPaymentError(failureReason);
        notify.error("Payment Failed", { description: failureReason });
        setIsPlacingOrder(false);
      });

      rzpInstance.open();
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error?.message || "Failed to launch Razorpay checkout modal.";
      setPaymentError(msg);
      notify.error("Checkout Error", { description: msg });
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlacingOrder || isVerifyingPayment) return;
    setFormError(null);
    setPaymentError(null);

    // If an existing order was already initiated and is awaiting payment, retry with same order
    if (pendingOrderData?.order && pendingOrderData?.razorpay) {
      setIsPlacingOrder(true);
      await launchRazorpayCheckout(pendingOrderData.order, pendingOrderData.razorpay);
      return;
    }

    // Input validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      const msg = "Please enter your full recipient name.";
      setFormError(msg);
      notify.warning("Missing shipping details", { description: msg });
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      const msg = "Please enter a valid phone number for courier updates.";
      setFormError(msg);
      notify.warning("Invalid phone number", { description: msg });
      return;
    }
    if (!addressLine.trim() || addressLine.trim().length < 5) {
      const msg = "Please enter your complete street address.";
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
      // 1. Create order on server (authoritative amount, stock deduction, Razorpay order creation)
      const result = await OrderClientService.createOrder({
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

      if (!result.razorpay) {
        throw new Error(
          "Gateway payment initialization could not be created by the server."
        );
      }

      // Store in state so retries don't create duplicate orders
      setPendingOrderData({
        order: result.order,
        razorpay: result.razorpay,
      });

      // 2. Open official Razorpay Standard Checkout
      await launchRazorpayCheckout(result.order, result.razorpay);
    } catch (err: unknown) {
      const error = err as Error;
      const message = error?.message || "Failed to proceed to payment. Please try again.";
      setFormError(message);
      notify.error("Order Creation Failed", { description: message });
      setIsPlacingOrder(false);
    }
  };

  const handleResetPendingOrder = () => {
    setPendingOrderData(null);
    setPaymentError(null);
    setFormError(null);
    const newKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    idempotencyRef.current = newKey;
    setIdempotencyKey(newKey);
    notify.info("Reset Checkout", {
      description: "You can now edit your details and initiate a new order.",
    });
  };

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

  // Order Completed Confirmation View (rendered ONLY after verified payment)
  if (completedOrder) {
    return (
      <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-10 shadow-sm text-center">
          <div className="h-16 w-16 rounded-full bg-[#FAF8F5] text-[#15803D] flex items-center justify-center mx-auto mb-5 border border-[#DCFCE7]">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-[#15803D] uppercase mb-1">
            Payment Verified & Captured
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-2">
            Thank You for Your Order
          </h1>
          <p className="text-sm text-[#666666] mb-6">
            A confirmation receipt and insured tracking details have been generated for{" "}
            <span className="font-medium text-[#111111]">{customer?.email}</span>
          </p>

          <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Order Number:</span>
              <span className="font-semibold text-[#111111] font-mono">
                {completedOrder.orderNumber}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Total Paid:</span>
              <span className="font-semibold text-[#111111]">
                {formatInr(completedOrder.totalInr)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">GST (3% Included):</span>
              <span className="text-xs text-[#555555]">
                {completedOrder.gstRate || 3}% (+{formatInr(completedOrder.taxInr)})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Payment Gateway:</span>
              <span className="font-semibold text-[#111111]">Razorpay Standard Checkout</span>
            </div>
            {completedOrder.razorpayPaymentId && (
              <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
                <span className="text-[#666666]">Transaction ID:</span>
                <span className="font-mono text-xs text-[#333333]">
                  {completedOrder.razorpayPaymentId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm pb-2.5 border-b border-[#EAE6DF]">
              <span className="text-[#666666]">Payment Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                PAID (Verified)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Fulfilment Status:</span>
              <span className="font-medium text-[#111111]">
                {completedOrder.status || "PLACED"}
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

  // Empty cart view (only when not completed)
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

  return (
    <div className="min-h-screen bg-white py-10 sm:py-14 text-[#111111]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-black uppercase tracking-wider transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Cart</span>
          </Link>
          {gatewayConfig?.mode === "test" && (
            <span className="text-[11px] font-semibold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Razorpay Test Mode
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Shipping Address & Razorpay Checkout */}
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

            {/* Error alerts */}
            {formError && (
              <div
                role="alert"
                className="mb-6 p-4 bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] rounded-xl flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {paymentError && (
              <div
                role="alert"
                className="mb-6 p-4 bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] rounded-xl flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B45309]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#78350F]">Payment Notice</p>
                  <p className="mt-0.5">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Notification if pending order already created and awaiting retry */}
            {pendingOrderData && (
              <div className="mb-6 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#334155] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-[#64748B] shrink-0" />
                  <span>
                    Pending Order #<strong>{pendingOrderData.order.orderNumber}</strong> ready for payment.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetPendingOrder}
                  className="text-[11px] text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Start New
                </button>
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
                      disabled={Boolean(pendingOrderData)}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Phone Number (for Courier & OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={Boolean(pendingOrderData)}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Street Address & Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(pendingOrderData)}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Flat, House no., Building, Apartment, Street"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(pendingOrderData)}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(pendingOrderData)}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      list="checkout-indian-states"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
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
                      disabled={Boolean(pendingOrderData)}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full h-11 px-3.5 text-sm bg-white disabled:bg-[#F9F9F9] border border-[#DDDDDD] focus:border-black rounded-lg outline-none transition-colors"
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

              {/* Payment Method - Razorpay Standard Checkout */}
              <div className="pt-4 border-t border-[#EAE6DF]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    2. Payment Method
                  </h2>
                  <span className="text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Razorpay Secure</span>
                  </span>
                </div>

                <div className="border-2 border-[#111111] bg-[#FAF8F5] rounded-xl p-4 sm:p-5 relative shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#111111]">
                          UPI, Cards & NetBanking (Razorpay Standard)
                        </p>
                        <span className="text-[11px] font-medium text-[#15803D] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Instant UPI Priority</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                        Pay instantly via Google Pay, PhonePe, Paytm, BHIM, credit/debit cards, or net banking.
                        All transactions are 100% 256-bit encrypted and insured.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#444444]">
                        <span className="px-2.5 py-1 bg-white border border-[#EAE6DF] rounded-md flex items-center gap-1 font-medium">
                          <Smartphone className="h-3 w-3 text-[#15803D]" />
                          <span>Google Pay / PhonePe / BHIM</span>
                        </span>
                        <span className="px-2.5 py-1 bg-white border border-[#EAE6DF] rounded-md flex items-center gap-1 font-medium">
                          <CreditCard className="h-3 w-3 text-[#3B82F6]" />
                          <span>Visa / Mastercard / RuPay</span>
                        </span>
                      </div>

                      <div className="mt-3 p-2.5 bg-white border border-[#EAE6DF] rounded-lg text-[11px] text-[#777777] flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-[#C5A572] shrink-0" />
                        <span>
                          Cash on Delivery (COD) is strictly unavailable for insured jewellery shipments.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit / Pay CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPlacingOrder || isVerifyingPayment}
                  data-testid="place-order-button"
                  className="w-full py-4 bg-black hover:bg-[#222222] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment with Razorpay...</span>
                    </>
                  ) : isPlacingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Opening Razorpay Checkout...</span>
                    </>
                  ) : pendingOrderData ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry Payment with Razorpay ({formatInr(totalPayableInr)})</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Pay with Razorpay ({formatInr(totalPayableInr)})</span>
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
                <span>GST (3% Included):</span>
                <span className="font-medium text-[#333333]">+{formatInr(calculatedTaxInr)}</span>
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
