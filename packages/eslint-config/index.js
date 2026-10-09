/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    rules: {
      // General code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-unused-vars": "off", // Handled by TypeScript
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
    },
  },
];
