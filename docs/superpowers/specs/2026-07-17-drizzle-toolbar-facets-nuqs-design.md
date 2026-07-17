# Drizzle example: toolbar facets + a nuqs variant

## Goal

Two additions around the Drizzle ORM example (`src/registry/new-york/examples/niko-table/drizzle-state.tsx`):

1. **Toolbar facet buttons** — add `DataTableFacetedFilter` buttons (Category, Brand) to the toolbar of both the existing Drizzle example and the new nuqs variant, _in addition to_ the existing header-funnel facets.
2. **New Drizzle + nuqs example** — a separate `drizzle-nuqs-state.tsx` that stores table state in the URL via nuqs, mirroring the `server-side-table` → `server-side-nuqs-table` split, plus its own doc page and sidebar entry.

## Part 1 — Toolbar facets

- Add a toolbar row of `DataTableFacetedFilter` for `category` and `brand`, reusing the server-computed facet options (`categoryOpts` / `brandOpts`, which already carry server counts from `computeFacets`).
- Server-side configuration (critical): `dynamicCounts={false}` and `limitToFilteredRows={false}`. The client holds only the current page, so client-side counting/narrowing would be wrong; counts come from the server facets.
- To narrow the toolbar list to "values still in the results" (matching the header funnels, which already hide count-0), the example drops `count === 0` options while **pinning any currently-selected value** so it stays visible and removable.
- Refactor: lift the `mergeCounts` helper to module scope and expose `categoryOpts` / `brandOpts` via a `useMemo` in the component render scope (today they are computed inside `buildColumns`). Header funnels keep using them.

## Part 2 — Drizzle + nuqs example

- **`drizzle-nuqs-state.tsx`** — copy of `drizzle-state.tsx`, with table state moved to the URL via nuqs:
  - `useQueryStates` params mirroring `server-side-nuqs-state.tsx`: `page` (parseAsInteger), `perPage` (parseAsInteger), `sort` (parseAsJson<SortingState>), `search` (parseAsString/json for the global filter object), `filters` (parseAsJson<ColumnFiltersState>).
  - Wrapped in `NuqsAdapter` (react adapter) + `QueryClientProvider`.
  - Keeps the Drizzle `buildWhere` / `buildOrderBy` / `computeFacets` code and the **Generated SQL** panel unchanged.
  - Includes the Part 1 toolbar facets.
- **Doc page** `src/content/docs/examples/drizzle-orm-nuqs.mdx` — mirrors `server-side-nuqs-table.mdx`, framed as "the Drizzle backend from the previous guide, now URL-driven / shareable."
- **Registration**:
  - Add `"niko-table/drizzle-nuqs-state"` to the `Demo` union in `src/components/markdown/code-preview/_code-preview-internal.tsx`.
  - Sidebar entry (label "Drizzle ORM + Nuqs", slug `examples/drizzle-orm-nuqs`) right after "Drizzle ORM" in `astro.config.mts`.

## Shared-component change (approved during implementation)

`buildFacetedOptions` (`lib/build-faceted-options.ts`) now prefers a
caller-supplied `count` over the row-derived count (`opt.count ?? recomputed`),
matching the header-funnel path. Required because the toolbar facet recomputes
counts from the client rows, which on a server-side table only see the current
page — this preserves the real server-computed facet counts. Backward
compatible: only callers who already put counts on their options are affected.
Ships in `data-table-faceted-filter` and `data-table-column-faceted-filter`, so
the registry is rebuilt for those.

## Out of scope

- No other shared-component changes (facet narrowing / selected-value pinning already work).
- Examples are not registry items, so no example `registry.json` / `public/r` changes.

## Verification

- `astro check` (part of `npm run build`) passes: 0 errors.
- Dev server (`npm run dev`) renders both example pages; the new page's demo loads, facet buttons filter, and the URL updates as state changes and restores on reload.
- CHANGELOG `[Unreleased]` entry added.

## Dependencies / sequencing

- Independent of PRs #158 and #159. Part 1's toolbar-facet narrowing is done in the example (pre-filter count-0 + pin selected), so it does not rely on #159's shared-component pin fix.
