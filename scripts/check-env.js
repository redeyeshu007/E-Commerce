#!/usr/bin/env node
/**
 * scripts/check-env.js
 *
 * Validates that no real credentials have been committed to git.
 * Checks .env.example and committed files for obvious secret patterns.
 *
 * Run: node scripts/check-env.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// Patterns that should never appear in committed files
const FORBIDDEN_PATTERNS = [
  /sk_live_/i, // Stripe live key
  /pk_live_/i, // Stripe live publishable
  /AIza[0-9A-Za-z-_]{35}/, // Google API key
  /AKID[A-Z0-9]{16}/, // AWS access key
  /(?<![A-Z0-9])([A-Z0-9]{20})(?![A-Z0-9])/, // Generic 20-char uppercase
];

// Files to check (relative to root)
const FILES_TO_CHECK = [".env.example", "apps/frontend/.env.example", "apps/backend/.env.example"];

let hasErrors = false;

for (const relPath of FILES_TO_CHECK) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    // Skip comment lines
    if (line.trim().startsWith("#") || !line.includes("=")) return;

    const [, value = ""] = line.split("=");
    const trimmed = value.trim();

    // Skip obvious placeholders
    if (
      trimmed === "" ||
      trimmed.toUpperCase() === "PLACEHOLDER" ||
      trimmed.startsWith("REPLACE_") ||
      trimmed === "false" ||
      trimmed === "true"
    ) {
      return;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(trimmed)) {
        console.error(`FAIL: Possible real credential at ${relPath}:${i + 1}`);
        console.error(`  Line: ${line.trim()}`);
        hasErrors = true;
      }
    }
  });
}

if (hasErrors) {
  console.error("\n❌ Credential check FAILED. Review the files above.");
  process.exit(1);
} else {
  console.log("✅ Credential check passed — no obvious secrets found in example files.");
}
