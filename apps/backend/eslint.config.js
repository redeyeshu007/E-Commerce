const nodeConfig = require("@gold-commerce/eslint-config/node");

module.exports = [
  ...nodeConfig,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
];
