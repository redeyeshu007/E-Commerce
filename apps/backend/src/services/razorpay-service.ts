import crypto from "node:crypto";
import Razorpay from "razorpay";
import { validatePaymentVerification, validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import type { EnvConfig } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface CreateRazorpayOrderInput {
  amountPaise: number; // Exact amount in paise (1 INR = 100 paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | undefined;
  status: string;
  isMock?: boolean | undefined;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayPaymentDetails {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string; // "captured", "authorized", "failed"
  method?: string;
  email?: string;
  contact?: string;
  captured?: boolean;
  errorDescription?: string;
}

export class RazorpayService {
  private razorpayInstance: Razorpay | null = null;
  private env: EnvConfig;

  constructor(env: EnvConfig) {
    this.env = env;

    if (this.isConfigured()) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: this.env.RAZORPAY_KEY_ID,
          key_secret: this.env.RAZORPAY_KEY_SECRET,
        });
        logger.info(
          { mode: this.env.RAZORPAY_MODE, keyIdPrefix: this.env.RAZORPAY_KEY_ID.substring(0, 8) },
          "Razorpay SDK initialized successfully"
        );
      } catch (err) {
        logger.error({ err }, "Failed to initialize Razorpay SDK instance");
        this.razorpayInstance = null;
      }
    } else {
      logger.warn(
        { mode: this.env.RAZORPAY_MODE },
        "Razorpay credentials not fully set or are placeholders. Test mode mock enabled."
      );
    }
  }

  /**
   * Checks if valid non-placeholder credentials are provided
   */
  public isConfigured(): boolean {
    const key = this.env.RAZORPAY_KEY_ID?.trim() || "";
    const secret = this.env.RAZORPAY_KEY_SECRET?.trim() || "";
    const isPlaceholder =
      key.includes("placeholder") ||
      key.includes("YOUR_") ||
      secret.includes("placeholder") ||
      secret.includes("YOUR_") ||
      key.length < 8 ||
      secret.length < 8;

    return !isPlaceholder;
  }

  /**
   * Returns public configuration safe to send to the browser
   */
  public getPublicConfig() {
    return {
      keyId: this.env.RAZORPAY_KEY_ID,
      mode: this.env.RAZORPAY_MODE,
      currency: "INR",
      isLive: this.env.RAZORPAY_MODE === "live",
    };
  }

  /**
   * Creates a Razorpay Order through the server-side API.
   * Never trust client prices or client currency.
   */
  public async createOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrderResult> {
    const { amountPaise, currency = "INR", receipt, notes = {} } = input;

    if (!amountPaise || amountPaise <= 0 || !Number.isInteger(amountPaise)) {
      throw Object.assign(new Error("Amount in paise must be a positive integer"), {
        code: "INVALID_AMOUNT",
        status: 400,
      });
    }

    if (this.razorpayInstance && this.isConfigured()) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: amountPaise,
          currency,
          receipt,
          notes,
        });

        logger.info(
          { razorpayOrderId: order.id, amountPaise, receipt },
          "Razorpay order created via official SDK"
        );

        return {
          id: order.id,
          amount: Number(order.amount),
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          isMock: false,
        };
      } catch (err: unknown) {
        logger.error({ err, receipt }, "Razorpay order creation failed via official SDK");
        const error = err as { statusCode?: number; error?: { description?: string; code?: string } };
        throw Object.assign(
          new Error(error.error?.description || "Failed to create order with payment gateway"),
          {
            code: error.error?.code || "RAZORPAY_ORDER_FAILED",
            status: error.statusCode || 502,
          }
        );
      }
    }

    // In local development or automated tests without live keys, generate deterministic mock Razorpay order
    const mockId = `order_test_${receipt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}_${Date.now().toString(36)}`;
    logger.info(
      { mockId, amountPaise, receipt },
      "Generated mock Razorpay order for test/development mode"
    );

    return {
      id: mockId,
      amount: amountPaise,
      currency,
      receipt,
      status: "created",
      isMock: true,
    };
  }

  /**
   * Fetches payment details from Razorpay API to verify status and amount
   */
  public async fetchPayment(paymentId: string): Promise<RazorpayPaymentDetails | null> {
    if (!paymentId || typeof paymentId !== "string") {
      return null;
    }

    if (this.razorpayInstance && this.isConfigured()) {
      try {
        const payment = (await this.razorpayInstance.payments.fetch(paymentId)) as any;
        return {
          id: payment.id,
          orderId: payment.order_id,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          captured: Boolean(payment.captured),
          errorDescription: payment.error_description || undefined,
        };
      } catch (err) {
        logger.warn({ err, paymentId }, "Failed to fetch payment from Razorpay API");
        return null;
      }
    }

    // Mock fallback when keys are not configured
    return {
      id: paymentId,
      orderId: "",
      amount: 0,
      currency: "INR",
      status: "captured",
      captured: true,
    };
  }

  /**
   * Cryptographically verifies the payment signature using HMAC-SHA256.
   * Uses both timingSafeEqual and the official Razorpay utility.
   */
  public verifyPaymentSignature(input: VerifyPaymentInput): boolean {
    const { orderId, paymentId, signature } = input;

    if (!orderId || !paymentId || !signature) {
      return false;
    }

    const secret = this.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return false;
    }

    // Official algorithm: HMAC-SHA256 of `${order_id}|${payment_id}` using key_secret
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Timing-safe comparison to prevent side-channel timing attacks
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    const isMatch = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isMatch) {
      // Also try SDK utility as secondary confirmation
      try {
        return validatePaymentVerification(
          { order_id: orderId, payment_id: paymentId },
          signature,
          secret
        );
      } catch {
        return false;
      }
    }

    return isMatch;
  }

  /**
   * Verifies Razorpay Webhook signature using raw request body and RAZORPAY_WEBHOOK_SECRET.
   */
  public verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    const secret = this.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return false;
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyStr)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    const isMatch = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isMatch) {
      try {
        return validateWebhookSignature(bodyStr, signature, secret);
      } catch {
        return false;
      }
    }

    return isMatch;
  }

  /**
   * Helper to generate a valid test signature for automated tests
   */
  public generateTestSignature(orderId: string, paymentId: string): string {
    return crypto
      .createHmac("sha256", this.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  }

  /**
   * Helper to generate a valid test webhook signature for automated tests
   */
  public generateTestWebhookSignature(body: string | Buffer): string {
    const bodyStr = Buffer.isBuffer(body) ? body.toString("utf8") : body;
    return crypto
      .createHmac("sha256", this.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyStr)
      .digest("hex");
  }
}
