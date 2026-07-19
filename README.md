# Niko Table

**Nobody's table, everyone's solution.**

A shadcn-compatible React data table registry built on [TanStack Table](https://tanstack.com/table/latest) and [shadcn/ui](https://ui.shadcn.com). Not an opaque npm package: you copy the source into your project and own it.

> Open code you can read, change, and ship. Same model as shadcn/ui.

**Docs:** [niko-table.com](https://niko-table.com)

## What you get

- **Data Table**: composable `DataTable*` pieces for sorting, filtering, pagination, selection, expansion, pinning, virtualization, export, and more
- **Data Grid**: optional editable spreadsheet layer (`useDataGrid` + `<DataGrid>`) with clipboard, fill, undo/redo, typed editors, and persistence helpers
- **Registry install**: add `@niko-table` once, then install only the blocks you need via the shadcn CLI
- **Works with both shadcn generations**: classic Radix (`new-york`) and Base UI (`base-nova`)

## Principles

**Open Code.** The top layer of component code is yours to modify. Full TypeScript source, not a black box.

**Composition.** Build tables from small, predictable pieces. Start with `DataTableRoot`, add header/body, then mount filters, pagination, or grid features as you need them.

**Distribution.** Flat registry files + the `shadcn` CLI. One `components.json` entry, then install by name.

**Beautiful Defaults.** Sensible styles via shadcn/ui and Tailwind CSS, so defaults look good without a design pass.

**AI-Ready.** Clean, documented TypeScript that LLMs can read and improve. No hidden abstractions or private APIs.

## Features

**Table**

- Sorting (single / multi-column) and column menus
- Filtering: global search, faceted, date, slider, inline, AND/OR logic
- Pagination (client and server-side)
- Row selection, expansion, context menus
- Column pinning, visibility, resize, and DnD reorder
- Virtual scrolling for large client-side datasets
- CSV export, aside panels, tree tables
- Optional URL state with [nuqs](https://nuqs.dev)

**Data Grid**

- Editable cells with typed editors (text, number, checkbox, date, select)
- Keyboard nav, selection, clipboard, fill handle, undo/redo
- Opt-in children only: unmounted features attach no listeners
- Inline validation and create/update/delete change-sets

**Quality**

- Full TypeScript
- Accessible patterns via shadcn primitives (Radix or Base UI), ARIA in filters/menus, keyboard shortcuts; jsx-a11y in this repo (verify complex tables in your app)
- Responsive scroll container with touch-friendly controls

## Quick Start

### 1. Add the registry

Merge into your project's `components.json`:

```json
{
  "registries": {
    "@niko-table": "https://niko-table.com/r/{name}.json"
  }
}
```

### 2. Install a block

```bash
pnpm dlx shadcn@latest add @niko-table/data-table
```

URL fallback (no `components.json` change):

```bash
pnpm dlx shadcn@latest add https://niko-table.com/r/data-table.json
```

The CLI does not support wildcards like `@niko-table/**`. List items explicitly or use [Install Everything](https://niko-table.com/getting-started/installation/#install-everything).

See [Installation](https://niko-table.com/getting-started/installation/) and [Components](https://niko-table.com/getting-started/components/) for the full catalog (pagination, filters, virtualization, DnD, Data Grid, …).

### Manual installation

Copy files from `src/components/niko-table/` into your app. Guide: [Manual Installation](https://niko-table.com/getting-started/manual-installation/).

### Dependencies

```bash
npm install @tanstack/react-table
```

Optional:

```bash
# Virtual scrolling
npm install @tanstack/react-virtual

# URL state
npm install nuqs

# Row / column drag-and-drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
```

## Usage

Import from **direct file paths** (no barrel `index` re-exports for UI components):

```tsx
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
]

export function SimpleTable({ data }) {
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

Add features by mounting more pieces under `DataTableRoot`:

```tsx
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFilterMenu } from "@/components/niko-table/components/data-table-filter-menu"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableSortMenu } from "@/components/niko-table/components/data-table-sort-menu"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"

export function AdvancedTable({ data, columns }) {
  return (
    <DataTableRoot
      data={data}
      columns={columns}
      config={{
        enablePagination: true,
        enableFilters: true,
      }}
    >
      <DataTableToolbarSection className="justify-between">
        <div className="flex gap-2">
          <DataTableSearchFilter />
          <DataTableFilterMenu />
        </div>
        <div className="flex gap-2">
          <DataTableViewMenu />
          <DataTableSortMenu />
        </div>
      </DataTableToolbarSection>

      <DataTable>
        <DataTableHeader />
        <DataTableBody />
      </DataTable>

      <DataTablePagination />
    </DataTableRoot>
  )
}
```

Need an editable spreadsheet? Start with the [Data Grid introduction](https://niko-table.com/data-grid/introduction/).

## Architecture

Two layers (one-way dependency: shared → niko-table → registry → docs):

**Components** (`/components/`, `DataTable*` prefix): context-aware wrappers that call `useDataTable()`. Zero prop drilling; recommended for most apps.

```tsx
<DataTableSearchFilter /> {/* table from DataTableRoot context */}
```

**Filters** (`/filters/`, `Table*` prefix): accept a `table` prop. Use when you manage the TanStack instance yourself or build custom wrappers.

```tsx
<TableSearchFilter table={table} />
```

```
niko-table/
├── core/          # DataTableRoot, DataTable, structure (incl. virtualized / DnD)
├── components/    # Context-aware DataTable* wrappers
├── filters/       # Direct-prop Table* primitives
├── grid/          # Data Grid (useDataGrid, DataGrid, cells, features)
├── hooks/         # Table and grid hooks
├── config/        # Feature detection
├── lib/           # Utilities, constants, formatting
└── types/         # TypeScript types (may use types/index.ts)
```

## Documentation

Interactive docs and examples: **[niko-table.com](https://niko-table.com)**

**Getting started**

- [Introduction](https://niko-table.com/getting-started/introduction/)
- [Installation](https://niko-table.com/getting-started/installation/)
- [Components](https://niko-table.com/getting-started/components/)

**Table examples**

- [Simple Table](https://niko-table.com/examples/simple-table/)
- [Advanced Table](https://niko-table.com/examples/advanced-table/)
- [Virtualization](https://niko-table.com/examples/virtualization-table/)
- [Server-Side](https://niko-table.com/examples/server-side-table/)

**Data Grid**

- [Introduction](https://niko-table.com/data-grid/introduction/)
- [Composed Grid](https://niko-table.com/examples/composed-grid/)
- [Cell Types](https://niko-table.com/examples/cell-types-grid/)
- [Persistence](https://niko-table.com/examples/persistence-grid/)

## Development

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm (recommended) or npm

### Setup

```bash
git clone https://github.com/Semkoo/niko-table-registry.git
cd niko-table-registry
pnpm install
cp .env.example .env
pnpm dev
```

Docs site: `http://localhost:4321`.

### Build the registry

```bash
pnpm registry:build
```

Install from a local registry:

```bash
npx shadcn@latest add http://localhost:4321/r/data-table.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and:

- [Contributing Code](https://niko-table.com/contributing/contributing-code/)
- [Feature Requests](https://niko-table.com/contributing/feature-request/)
- [Component Requests](https://niko-table.com/contributing/component-request/)

## Credits

Built on excellent open-source work:

- [TanStack Table](https://tanstack.com/table) by Tanner Linsley
- [shadcn/ui](https://ui.shadcn.com) by shadcn
- [sadmann7](https://github.com/sadmann7): [TableCN](https://github.com/sadmann7/tablecn), [DiceUI Sortable](https://www.diceui.com/docs/components/sortable)
- [nuqs](https://nuqs.dev/) by François Best
- [Web Dev Simplified Registry](https://github.com/WebDevSimplified/wds-shadcn-registry) by Kyle Cook

## License

[MIT](LICENSE)
