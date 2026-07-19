# Niko Table

**Nobody's table, everyone's solution.**

Composable, shadcn-compatible data table source you copy into your project. Built on [TanStack Table](https://tanstack.com/table/latest) and [shadcn/ui](https://ui.shadcn.com). Not an opaque npm package: you own the code.

Full docs and live examples: **[niko-table.com](https://niko-table.com)**

This folder is the source that the registry ships. Prefer installing via the CLI (`@niko-table/...`) or following [Manual Installation](https://niko-table.com/getting-started/manual-installation/).

## What lives here

| Area           | Role                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| **Data Table** | `DataTableRoot` + structure + filters / menus / pagination / virtualization / DnD    |
| **Data Grid**  | Optional editable spreadsheet layer (`useDataGrid` + `<DataGrid>` + opt-in children) |

## Directory structure

```
niko-table/
├── core/           # DataTableRoot, DataTable, context, structure
│                   # (regular, virtualized, row/column DnD, virtualized DnD)
├── components/     # Context-aware wrappers (DataTable* prefix, useDataTable())
├── filters/        # Direct-prop primitives (Table* prefix, accept table)
├── grid/           # Data Grid: core, components, cells, hooks, types, config
├── hooks/          # Table helpers (debounce, flash, scroll, options, …)
├── config/         # Feature detection
├── lib/            # Utilities, constants, filter fns, resize handle, …
└── types/          # TypeScript types (types/index.ts is the types module)
```

**No barrel exports** for UI modules. Import from the file path directly (tree-shaking + shadcn copy pattern). Types may use `types/index.ts`.

```tsx
// ✅
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"

// ❌ do not add or use index.ts re-exports for core / components / filters / …
```

## Architecture

One-way layers: shared → niko-table → registry → documentation.

### Two-layer table pattern

**Components** (`/components/`, `DataTable*`): context-aware. Call `useDataTable()` from `DataTableRoot`. Recommended for apps.

```tsx
<DataTableRoot data={data} columns={columns}>
  <DataTableSearchFilter />
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
  <DataTablePagination />
</DataTableRoot>
```

**Filters** (`/filters/`, `Table*`): accept `table` directly. Use when you own the TanStack instance or wrap custom UI.

```tsx
<TableSearchFilter table={table} />
```

### Feature detection

Mounting children (pagination, search, filters, resize markers, …) and column config drive which TanStack features attach. You usually do not need a full manual feature flag list.

Notes:

- **`enableSorting` defaults off** until config or detection enables it
- Row selection / expansion follow system columns (`select`, `expand`) and meta
- Column resize: mount `<DataTableColumnResize />` (and related packages as needed)

### DnD (three tiers)

Built on `@dnd-kit`. Import axis-specific structure files (no combined DnD structure shims):

1. **Filters**: `TableRowDndProvider`, `TableDraggableRow`, `TableColumnDndProvider`, …
2. **Components**: `DataTableRowDndProvider`, `DataTableColumnDndProvider`, …
3. **Core structure**:
   - Row: `data-table-row-dnd-structure`, `data-table-virtualized-row-dnd-structure`
   - Column: `data-table-column-dnd-structure`, `data-table-virtualized-column-dnd-structure`

**Constraint:** row DnD should not be combined with sorting/filtering (order conflicts). Column DnD is safe with other features.

### Data Grid

Under `grid/`:

- **Core**: `useDataGrid`, `<DataGrid>`, context, feature registration
- **Components**: clipboard, fill, move, toolbar, status bar, row reorder, …
- **Cells**: display shell + typed editors (`GridTextCell`, …)
- **Hooks / types / config**: persistence helpers, column APIs, shortcuts metadata

Mount only the children you need under `<DataGrid>`. Unmounted features attach no listeners. See [Data Grid introduction](https://niko-table.com/data-grid/introduction/).

## Minimal usage

```tsx
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"

export function SimpleTable({ data, columns }) {
  return (
    <DataTableRoot data={data} columns={columns}>
      <DataTable>
        <DataTableHeader />
        <DataTableBody />
      </DataTable>
    </DataTableRoot>
  )
}
```

Virtualized tables need a constrained height on `DataTable` (e.g. `height={600}` or `className="max-h-[600px]"`). Prefer `onNearEnd` over `onScrolledBottom` for infinite scroll, and guard fetches with `isFetching`.

## Column meta (filters / labels)

Extend columns with `meta` for labels, filter variants, options, counts, etc. Types live in `types/index.ts` (TanStack module augmentation).

```tsx
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "status",
    header: () => <DataTableColumnHeader />,
    meta: {
      label: "Status",
      variant: "multiSelect",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    enableColumnFilter: true,
  },
]
```

Composable column chrome: `DataTableColumnHeader`, `DataTableColumnActions`, sort / pin / hide / filter options in `/components`.

## Row menus

Define row actions once as a declarative component using `useDataTableRow` + `RowMenuItem` / `RowMenuSub` from `data-table-row-menu`. Drop the same component into the kebab cell (`DataTableRowMenuScope surface="dropdown"`) and `<DataTableRowContextMenuSlot>`. It renders for the surface in context. Context-scope hooks throw outside their provider.

## Conventions

- Direct file imports only (except `types/index.ts`)
- Semantic color tokens (`bg-success`, `text-destructive`), not hardcoded palette colors
- Deterministic mock data in examples (no `Math.random()` / `Date.now()`) for SSR-safe demos
- Prefer overview MDX + examples on the docs site over duplicating long tutorials here

## Docs map

| Topic               | Link                                                 |
| ------------------- | ---------------------------------------------------- |
| Introduction        | https://niko-table.com/getting-started/introduction/ |
| Installation        | https://niko-table.com/getting-started/installation/ |
| Components catalog  | https://niko-table.com/getting-started/components/   |
| Table overview      | https://niko-table.com/niko-table/overview/core/     |
| Data Grid           | https://niko-table.com/data-grid/introduction/       |
| Changelog (package) | [./CHANGELOG.md](./CHANGELOG.md)                     |
| Site changelog      | https://niko-table.com/changelog/                    |

## Related notes in this folder

- [CHANGELOG.md](./CHANGELOG.md): package-level release notes
- [EMPTY_STATE_COMPOSITION.md](./EMPTY_STATE_COMPOSITION.md): empty-state composition details
- [PERFORMANCE_ANALYSIS.md](./PERFORMANCE_ANALYSIS.md): historical performance notes
