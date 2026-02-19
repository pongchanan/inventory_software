import { defineConfig } from "eslint/config";
import nextPlugin from "eslint-config-next";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
    ],
  },
  ...nextPlugin,
]);

export default eslintConfig;
