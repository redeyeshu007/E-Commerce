import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../database/prisma.js";
import {
  signCustomerToken,
  verifyCustomerToken,
  generateSecureToken,
  hashToken,
} from "../utils/customer-auth.js";
import type { EnvConfig } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { EmailService } from "./email/email-service.js";

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  role: "customer";
  createdAt: Date;
  profile?: CustomerShippingProfile | null;
}

export interface CustomerShippingProfile {
  id: string;
  customerId?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerProfileDetails {
  customer: CustomerProfile;
  profile: CustomerShippingProfile | null;
  isProfileComplete: boolean;
}

export interface AuthSuccessResult {
  customer: CustomerProfile;
  token: string;
}

export class CustomerService {
  /**
   * Helper to format customer record without sensitive fields
   */
  private static formatCustomer(customer: {
    id: string;
    email: string;
    fullName: string;
    isEmailVerified: boolean;
    isProfileComplete?: boolean;
    role: string;
    createdAt: Date;
    profile?: any;
  }): CustomerProfile {
    return {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      isEmailVerified: customer.isEmailVerified,
      isProfileComplete: Boolean(customer.isProfileComplete && (!customer.profile || customer.profile.isComplete)),
      role: "customer",
      createdAt: customer.createdAt,
      profile: customer.profile
        ? {
          id: customer.profile.id,
          customerId: customer.profile.customerId,
          recipientName: customer.profile.recipientName,
          phone: customer.profile.phone,
          streetAddress: customer.profile.streetAddress,
          city: customer.profile.city,
          state: customer.profile.state,
          pinCode: customer.profile.pinCode,
          country: customer.profile.country || "India",
          isComplete: customer.profile.isComplete,
          createdAt: customer.profile.createdAt,
          updatedAt: customer.profile.updatedAt,
        }
        : null,
    };
  }

  /**
   * Registers a new customer with email and password
   */
  static async registerCustomer(
    data: {
      fullName: string;
      email: string;
      password: string;
    },
    env: EnvConfig,
    meta?: { userAgent?: string | undefined; ipAddress?: string | undefined }
  ): Promise<AuthSuccessResult> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanFullName = data.fullName.trim();

    if (!cleanFullName || cleanFullName.length < 2) {
      throw Object.assign(new Error("Full name must be at least 2 characters"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw Object.assign(new Error("A valid email address is required"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    if (!data.password || data.password.length < 8) {
      throw Object.assign(
        new Error("Password must be at least 8 characters"),
        { code: "VALIDATION_ERROR", status: 400 }
      );
    }

    // Check for existing customer with the same email
    const existing = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw Object.assign(
        new Error("An account with this email address already exists. Please sign in."),
        { code: "EMAIL_EXISTS", status: 409 }
      );
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create customer record (ALWAYS customer role) with unique unsubscribe token
    const unsubscribeToken = crypto.randomBytes(24).toString("hex");
    const customer = await prisma.customer.create({
      data: {
        email: normalizedEmail,
        fullName: cleanFullName,
        passwordHash,
        role: "customer",
        isEmailVerified: false,
        unsubscribeToken,
        emailCartRemindersEnabled: true,
        emailOrderUpdatesEnabled: true,
      },
    });

    // Create authenticated session
    const token = await this.createSession(customer.id, env, meta);

    // Asynchronously dispatch luxury welcome email (never blocks registration)
    try {
      await EmailService.sendWelcomeEmail({
        customerId: customer.id,
        email: customer.email,
        fullName: customer.fullName,
      });
    } catch (err) {
      logger.warn({ err, customerId: customer.id }, "Failed to send welcome email upon registration");
    }

    logger.info({ customerId: customer.id, email: customer.email }, "Customer registered successfully");

    return {
      customer: this.formatCustomer(customer),
      token,
    };
  }

  /**
   * Authenticates an existing customer with email and password
   */
  static async authenticateCustomer(
    credentials: {
      email: string;
      password: string;
    },
    env: EnvConfig,
    meta?: { userAgent?: string | undefined; ipAddress?: string | undefined }
  ): Promise<AuthSuccessResult> {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    // Constant-time dummy hash for timing attack mitigation if user is not found
    const DUMMY_HASH = "$2a$12$e8eYQv8gJ24w6wP8j3dCq.r06H0F7B5p.1C2d3E4f5G6h7I8j9k0l";

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    const targetHash = customer?.passwordHash || DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(credentials.password, targetHash);

    if (!customer || !customer.passwordHash || !passwordMatches) {
      throw Object.assign(new Error("Invalid email or password"), {
        code: "INVALID_CREDENTIALS",
        status: 401,
      });
    }

    const token = await this.createSession(customer.id, env, meta);

    logger.info({ customerId: customer.id, email: customer.email }, "Customer logged in successfully");

    return {
      customer: this.formatCustomer(customer),
      token,
    };
  }

  /**
   * Creates an active session for a customer and returns the JWT
   */
  static async createSession(
    customerId: string,
    env: EnvConfig,
    meta?: { userAgent?: string | undefined; ipAddress?: string | undefined }
  ): Promise<string> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const token = signCustomerToken(
      { id: customer.id, email: customer.email },
      env.CUSTOMER_JWT_SECRET,
      "30d"
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        token: hashToken(token), // Store hashed token for lookup
        expiresAt,
        userAgent: meta?.userAgent || null,
        ipAddress: meta?.ipAddress || null,
      },
    });

    return token;
  }

  /**
   * Validates a session token and returns the customer profile
   */
  static async validateSession(
    token: string,
    env: EnvConfig
  ): Promise<CustomerProfile | null> {
    if (!token) return null;

    const payload = verifyCustomerToken(token, env.CUSTOMER_JWT_SECRET);
    if (!payload || !payload.sub) {
      return null;
    }

    // Verify session exists and is not expired
    const hashed = hashToken(token);
    const session = await prisma.customerSession.findUnique({
      where: { token: hashed },
      include: {
        customer: {
          include: { profile: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Cleanup expired session
        await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => { });
      }
      return null;
    }

    if (!session.customer || session.customer.role !== "customer") {
      return null;
    }

    return this.formatCustomer(session.customer);
  }

  /**
   * Revokes a session (logout)
   */
  static async revokeSession(token: string): Promise<void> {
    if (!token) return;
    const hashed = hashToken(token);
    await prisma.customerSession.deleteMany({
      where: { token: hashed },
    }).catch(() => { });
  }

  /**
   * Revokes all sessions for a customer (e.g. after password reset)
   */
  static async revokeAllCustomerSessions(customerId: string): Promise<void> {
    await prisma.customerSession.deleteMany({
      where: { customerId },
    }).catch(() => { });
  }

  /**
   * Helper to hash numeric OTP securely with app secret
   */
  private static hashOtp(otp: string): string {
    const secret = process.env["CUSTOMER_JWT_SECRET"] || "peralagae_otp_salt_key_default";
    return crypto.createHmac("sha256", secret).update(otp.trim()).digest("hex");
  }

  /**
   * 1. Requests password reset OTP (6 digits, 10 min validity, secure hashed storage)
   */
  static async requestPasswordResetOtp(
    email: string
  ): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      // Privacy-preserving response
      return {
        success: true,
        message: "If an account exists with this email, a verification code has been sent.",
      };
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    let rawOtp: string | undefined;

    if (customer) {
      // Generate cryptographically secure 6-digit numeric OTP (100000 - 999999)
      rawOtp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = this.hashOtp(rawOtp);
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordResetOtpHash: otpHash,
          passwordResetOtpExpires: expires,
          passwordResetOtpAttempts: 0,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      logger.info(
        { customerId: customer.id, email: customer.email },
        "Password reset OTP issued and hashed"
      );

      // Dispatch OTP email via Nodemailer SMTP
      try {
        await EmailService.sendPasswordResetOtpEmail({
          email: customer.email,
          fullName: customer.fullName,
          otp: rawOtp,
          expiryMinutes: 10,
          customerId: customer.id,
        });
      } catch (err) {
        logger.error({ err, customerId: customer.id }, "Failed to dispatch password reset OTP email");
      }
    }

    return {
      success: true,
      message: "If an account exists with this email, a verification code has been sent.",
      ...(process.env["NODE_ENV"] === "test" && rawOtp ? { debugOtp: rawOtp } : {}),
    };
  }

  /**
   * 2. Verifies the OTP entered by customer
   */
  static async verifyPasswordResetOtp(
    email: string,
    otp: string
  ): Promise<{ success: boolean; valid: boolean; message: string }> {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim();

    if (!normalizedEmail || !cleanOtp) {
      throw Object.assign(new Error("Email and 6-digit verification code are required"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer || !customer.passwordResetOtpHash || !customer.passwordResetOtpExpires) {
      throw Object.assign(new Error("Verification code is invalid or has expired. Please request a new code."), {
        code: "INVALID_OTP",
        status: 400,
      });
    }

    // Rate limiting attempts: Max 5 incorrect attempts
    if (customer.passwordResetOtpAttempts >= 5) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordResetOtpHash: null,
          passwordResetOtpExpires: null,
          passwordResetOtpAttempts: 0,
        },
      });
      throw Object.assign(
        new Error("Too many incorrect attempts. This code has been invalidated. Please request a new code."),
        { code: "OTP_MAX_ATTEMPTS_EXCEEDED", status: 400 }
      );
    }

    // Expiry check
    if (customer.passwordResetOtpExpires < new Date()) {
      throw Object.assign(new Error("Verification code has expired. Please request a new code."), {
        code: "EXPIRED_OTP",
        status: 400,
      });
    }

    // Constant-time hash comparison
    const incomingHash = this.hashOtp(cleanOtp);
    const expectedBuffer = Buffer.from(customer.passwordResetOtpHash, "hex");
    const incomingBuffer = Buffer.from(incomingHash, "hex");

    const matches =
      expectedBuffer.length === incomingBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, incomingBuffer);

    if (!matches) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordResetOtpAttempts: { increment: 1 },
        },
      });

      const remaining = 5 - (customer.passwordResetOtpAttempts + 1);
      throw Object.assign(
        new Error(
          remaining > 0
            ? `Invalid verification code. ${remaining} attempt(s) remaining.`
            : "Invalid verification code. Maximum attempts reached. Please request a new code."
        ),
        { code: "INVALID_OTP", status: 400 }
      );
    }

    return {
      success: true,
      valid: true,
      message: "Verification code verified successfully.",
    };
  }

  /**
   * 3. Completes password reset using verified OTP
   */
  static async resetPasswordWithOtp(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify OTP first
    await this.verifyPasswordResetOtp(email, otp);

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!newPassword || newPassword.length < 8) {
      throw Object.assign(
        new Error("New password must be at least 8 characters with letters & numbers"),
        { code: "VALIDATION_ERROR", status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      throw Object.assign(new Error("Customer account not found"), {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetOtpHash: null,
        passwordResetOtpExpires: null,
        passwordResetOtpAttempts: 0,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Invalidate all active customer sessions for security
    await this.revokeAllCustomerSessions(customer.id);

    logger.info({ customerId: customer.id }, "Customer password reset via OTP completed successfully");

    return {
      success: true,
      message: "Password has been reset successfully. Please sign in with your new password.",
    };
  }

  /**
   * Initiates password reset by issuing OTP (and legacy debugToken for existing tests)
   */
  static async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; debugToken?: string; debugOtp?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return {
        success: true,
        message: "If an account exists with this email, password reset instructions have been sent.",
      };
    }

    const otpResult = await this.requestPasswordResetOtp(normalizedEmail);

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    let rawToken: string | undefined;

    if (customer) {
      rawToken = generateSecureToken(32);
      const hashedToken = hashToken(rawToken);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expires,
        },
      });
    }

    return {
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
      ...(process.env["NODE_ENV"] === "test" && rawToken ? { debugToken: rawToken } : {}),
      ...(process.env["NODE_ENV"] === "test" && otpResult.debugOtp ? { debugOtp: otpResult.debugOtp } : {}),
    };
  }

  /**
   * Completes password reset using single-use token or OTP
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    email?: string
  ): Promise<{ success: boolean; message: string }> {
    // If token is a 6-digit numeric OTP and email is provided, delegate to OTP reset
    if (/^\d{6}$/.test(token.trim()) && email) {
      return this.resetPasswordWithOtp(email, token, newPassword);
    }

    if (!token || !token.trim()) {
      throw Object.assign(new Error("Password reset token is required"), {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    }

    if (!newPassword || newPassword.length < 8) {
      throw Object.assign(
        new Error("New password must be at least 8 characters with letters & numbers"),
        { code: "VALIDATION_ERROR", status: 400 }
      );
    }

    const hashedToken = hashToken(token.trim());

    const customer = await prisma.customer.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!customer) {
      throw Object.assign(
        new Error("Password reset link is invalid or has expired. Please request a new link."),
        { code: "INVALID_RESET_TOKEN", status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        passwordResetOtpHash: null,
        passwordResetOtpExpires: null,
      },
    });

    // Invalidate all active sessions for security
    await this.revokeAllCustomerSessions(customer.id);

    logger.info({ customerId: customer.id }, "Customer password reset completed successfully");

    return {
      success: true,
      message: "Password has been reset successfully. Please sign in with your new password.",
    };
  }

  /**
   * Verifies Google token or authorization code and authenticates the customer
   */
  static async authenticateGoogle(
    payload: {
      credential?: string | undefined; // Google ID Token
      code?: string | undefined;       // Authorization Code
      redirectUri?: string | undefined;
    },
    env: EnvConfig,
    meta?: { userAgent?: string | undefined; ipAddress?: string | undefined }
  ): Promise<AuthSuccessResult> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw Object.assign(
        new Error(
          "Google Sign-In is pending server configuration (GOOGLE_CLIENT_ID). Please use your email and password."
        ),
        { code: "GOOGLE_NOT_CONFIGURED", status: 503 }
      );
    }

    let googleUser: {
      sub: string;
      email: string;
      email_verified?: boolean | string | undefined;
      name?: string | undefined;
    } | null = null;

    if (payload.credential) {
      // 1. Verify Google ID token via Google's tokeninfo API
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
            payload.credential
          )}`
        );

        if (!verifyRes.ok) {
          throw new Error("Google token verification failed");
        }

        const data = (await verifyRes.json()) as Record<string, any>;

        // Validate audience matches configured Google Client ID
        if (data["aud"] !== env.GOOGLE_CLIENT_ID) {
          throw new Error("Google token audience mismatch");
        }

        googleUser = {
          sub: String(data["sub"]),
          email: String(data["email"]),
          email_verified: data["email_verified"] as boolean | string | undefined,
          name: data["name"] as string | undefined,
        };
      } catch (err: unknown) {
        logger.warn({ err }, "Google ID token verification failed");
        throw Object.assign(
          new Error("Invalid or expired Google authentication credentials."),
          { code: "INVALID_GOOGLE_CREDENTIAL", status: 401 }
        );
      }
    } else if (payload.code) {
      // 2. Exchange authorization code for token
      if (!env.GOOGLE_CLIENT_SECRET) {
        throw Object.assign(
          new Error("Google OAuth code exchange requires GOOGLE_CLIENT_SECRET on server."),
          { code: "GOOGLE_SECRET_MISSING", status: 503 }
        );
      }

      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: payload.code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: payload.redirectUri || "http://localhost:3000/api/auth/callback/google",
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          throw new Error("Failed to exchange code for tokens");
        }

        const tokenData = (await tokenRes.json()) as Record<string, any>;
        const idToken = String(tokenData["id_token"]);

        const infoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (!infoRes.ok) {
          throw new Error("Failed to inspect Google ID token");
        }

        const infoData = (await infoRes.json()) as Record<string, any>;
        googleUser = {
          sub: String(infoData["sub"]),
          email: String(infoData["email"]),
          email_verified: infoData["email_verified"] as boolean | string | undefined,
          name: infoData["name"] as string | undefined,
        };
      } catch (err: unknown) {
        logger.warn({ err }, "Google OAuth code exchange failed");
        throw Object.assign(
          new Error("Google OAuth code validation failed. Please try again."),
          { code: "GOOGLE_OAUTH_FAILED", status: 400 }
        );
      }
    } else {
      throw Object.assign(
        new Error("Either Google credential or authorization code is required."),
        { code: "VALIDATION_ERROR", status: 400 }
      );
    }

    if (!googleUser || !googleUser.email) {
      throw Object.assign(new Error("Unable to retrieve verified email from Google account."), {
        code: "GOOGLE_EMAIL_MISSING",
        status: 400,
      });
    }

    const isVerified =
      googleUser.email_verified === true || googleUser.email_verified === "true";

    if (!isVerified) {
      throw Object.assign(
        new Error("Google account email is not verified. Please verify your Google account first."),
        { code: "UNVERIFIED_EMAIL", status: 400 }
      );
    }

    const normalizedEmail = googleUser.email.trim().toLowerCase();
    const fullName = googleUser.name?.trim() || normalizedEmail.split("@")[0] || "Customer";

    // 1. Check if user with this googleId already exists
    let customer = await prisma.customer.findFirst({
      where: { googleId: googleUser.sub },
    });

    if (!customer) {
      // 2. Check if user exists with matching email
      const existingEmailCustomer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmailCustomer) {
        // Link Google ID securely because Google has verified the email ownership
        customer = await prisma.customer.update({
          where: { id: existingEmailCustomer.id },
          data: {
            googleId: googleUser.sub,
            isEmailVerified: true,
          },
        });
      } else {
        // 3. Create new customer with verified Google identity
        customer = await prisma.customer.create({
          data: {
            email: normalizedEmail,
            fullName,
            googleId: googleUser.sub,
            isEmailVerified: true,
            role: "customer",
          },
        });
      }
    }

    const token = await this.createSession(customer.id, env, meta);

    logger.info({ customerId: customer.id, email: customer.email }, "Google authentication successful");

    return {
      customer: this.formatCustomer(customer),
      token,
    };
  }

  /**
   * Generates Google OAuth authorization URL with state
   */
  static getGoogleAuthUrl(
    env: EnvConfig,
    redirectUri: string,
    state?: string
  ): { url: string; state: string } {
    if (!env.GOOGLE_CLIENT_ID) {
      throw Object.assign(
        new Error("Google Sign-In is pending environment configuration (GOOGLE_CLIENT_ID)."),
        { code: "GOOGLE_NOT_CONFIGURED", status: 503 }
      );
    }

    const secureState = state || generateSecureToken(16);
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: secureState,
      access_type: "online",
      prompt: "select_account",
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state: secureState,
    };
  }

  /**
   * Retrieves raw default shipping profile for a customer
   */
  static async getProfile(customerId: string): Promise<CustomerShippingProfile | null> {
    if (!customerId) return null;
    return prisma.customerProfile.findUnique({
      where: { customerId },
    });
  }

  /**
   * Retrieves customer details and full shipping profile for account overview
   */
  static async getFullProfile(customerId: string): Promise<CustomerProfileDetails | null> {
    if (!customerId) return null;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { profile: true },
    });
    if (!customer) return null;

    const isComplete = Boolean(customer.isProfileComplete && customer.profile?.isComplete);

    const formattedProfile = customer.profile
      ? {
        id: customer.profile.id,
        customerId: customer.profile.customerId,
        recipientName: customer.profile.recipientName,
        phone: customer.profile.phone,
        streetAddress: customer.profile.streetAddress,
        city: customer.profile.city,
        state: customer.profile.state,
        pinCode: customer.profile.pinCode,
        country: customer.profile.country || "India",
        isComplete: customer.profile.isComplete,
        createdAt: customer.profile.createdAt,
        updatedAt: customer.profile.updatedAt,
      }
      : null;

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        isEmailVerified: customer.isEmailVerified,
        isProfileComplete: isComplete,
        role: "customer",
        createdAt: customer.createdAt,
        profile: formattedProfile,
      },
      profile: formattedProfile,
      isProfileComplete: isComplete,
    };
  }

  /**
   * Saves or updates default shipping profile and customer name in MongoDB
   */
  static async saveProfile(
    customerId: string,
    input: {
      fullName?: string | undefined;
      recipientName: string;
      phone: string;
      streetAddress: string;
      city: string;
      state: string;
      pinCode: string;
      country?: string | undefined;
    }
  ): Promise<CustomerProfileDetails> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw Object.assign(new Error("Customer account not found"), { status: 404, code: "NOT_FOUND" });
    }

    const cleanedPhone = input.phone.replace(/[\s\-\(\)]/g, "").replace(/^(\+91|0)/, "");
    const cleanedPin = input.pinCode.replace(/\s+/g, "");
    const cleanedCountry = (input.country || "India").trim();
    const cleanedRecipient = input.recipientName.trim();
    const cleanedStreet = input.streetAddress.trim();
    const cleanedCity = input.city.trim();
    const cleanedState = input.state.trim();
    const newFullName = input.fullName ? input.fullName.trim() : customer.fullName;

    // Upsert CustomerProfile in MongoDB
    const profile = await prisma.customerProfile.upsert({
      where: { customerId },
      create: {
        customerId,
        recipientName: cleanedRecipient,
        phone: cleanedPhone,
        streetAddress: cleanedStreet,
        city: cleanedCity,
        state: cleanedState,
        pinCode: cleanedPin,
        country: cleanedCountry,
        isComplete: true,
      },
      update: {
        recipientName: cleanedRecipient,
        phone: cleanedPhone,
        streetAddress: cleanedStreet,
        city: cleanedCity,
        state: cleanedState,
        pinCode: cleanedPin,
        country: cleanedCountry,
        isComplete: true,
      },
    });

    // Update Customer record: name and isProfileComplete = true
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        fullName: newFullName,
        isProfileComplete: true,
      },
    });

    logger.info({ customerId, email: updatedCustomer.email }, "Customer profile saved successfully in MongoDB");

    return {
      customer: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        fullName: updatedCustomer.fullName,
        isEmailVerified: updatedCustomer.isEmailVerified,
        isProfileComplete: true,
        role: "customer",
        createdAt: updatedCustomer.createdAt,
        profile,
      },
      profile,
      isProfileComplete: true,
    };
  }
}
