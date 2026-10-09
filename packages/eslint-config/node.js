/** @type {import("eslint").Linter.Config[]} */
const base = require("./index");

module.exports = [
  ...base,
  {
    rules: {
      // Node-specific rules
      "no-process-exit": "off",
    },
  },
];
