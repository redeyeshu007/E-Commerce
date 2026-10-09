/** @type {import("eslint").Linter.Config[]} */
const base = require("./index");

module.exports = [
  ...base,
  {
    rules: {
      // Next.js / React-specific rules will be merged from next/core-web-vitals
    },
  },
];
