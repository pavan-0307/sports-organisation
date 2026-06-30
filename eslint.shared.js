import { createRequire } from "module";
const require = createRequire(import.meta.url);

// eslint.shared.js – shared Flat ESLint configuration
export const sharedConfig = {
  languageOptions: {
    parser: require.resolve("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    globals: {
      JSX: true,
    },
  },
  plugins: {
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    react: require("eslint-plugin-react"),
    "react-hooks": require("eslint-plugin-react-hooks"),
    vitest: require("eslint-plugin-vitest"),

  },
  rules: {
    // General TypeScript rules
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    // Vitest rules
    "vitest/no-conditional-tests": "warn",
  },
};
