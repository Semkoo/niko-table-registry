/* eslint-disable @typescript-eslint/no-explicit-any */
import js from "@eslint/js"
import markdown from "@eslint/markdown"
import json from "@eslint/json"
import globals from "globals"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import astro from "eslint-plugin-astro"
import astroParser from "astro-eslint-parser"
import prettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig, globalIgnores } from "eslint/config"
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat"

export default defineConfig([
  globalIgnores([
    "node_modules/",
    ".astro/",
    ".github/",
    ".vscode/",
    "dist/",
    "public/r/",
    "package-lock.json",
    "scripts/fixtures/",
  ]),
  {
    files: ["**/*.{md}"], // ,mdx
    plugins: { markdown },
    extends: [markdown.configs.recommended],
  },
  {
    files: ["**/*.json"],
    plugins: { json: json as any },
    language: "json/json",
    extends: [json.configs.recommended],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: [js.configs.recommended],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ["scripts/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
  tseslint.configs.strict,
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { react: fixupPluginRules(react as any) },
    extends: fixupConfigRules([
      reactHooks.configs.flat.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
    ] as any[]),
  },
  {
    plugins: { astro: fixupPluginRules(astro as any) },
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
    extends: fixupConfigRules([
      ...astro.configs.recommended.filter((c: any) => !c.files),
      ...astro.configs["jsx-a11y-strict"].filter((c: any) => !c.files),
    ] as any[]),
    files: ["**/*.astro"],
  },
  prettier,
])
