#!/usr/bin/env node
/**
 * scripts/check-circular-deps.js
 *
 * Checks for obvious circular workspace dependency references.
 * Run: node scripts/check-circular-deps.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORKSPACES = [
  "apps/frontend",
  "apps/backend",
  "packages/shared-types",
  "packages/validation",
  "packages/eslint-config",
  "packages/typescript-config",
];

function readPkg(wsPath) {
  const pkgPath = path.join(ROOT, wsPath, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
}

function getDeps(pkg) {
  return Object.keys({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }).filter((d) => d.startsWith("@gold-commerce/"));
}

const graph = {};
for (const ws of WORKSPACES) {
  const pkg = readPkg(ws);
  if (!pkg) continue;
  graph[pkg.name] = getDeps(pkg);
}

function detectCycle(node, visited = new Set(), stack = []) {
  visited.add(node);
  stack.push(node);

  for (const dep of graph[node] || []) {
    if (!visited.has(dep)) {
      if (detectCycle(dep, visited, stack)) return [...stack, dep];
    } else if (stack.includes(dep)) {
      return [...stack, dep];
    }
  }

  stack.pop();
  return null;
}

let found = false;
for (const node of Object.keys(graph)) {
  const cycle = detectCycle(node);
  if (cycle) {
    console.error(`❌ Circular dependency detected: ${cycle.join(" → ")}`);
    found = true;
  }
}

if (!found) {
  console.log("✅ No circular workspace dependencies detected.");
} else {
  process.exit(1);
}
