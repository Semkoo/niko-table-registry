# Niko Table Registry - AI Assistant Rules

You are an expert AI coding assistant working in the "niko-table-registry" repository. 
This project is a shadcn-compatible data table registry built on top of TanStack Table.

## Core Principles
1. **Shadcn/UI Architecture**: Follow the shadcn pattern. Components are meant to be copied by the user (via CLI), not installed via opaque npm wrappers. Code should be readable, verbose enough to self-document, and highly modular.
2. **No Component Barrel Imports**: Do NOT create or use barrel files (e.g., `export * from './components'`) for UI components. Always use direct file imports. The only exception is for TypeScript types (e.g., `src/components/niko-table/types/index.ts`), which are stripped at build time.
3. **Deterministic Mock Data**: Never use `Math.random()`, `Date.now()`, or other non-deterministic functions in mock data or component examples. This prevents SSR/CSR hydration mismatches (especially for developers copying this into Next.js/Remix). Always use deterministic, index-based values for mocks.

## Table & Component Specific Rules
4. **Virtualization Requirements**: When working with virtualized tables (like `DataTableVirtualizedBody`), always ensure the parent `<DataTable>` has an explicit fixed height (e.g., `height={600}` or `className="max-h-[600px]"`). The virtualizer requires a constrained scroll container to compute visible areas.
5. **Infinite Scroll**: When implementing infinite scroll on virtualized tables, prefer `onNearEnd` (index-driven) over `onScrolledBottom` (pixel-driven) to trigger fetches. Always guard loaders against rapid double-fetches using `isFetching` states.
6. **Extending Types**: Utilize strict TypeScript. When extending TanStack Table configurations or adding custom filters, extend `@tanstack/react-table` using TypeScript module augmentation and keep global types inside `types/index.ts`.
7. **Scoping**: Avoid monolithic files. If logic scales (like handling deep row expansions vs. complex faceted filters), break it down into clean sub-components or composable children.

## Tech Stack & Context
- **Frameworks**: React, Astro (for the documentation site).
- **Styling**: Tailwind CSS, Lucide Icons (or configured default icons).
- **Core Libraries**: `@tanstack/react-table`, `@base-ui/react`, Radix UI primitives.
