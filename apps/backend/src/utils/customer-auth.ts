import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export interface CustomerTokenPayload {
  sub: string; // Customer ID
  email: string;
  role: "customer";
}

/**
 * Signs a customer session JWT with 30-day expiration.
 */
export function signCustomerToken(
  customer: { id: string; email: string },
  secret: string,
  expiresIn: string | number = "30d"
): string {
  const payload: CustomerTokenPayload = {
    sub: customer.id,
    email: customer.email.toLowerCase(),
    role: "customer",
  };

  const options: jwt.SignOptions = {
    expiresIn: "30d",
    issuer: "peralagae-customer-auth",
    audience: "peralagae-customer",
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verifies and decodes a customer session JWT.
 * Returns null if token is expired, invalid, or forged.
 */
export function verifyCustomerToken(
  token: string,
  secret: string
): CustomerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "peralagae-customer-auth",
      audience: "peralagae-customer",
    }) as CustomerTokenPayload;

    if (decoded && decoded.role === "customer" && decoded.sub && decoded.email) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure random token for password resets or sessions.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Creates a SHA-256 hash of a token for safe indexing in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
