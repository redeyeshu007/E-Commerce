#!/usr/bin/env node
/**
 * Render Cron Job Entry Point: Daily Abandoned Cart Reminder
 * Scheduled at: 30 12 * * * (12:30 PM UTC = 6:00 PM IST)
 */
require("dotenv/config");
const { spawn } = require("node:child_process");
const path = require("node:path");

// Run via tsx or node depending on build
const tsScript = path.resolve(__dirname, "..", "src", "scripts", "daily-cart-reminder.ts");
const distScript = path.resolve(__dirname, "..", "dist", "scripts", "daily-cart-reminder.js");
const fs = require("node:fs");

const runner = fs.existsSync(distScript) ? "node" : "npx";
const args = fs.existsSync(distScript) ? [distScript] : ["tsx", tsScript];

const child = spawn(runner, args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

