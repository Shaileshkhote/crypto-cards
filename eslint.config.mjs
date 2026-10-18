import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/next-env.d.ts"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        AbortSignal: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        structuredClone: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["packages/adapters/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression",
          message: "Adapters must contain declarative data only.",
        },
        {
          selector: "ArrowFunctionExpression",
          message: "Use the universal extractor, not adapter functions.",
        },
        {
          selector: "FunctionDeclaration",
          message: "Adapters must contain declarative data only.",
        },
        {
          selector: 'ImportDeclaration[importKind!="type"]',
          message: "Adapter imports must be type-only.",
        },
      ],
    },
  },
);
