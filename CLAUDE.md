# CLAUDE.md - Niko Table Registry

## Project Overview

Niko Table is a composable, shadcn-compatible data table component registry built with TanStack Table and React. The documentation site is powered by Astro Starlight. Components follow an open-code philosophy — users copy the source into their projects and own it.

## Commands

- `npm run dev` — Start dev server (http://localhost:4321)
- `npm run build` — Full build: `astro check && shadcn build && astro build`
- `npm run registry:build` — Rebuild component registry from `registry.json`
- `npm run lint` — ESLint with auto-fix
- `npm run format` — Prettier formatting

## Project Structure

```
src/
  components/niko-table/
    core/           # DataTableRoot, DataTable, context, structure components
                    # (regular, virtualized, DnD, and virtualized DnD variants)
    components/     # Context-aware wrappers (DataTable* prefix, use useDataTable())
    filters/        # Direct table prop components (Table* prefix)
    hooks/          # Table-specific hooks
    lib/            # Utilities (formatting, filtering, styles)
    types/          # TypeScript types
    config/         # Feature detection
  content/docs/     # Astro Starlight MDX documentation
  registry/new-york/examples/  # Registry example implementations
```

## Architecture Rules

- **Layer dependency (one-way only)**: Shared → Niko Table → Registry → Documentation
- **Two-layer component pattern**:
  - `components/` = context-aware (`DataTable*` prefix, use `useDataTable()` hook)
  - `filters/` = direct prop (`Table*` prefix, accept `table` prop)
- Exports go through barrel `index.tsx` files in each directory
- Registry examples must be self-contained (import only from `@/components/niko-table` and `@/components/ui`)
- Use semantic color tokens (`bg-success`, `text-destructive`) not hardcoded Tailwind colors

## DnD Architecture

Built on `@dnd-kit`. Three tiers of components:

1. **Filters** (`/filters/`) — Low-level primitives: `TableRowDndProvider`, `TableDraggableRow`, `TableRowDragHandle`, `TableColumnDndProvider`, `TableDraggableHeader`, `TableDragAlongCell`
2. **Components** (`/components/`) — Context-aware wrappers: `DataTableRowDndProvider`, `DataTableRowDragHandle`, `DataTableColumnDndProvider`, `DataTableDraggableHeader`, `DataTableDragAlongCell`
3. **Core** (`/core/`) — Structure components:
   - Standard: `DataTableDndBody`, `DataTableDndHeader`, `DataTableDndColumnBody`
   - Virtualized: `DataTableVirtualizedDndBody`, `DataTableVirtualizedDndHeader`, `DataTableVirtualizedDndColumnBody`

**Constraint**: Row DnD should NOT be combined with sorting/filtering (data order conflicts). Column DnD IS safe to combine with any feature.

## Documentation Patterns

- MDX files in `src/content/docs/niko-table/`
- Overview API docs in `overview/` subdirectory (`core.mdx`, `components.mdx`, `filters.mdx`)
- Example pages at top level (`row-dnd-table.mdx`, `column-dnd-table.mdx`, etc.)
- Sidebar navigation defined in `astro.config.mts`
- `CodePreview` component references registry examples by name: `<CodePreview demo="niko-table/example-name" />`
- Source code buttons link to GitHub using `GITHUB_REPO_URL` env variable
- Doc page pattern: frontmatter → overview with CodePreview → installation → code examples → props tables → key points → when to use → next steps

## Adding New Components

1. Create component in appropriate directory (`core/`, `components/`, or `filters/`)
2. Export from directory's `index.tsx`
3. Add registry entry in `registry.json` if installable
4. Create example in `src/registry/new-york/examples/niko-table/`
5. Document in corresponding `overview/` MDX file
6. Create example page MDX in `src/content/docs/niko-table/`
7. Add sidebar entry in `astro.config.mts`
