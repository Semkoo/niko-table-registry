# Niko Tables

**Nobody's table, everyone's solution.**

A comprehensive, production-ready DataTable component built with [TanStack Table](https://tanstack.com/table/latest) and [Shadcn UI](https://ui.shadcn.com). Copy the code into your project, customize it to your needs, and ship with confidence.

> This is not a component library you install. It's open code you own.

## Principles

Niko Tables is built around the following principles:

**Open Code:** The top layer of your component code is open for modification. You get the full source code — not a black box. Modify any component, change any behavior, style anything your way.

**Composition:** Every table is built by composing small, predictable components. Start with `DataTableRoot`, add `DataTableHeader`, `DataTableBody`, filters, pagination — mix and match to build exactly what you need.

**Distribution:** A flat-file schema and the `shadcn` CLI make it easy to add components to your project. Run one command and you're ready to go.

**Beautiful Defaults:** Carefully chosen default styles powered by Shadcn UI and Tailwind CSS, so you get great design out-of-the-box without any configuration.

**AI-Ready:** Open code that LLMs can read, understand, and improve. No hidden abstractions, no private APIs — just clean, well-documented TypeScript.

## Features

- **Sorting** — Single and multi-column sorting with drag-and-drop reordering
- **Filtering** — Global search, faceted filters, date filters, slider filters, inline filters with AND/OR logic
- **Pagination** — Client-side and server-side with customizable page sizes
- **Row Selection** — Individual and bulk selection with action bar
- **Row Expansion** — Expandable rows with custom detail views
- **Column Pinning** — Pin columns to left or right edges
- **Column Visibility** — Show/hide columns dynamically
- **Virtual Scrolling** — Handle 10,000+ rows with smooth performance
- **Export** — Export all or selected rows to CSV
- **URL State** — Persist table state in the URL with [nuqs](https://nuqs.dev)
- **Server-Side** — Full support for server-side pagination, filtering, and sorting
- **Tree Tables** — Hierarchical data with expandable parent rows
- **Sidebar Panels** — Left and right aside panels for filters or detail views
- **Composable Column Headers** — Build custom column headers with sort, filter, pin, and hide controls
- **Empty States** — Composable empty state with filtered/unfiltered messaging
- **Type-Safe** — Full TypeScript support with comprehensive type definitions
- **Accessible** — WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Responsive** — Mobile-friendly design with touch-friendly controls

## Quick Start

### Install via CLI (Recommended)

```bash
npx shadcn@latest add https://niko-table.com/r/data-table.json
```

This copies all DataTable components into your project. You own the code.

### Manual Installation

Copy the component files from `src/components/niko-table/` into your project. See the [Manual Installation Guide](https://niko-table.com/getting-started/manual-installation) for details.

### Required Dependencies

```bash
npm install @tanstack/react-table
```

Optional dependencies for advanced features:

```bash
# Virtual scrolling
npm install @tanstack/react-virtual

# URL state management
npm install nuqs

# Drag and drop sorting
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
```

## Usage

### Simple Table

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core"

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

### Add Features Incrementally

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTableSearchFilter,
  DataTableFilterMenu,
  DataTableViewMenu,
  DataTableSortMenu,
  DataTablePagination,
} from "@/components/niko-table/components"

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

## Architecture

Niko Tables uses a **two-layer architecture** for maximum flexibility:

**Components** (`/components/`) — Context-aware wrappers that use `useDataTable()` to automatically get the table instance from `DataTableRoot`. Zero prop drilling, recommended for most use cases.

```tsx
<DataTableSearchFilter /> // Automatically connected via context
```

**Filters** (`/filters/`) — Core implementations that accept a `table` prop directly. Use these when building custom components or managing the table instance yourself.

```tsx
<TableSearchFilter table={table} /> // Direct table prop
```

```
niko-table/
├── core/          # DataTableRoot, context, structure
├── components/    # Context-aware components (DataTable*, column headers, empty states)
├── filters/       # Core filter implementations (Table*)
├── hooks/         # Custom React hooks
├── config/        # Feature detection and configuration
├── lib/           # Utilities, constants, formatting
└── types/         # TypeScript type definitions
```

## Documentation

Full documentation with interactive examples is available at **[niko-table.com](https://niko-table.com)**.

- [Introduction](https://niko-table.com/getting-started/introduction) — Philosophy and architecture
- [Installation](https://niko-table.com/getting-started/installation) — Setup your project
- [Simple Table](https://niko-table.com/niko-tables/simple-table) — Your first table
- [Basic Table](https://niko-table.com/niko-tables/basic-table) — Pagination and sorting
- [Advanced Table](https://niko-table.com/niko-tables/advanced-table) — Full filtering
- [Server-Side Table](https://niko-table.com/niko-tables/server-side-table) — Server-side data

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

The documentation site will be available at `http://localhost:4321`.

### Build the Registry

```bash
pnpm registry:build
```

Test installing a component from your local registry:

```bash
npx shadcn@latest add http://localhost:4321/r/data-table.json
```

## Contributing

We welcome contributions! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

- [Contributing Code](https://niko-table.com/contributing/contributing-code)
- [Feature Requests](https://niko-table.com/contributing/feature-request)
- [Component Requests](https://niko-table.com/contributing/component-request)

## Credits

Built on top of excellent open-source work:

- [TanStack Table](https://tanstack.com/table) by Tanner Linsley — The headless table library that powers everything
- [Shadcn UI](https://ui.shadcn.com) by Shadcn — Beautiful, accessible component primitives
- [sadmann7](https://github.com/sadmann7) — Major inspiration for filter components and table patterns:
  - [TableCN](https://github.com/sadmann7/tablecn) — Inspired filter menu, inline filter, faceted filter, and slider filter
  - [DiceUI Sortable](https://www.diceui.com/docs/components/sortable) — Drag and drop sortable for row reordering
- [nuqs](https://nuqs.dev/) by François Best — Type-safe search params state manager
- [Web Dev Simplified Registry](https://github.com/WebDevSimplified/wds-shadcn-registry) by Kyle Cook — Registry implementation pattern

## License

Licensed under the [MIT License](LICENSE).
