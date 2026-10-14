import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Authentication utilities for PERALAGAE Admin Authentication.
 *
 * Implements:
 * - Secure password hashing and verification using bcrypt (cost factor 12)
 * - Safe constant-time comparisons
 * - JWT issuance and verification for server-managed admin sessions
 */

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: "admin";
}

/**
 * Generates a secure bcrypt salt and hashes the plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compares a candidate password against a target password or bcrypt hash.
 * If target is already a bcrypt hash ($2a$ or $2b$), compares with bcrypt.compare.
 * If target is a plaintext string (from environment variable), hashes it or compares securely.
 */
export async function verifyPassword(candidate: string, target: string): Promise<boolean> {
  if (!candidate || !target) {
    return false;
  }

  // If target looks like a bcrypt hash ($2a$ or $2b$ or $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(target)) {
    return bcrypt.compare(candidate, target);
  }

  // If target is an env plaintext password, compare candidate against it using bcrypt
  // by hashing the target or comparing with constant-time check
  const candidateHash = await hashPassword(candidate);
  return bcrypt.compare(target, candidateHash);
}

/**
 * Signs an admin session JWT with 24h expiration.
 */
export function signAdminToken(
  admin: { email: string },
  secret: string,
  expiresIn: number | `${number}h` | `${number}d` = "24h",
): string {
  const payload: AdminTokenPayload = {
    sub: "admin",
    email: admin.email.toLowerCase(),
    role: "admin",
  };

  const options: jwt.SignOptions = {
    expiresIn,
    issuer: "peralagae-auth",
    audience: "peralagae-admin",
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verifies and decodes an admin session JWT.
 * Returns null if token is expired, invalid, or forged.
 */
export function verifyAdminToken(token: string, secret: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "peralagae-auth",
      audience: "peralagae-admin",
    }) as AdminTokenPayload;

    if (decoded && decoded.role === "admin" && decoded.email) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
