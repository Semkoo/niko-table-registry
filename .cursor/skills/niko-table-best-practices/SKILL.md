---
name: niko-table-best-practices
description: >-
  Integrate and use Niko Table (shadcn-compatible data tables with TanStack
  Table). Use when the user mentions Niko Table, niko-table.com, data table with
  shadcn, TanStack Table, building a sortable or filterable table, faceted
  filters, advanced filter menu, row or column drag-and-drop, server-side
  pagination, nuqs, URL state, shareable or bookmarkable table, row expansion,
  tree table, row selection, or any shadcn-compatible data grid — even if they
  don't name Niko Table explicitly.
  Prefer this skill whenever the task involves a data table in a React/shadcn
  project so the model follows Niko Table structure, imports, and patterns.
---

# Niko Table Integration Guide

A skill for building and configuring data tables with Niko Table: structure, filters (search, faceted, advanced), column menus, DnD, and server-side patterns.

At a high level:

- **New table**: DataTableRoot → ToolbarSection (optional) → DataTable → Header + Body (Skeleton, EmptyBody) → Pagination. Use direct file imports only (no barrel exports).
- **Adding filters**: Toolbar = DataTableSearchFilter, DataTableFacetedFilter, DataTableFilterMenu. Column headers = DataTableColumnFacetedFilterMenu, DataTableColumnSliderFilterMenu, DataTableColumnDateFilterMenu. Set column `meta` (variant, options, etc.) and `enableColumnFilter: true`.
- **Row/column DnD**: Row DnD needs `getRowId`, DataTableRowDndProvider outside DataTable; don’t combine row DnD with sorting/filtering. Column DnD is safe with everything.
- **Server-side**: `config.manualPagination` (and/or manualSorting/manualFiltering), `config.pageCount`, pass `totalCount` to DataTablePagination.
- **URL state (nuqs):** Wrap app with `NuqsAdapter`; use `useQueryStates` with parsers for pagination, sort, filters, search; pass URL-derived state into `DataTableRoot` and wire `onPaginationChange` / `onSortingChange` / `onColumnFiltersChange` / `onGlobalFilterChange` to `setUrlParams`.
- **Large lists:** Use `DataTableVirtualizedBody` (from core/structure) instead of `DataTableBody` for 10k+ rows; same children (Skeleton, EmptyBody). See Virtualization Table example.
- **Sidebar:** Use `DataTableAside` (and trigger) for a detail panel next to the table. See Aside Table example.

Your job when using this skill is to figure out where the user is — new table, adding filters/DnD, fixing imports, wiring server-side, URL state (nuqs), row expansion, tree table, or row selection — and give them the right structure, imports, and patterns. If they’re vague (“I want a table”), suggest the minimal template and point to niko-table.com for examples. If they already have a table and want faceted filters or the advanced filter menu, jump to the Filtering section. Stay flexible: some users want copy-paste snippets; others want to understand the two-layer (DataTable* vs Table*) pattern.

Full docs and examples: **https://niko-table.com**. Registry: `https://niko-table.com/r/{name}.json` in `components.json` under `registries["@niko-table"]`.

## Quick Reference

- **Docs and examples**: https://niko-table.com (installation, examples, API overview)
- **Registry URL**: `https://niko-table.com/r/{name}.json` — add to `components.json` under `registries["@niko-table"]`

## Communicating with the user

Users may be new to Niko Table or to the shadcn/TanStack stack. When in doubt, briefly explain why direct imports matter (tree-shaking, no barrel files) and why `getRowId` is needed for row DnD. Mention that most DataTableRoot config is auto-detected from the components they use, so they only need to pass `config` when overriding or for manual/server-side. For deep reference (all add-ons, full API), point to niko-table.com.

**When not to use:** If the project clearly uses another table library (e.g. AG Grid, MUI Data Grid, TanStack Table without this registry), don’t force Niko Table — suggest the appropriate pattern for their stack.

## Table Structure

All table UI must live inside `DataTableRoot`. Recommended composition:

```
DataTableRoot (required)
  → DataTableToolbarSection (optional: search, filters, view menu)
  → DataTable
      → DataTableHeader
      → DataTableBody
          → DataTableSkeleton   (when loading)
          → DataTableEmptyBody  (when no data)
  → DataTablePagination (optional)
```

**Optional:** Wrap the table (or DataTableRoot) in `DataTableErrorBoundary` from `@/components/niko-table/core/data-table-error-boundary` so render errors show a fallback UI instead of breaking the page.

## Imports — No Barrel Exports

Use **direct file paths only**. Do not use `index.ts` re-exports for core, components, or filters.

| Purpose           | Import path                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Root & table      | `@/components/niko-table/core/data-table-root`, `@/components/niko-table/core/data-table`                                  |
| Structure         | `@/components/niko-table/core/data-table-structure` (Header, Body, Skeleton, EmptyBody)                                    |
| Toolbar / filters | `@/components/niko-table/components/data-table-toolbar-section`, `data-table-search-filter`, `data-table-pagination`, etc. |
| Types             | `@/components/niko-table/types` (e.g. `DataTableColumnDef`)                                                                |

Examples:

```ts
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
  DataTableEmptyBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import type { DataTableColumnDef } from "@/components/niko-table/types"
```

## Two-Layer Component Pattern

- **Components** (`DataTable*`): Context-aware; use `useDataTable()` internally. Import from `components/`. Prefer these for normal usage (no `table` prop).
- **Filters** (`Table*`): Accept `table` prop; import from `filters/`. Use when building custom components or managing the table instance yourself.

Use `DataTable*` components from their direct paths (e.g. `data-table-pagination`) for context-based usage; use `Table*` from filters when you need the low-level API.

## Column Definitions

- Type: `DataTableColumnDef<TData>[]` from `@/components/niko-table/types`.
- Use `accessorKey` and `header`. For sortable/filterable columns, use `DataTableColumnHeader`, `DataTableColumnTitle`, and `DataTableColumnSortMenu` (and column filter menus as needed).
- **meta** for filter config: `label`, `placeholder`, `variant` (`text`, `select`, `multi_select`, `range`, `date`, `date_range`, `number`, `boolean`), `options` (static `{ label, value }[]`), `autoOptions` (generate from data), `unit` (e.g. `"$"` for range), `showCounts`, `dynamicCounts`, `mergeStrategy` (`"preserve"` | `"augment"` | `"replace"` for options). Set `enableColumnFilter: true` when using column filters.

## Filtering

### Toolbar filters (inside DataTableToolbarSection)

- **Global search**: `DataTableSearchFilter` — single search input; no column meta required.
- **Advanced (rule-based)**: `DataTableFilterMenu` — command-palette style; add multiple filter rules with AND/OR. Column `meta.variant` (e.g. `text`, `select`, `range`, `date`) determines filter type. Install `@niko-table/data-table-filter-menu` and optionally `checkbox` from Shadcn for multi-select.
- **Faceted (inline)**: `DataTableFacetedFilter` — one filter per column; shows options with counts. Use `accessorKey` to tie to a column; options come from column `meta.options` or `meta.autoOptions`. Use `multiple` for multi-select. `limitToFilteredRows` restricts options to current result set.
- **Other toolbar**: `DataTableSliderFilter`, `DataTableDateFilter` for range/date in toolbar; `DataTableClearFilter` to clear all filters.

### Column-level filter menus (in header)

Render inside the column `header` next to `DataTableColumnTitle` and `DataTableColumnSortMenu`:

- **Faceted**: `DataTableColumnFacetedFilterMenu` — select/multi-select with counts. Column needs `meta.options` or `meta.autoOptions`; optional `meta.showCounts`, `meta.dynamicCounts`, `meta.mergeStrategy`. Use `FILTER_VARIANTS.TEXT` (or `.NUMBER`, `.DATE`) on `DataTableColumnSortMenu` when needed.
- **Slider (range)**: `DataTableColumnSliderFilterMenu` — numeric range; column `meta.variant: "range"`, optional `meta.unit`.
- **Date**: `DataTableColumnDateFilterMenu` — date or date-range; column `meta.variant: "date"` or `"date_range"`.

Example column with faceted + sort:

```tsx
import { DataTableColumnHeader, DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnFacetedFilterMenu } from "@/components/niko-table/components/data-table-column-faceted-filter"
import { FILTER_VARIANTS } from "@/components/niko-table/lib/constants"

{
  accessorKey: "category",
  header: () => (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
      <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      <DataTableColumnFacetedFilterMenu multiple limitToFilteredRows={false} />
    </DataTableColumnHeader>
  ),
  meta: {
    label: "Category",
    options: categoryOptions,
    mergeStrategy: "augment",
    dynamicCounts: true,
    showCounts: true,
  },
  enableColumnFilter: true,
}
```

Example toolbar with search + faceted + advanced + clear:

```tsx
<DataTableToolbarSection>
  <DataTableSearchFilter placeholder="Search..." />
  <DataTableFacetedFilter accessorKey="category" title="Category" options={categoryOptions} multiple />
  <DataTableFacetedFilter accessorKey="brand" limitToFilteredRows />
  <DataTableFilterMenu autoOptions dynamicCounts showCounts mergeStrategy="augment" />
  <DataTableViewMenu />
  <DataTableClearFilter />
</DataTableToolbarSection>
```

Add-ons: `data-table-search-filter`, `data-table-filter-menu`, `data-table-faceted-filter`, `data-table-clear-filter`, `data-table-slider-filter`, `data-table-date-filter`, `data-table-column-faceted-filter`, `data-table-column-slider-filter`, `data-table-column-date-filter`. Full list at niko-table.com.

## DataTableRoot Config and State

**Most config is auto-detected** from the components you render: e.g. `DataTablePagination` enables pagination, `DataTableSearchFilter` / `DataTableFilterMenu` / `DataTableFacetedFilter` / column filter menus enable filtering, `DataTableColumnHeader` / `DataTableColumnSortMenu` enable sorting, `DataTableSelectionBar` enables row selection. You only need to pass `config` when overriding defaults or for features that aren’t declared by a child (e.g. server-side or manual modes).

- **config** (override when needed): `manualPagination`, `manualSorting`, `manualFiltering`, `pageCount`, `initialPageSize`, `initialPageIndex`, `autoResetPageIndex`, `autoResetExpanded`, or to turn off a feature. Full list: `enablePagination`, `enableSorting`, `enableFilters`, `enableRowSelection`, `enableExpanding`, etc.
- **state**: Optional controlled `state` plus `onPaginationChange`, `onSortingChange`, `onColumnFiltersChange`, `onColumnVisibilityChange`, `onRowSelectionChange`, `onExpandedChange`, `onRowSelection`.
- **getRowId**: Optional `(row, index) => string`. Use stable unique IDs (e.g. `(row) => row.id`) when using row DnD, row selection, or expansion — default index-based IDs break after reorder.
- **Loading**: Set `isLoading` on `DataTableRoot`; render `DataTableSkeleton` and `DataTableEmptyBody` inside `DataTableBody`.

## URL state (nuqs)

Sync table state (pagination, sorting, filters, search) with the URL for shareable, bookmarkable views. Use [nuqs](https://nuqs.dev/): install `nuqs` and wrap the app with the framework-specific **NuqsAdapter** in the app root (`nuqs/adapters/next/app`, `nuqs/adapters/next/pages`, or `nuqs/adapters/react`). See [nuqs adapters docs](https://nuqs.dev/docs/adapters) for setup.

- **Parsers:** Define parsers with `parseAsInteger.withDefault(0)` for `pageIndex`/`pageSize`, `parseAsJson` for `sort`/`filters`, `parseAsString` for `search`. Match TanStack Table state shape so URL params map 1:1 to `state`.
- **Wiring:** `useQueryStates(parsers, { history: "replace" })` → `[urlParams, setUrlParams]`. Derive `pagination`, `sorting`, `columnFilters`, `globalFilter` from `urlParams` (e.g. via `useMemo`). Pass to `DataTableRoot` as `state={{ pagination, sorting, columnFilters, globalFilter }}`. In `onPaginationChange`, `onSortingChange`, `onColumnFiltersChange`, `onGlobalFilterChange`, call `setUrlParams` with the updated slice so the URL stays in sync.
- **DataTableFilterMenu:** When using the filter menu with nuqs, filters in the URL are often stored as extended filter objects; convert between TanStack `ColumnFiltersState` and that shape in the handlers. See Advanced Nuqs Table and Server-Side Nuqs Table examples at niko-table.com.

## Installation (for projects without Niko Table)

1. **Prerequisites**: React project, Shadcn UI, TailwindCSS, TypeScript.
2. **Client components**: Table components use React state and hooks; add `"use client"` at the top of any file that renders `DataTableRoot` or Niko Table components (required in Next.js App Router and similar).
3. **Registry**: In `components.json`, add:
   ```json
   "registries": {
     "@niko-table": "https://niko-table.com/r/{name}.json"
   }
   ```
4. **Core**: `shadcn@latest add @niko-table/data-table` (also installs/updates `components/ui/table.tsx` with `TableComponent`; backward compatible with existing Shadcn table).
5. **Add-ons** (examples): `@niko-table/data-table-pagination`, `@niko-table/data-table-search-filter`, `@niko-table/data-table-view-menu`, `@niko-table/data-table-sort-menu`, `@niko-table/data-table-filter-menu`, plus column-level filter/sort components as needed. Match names from the registry at niko-table.com.
6. **Server-side**: For `manualPagination`/`manualSorting`/`manualFiltering`, set `config.pageCount` (e.g. `Math.ceil(totalCount / pageSize)`) and pass `totalCount` to `DataTablePagination` when using server-driven data.

## Drag and Drop

- **Row DnD**: Do **not** combine with sorting or filtering (data order conflicts). **Requires `getRowId={(row) => row.id}`** (or similar stable ID) — index-based IDs break after reorder. Wrap with `DataTableRowDndProvider` **outside** `<DataTable>` (DnD context uses divs that cannot live inside `<table>`). Use `DataTableDndBody` and `DataTableRowDragHandle` inside. Add a drag-handle column with `cell: ({ row }) => <DataTableRowDragHandle rowId={row.id} />`.
- **Column DnD**: Safe to combine with other features. Use `DataTableColumnDndProvider`, `DataTableDraggableHeader`, `DataTableDragAlongCell`, and the corresponding core structure components (including virtualized variants when needed).

## Styling

Use semantic color tokens (e.g. `bg-success`, `text-destructive`) instead of hardcoded Tailwind colors.

## Pitfalls to Avoid

- **No barrel imports**: Do not import from `@/components/niko-table` or `.../core` or `.../components` without the full path to the file (e.g. `.../core/data-table-root`).
- **Row DnD without getRowId**: Row drag-and-drop requires stable row IDs; pass `getRowId={(row) => row.id}` (or your ID field). Omitting it or using index causes wrong behavior after reorder.
- **Row DnD with sorting/filtering**: Do not enable row reorder and sort/filter together; data order becomes ambiguous.
- **DataTableRowDndProvider inside &lt;table&gt;**: The provider must wrap the whole `DataTable` from outside; its markup cannot go inside `<table>`.

## Minimal Table Template

```tsx
"use client"

import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
  DataTableEmptyBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import type { DataTableColumnDef } from "@/components/niko-table/types"

type User = { id: string; name: string; email: string }

const columns: DataTableColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
]

export function UsersTable({ data, isLoading }: { data: User[]; isLoading?: boolean }) {
  return (
    <DataTableRoot data={data} columns={columns} isLoading={isLoading}>
      <DataTableToolbarSection>
        <DataTableSearchFilter placeholder="Search..." />
      </DataTableToolbarSection>
      <DataTable>
        <DataTableHeader />
        <DataTableBody>
          <DataTableSkeleton />
          <DataTableEmptyBody />
        </DataTableBody>
      </DataTable>
      <DataTablePagination />
    </DataTableRoot>
  )
}
```

## Where to Learn More

- **Online**: https://niko-table.com — installation, examples, component overview, API. Example pages: Row Selection, Row Expansion, Tree Table; Faceted Filter, Advanced Filter; Advanced Nuqs, Server-Side Nuqs; Row DnD, Column DnD; Virtualization Table (DataTableVirtualizedBody), Aside Table (DataTableAside). For resilience: DataTableErrorBoundary (core/data-table-error-boundary).
- **Skills (AI)**: https://niko-table.com/getting-started/skills/ — how to install and use this skill.
- **In-repo** (when working in niko-table-registry): `src/content/docs/` — e.g. `niko-table/introduction.mdx`, `getting-started/installation.mdx`, `examples/row-selection-table.mdx`, `examples/row-expansion-table.mdx`, `examples/tree-table.mdx`, `examples/faceted-filter-table.mdx`, `examples/advanced-table.mdx`, `examples/advanced-nuqs-table.mdx`, `examples/server-side-nuqs-table.mdx`, `examples/row-dnd-table.mdx`, `examples/column-dnd-table.mdx`, `niko-table/overview/components.mdx`, `filters.mdx`.
