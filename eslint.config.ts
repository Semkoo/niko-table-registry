/* eslint-disable @typescript-eslint/no-explicit-any */
import js from "@eslint/js"
import markdown from "@eslint/markdown"
import json from "@eslint/json"
import globals from "globals"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import astro from "eslint-plugin-astro"
import * as astroParser from "astro-eslint-parser"
import prettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig, globalIgnores } from "eslint/config"
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat"

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/.astro/",
    "**/.github/",
    "**/.vscode/",
    "**/dist/",
    "**/public/r/",
    "**/package-lock.json",
    "**/scripts/fixtures/",
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
    // No barrel imports inside `niko-table/`. The registry is copy-paste —
    // barrels defeat tree-shaking, hide circular imports, and make installed
    // code diverge from shadcn conventions. `types/` is the single allowed
    // barrel (type-only, zero runtime cost). See CONTRIBUTING.md.
    files: ["**/*.{ts,mts,cts,tsx,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "@/components/niko-table/core",
            "@/components/niko-table/components",
            "@/components/niko-table/filters",
            "@/components/niko-table/hooks",
            "@/components/niko-table/lib",
            "@/components/niko-table/config",
          ].flatMap(p => [
            {
              name: p,
              message:
                "No barrel imports inside niko-table/. Import directly from the file (e.g. `@/components/niko-table/core/data-table-root`). Only `niko-table/types` is allowed as a barrel. See CONTRIBUTING.md.",
            },
            {
              name: `${p}/index`,
              message:
                "No barrel imports inside niko-table/. Import directly from the file (e.g. `@/components/niko-table/core/data-table-root`). Only `niko-table/types` is allowed as a barrel. See CONTRIBUTING.md.",
            },
          ]),
        },
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
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
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
  {
    // niko-table is battle-tested engine code mirrored verbatim from its
    // upstream source (the edge2 monorepo, where it's developed and tested).
    // It follows upstream's lint stance for a few rules so the mirror stays
    // turnkey — no per-sync rewrites — and so the React Compiler's most
    // aggressive rules don't flag intentional, correct patterns. Consistent
    // with this project already disabling `react-hooks/set-state-in-effect`.
    files: [
      "src/components/niko-table/**/*.{ts,tsx}",
      "src/registry/new-york/examples/niko-table/**/*.{ts,tsx}",
    ],
    rules: {
      // The engine uses `!` on invariant array/map access (matching upstream);
      // rewriting every site on each mirror risks regressions for no real gain
      // (correctness is enforced by upstream's tests).
      "@typescript-eslint/no-non-null-assertion": "off",
      // The latest-ref pattern (writing `ref.current` during render) is a
      // deliberate, correct idiom for stale-closure-free handlers/effects.
      "react-hooks/refs": "off",
      // Mutual rAF-loop callbacks reference each other before declaration by
      // design (a self-scheduling animation loop).
      "react-hooks/immutability": "off",
      // TanStack Virtual's `useVirtualizer()` returns non-memoizable functions —
      // a third-party limitation the React Compiler flags, not our bug.
      "react-hooks/incompatible-library": "off",
    },
  },
])
