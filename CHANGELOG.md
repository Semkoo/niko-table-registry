# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Data Grid (`data-table-grid`)** — composable spreadsheet grid on Niko Table: `useDataGrid` + `<DataGrid>` + opt-in children (clipboard, fill, move, reorder, status bar, six cell editors). Id-addressed so sort/filter keep working. [Introduction](/data-grid/introduction/) · [API](/data-grid/api/)
- **Persistence (`data-table-grid-changes`)** — `useGridChanges` → `{ created, updated, deleted }`, dirty set, `reconcile`. [Persistence](/data-grid/persistence/)
- **Inline validation** — `CellState.error` tooltip on invalid cells. [Validation](/data-grid/validation/)
- **Column resize** — `<DataTableColumnResize />` (grip + double-click autosize). Regular example: [Column Resize Table](/examples/column-resize-table/)
- **Row context menu** — write-once `RowMenu*` for kebab + right-click. [Row Context Menu](/examples/row-context-menu-table/)
- **`DataTableViewDndMenu`** — drag-to-reorder view menu (separate package; plain view menu stays dnd-kit-free)
- **Core bridges** — `scrollRowIntoView`, `flashRows` / `flashCells`, `toggleRowSelection`
- **`getRowMemoKey`** on all bodies; **`TableSearchFilter debounceMs`**; **`DataTableVirtualizedFlexHeader`**

### Changed

- Data Grid docs rewritten — shorter, shadcn-style install → anatomy → usage
- Intro demo includes search / faceted / advanced filters + **Current Table State** panel
- Docs Source/API links use Astro `DocsLink`; install yarn tab is `yarn dlx`
- Install Everything / Components catalog cover all 27 registry items (incl. resize + Data Grid)
- Manual Installation project tree documents `grid/`, column resize, and flash/scroll hooks
- Filter variants: `dateRange` / `multiSelect` (camelCase)
- Options with `count: 0` hidden in filter UIs
- `autoResetPageIndex` defaults to `false`
- Minimum Node 24

### Fixed

- **Core** — memoized body `columnLayoutSignature` includes `columns` so dynamic add/remove refreshes body cells (borders / row rules)
- **Core** — `data-row-index` uses display order (fixes `flashRows` / `scrollRowIntoView` after sort/filter)
- **Core** — empty/loading `colSpan` follows visible columns
- **Core** — resize width styles restored from snapshot when resizing turns off
- **Core** — row-context-menu slot discovery by `displayName` (HMR / re-export safe)
- **Core** — `daysAgo()` uses a fixed epoch (deterministic mock dates)
- **Grid** — validation settle no-op on same row refs (no infinite loop)
- **Grid** — selection / gutter use display index under sort/filter (not TanStack `row.index`)
- **Grid** — blank SSR seed uses `row-0`…; runtime inserts still use `makeId`
- **Grid** — scroll-into-view ignores right-pinned sticky cells (was yanking `scrollLeft`)
- **Grid** — undo/redo clears focus on removed row ids; filter/hide deselects ghost focus
- **Grid** — `extendSelectionTo` leaves edit mode; combobox no-op re-select skips undo
- **Grid** — `clearAll` blanks the seed row count (not always 5)
- **Grid** — pinned + resize: table width = sum of `getSize()` (no pin overlay on first column)
- **Grid** — portaled editors: `[data-grid-cell-editor]` mousedown guard
- **Grid** — `updateRows(..., { history: false })` for non-undoable settle
- **Grid** — persistence demo rejects incomplete creates (Name + Email) via `failedRowIds`
- View menu / DnD / sort / filter / virtualization polish (see prior notes in git history)

### Performance

- Memoized body rows + stable `measureElement`; delegated body clicks; rAF-coalesced scroll; view menus tuned for 200+ columns

### Internal

- Registry URL smoke test skips unpublished registry entries
- Row-click / scroll helpers extracted to `lib/`

## April 2026

### Fixed

- Virtualized table — column spacing no longer compresses on wide datasets. The column-lock effect now sets `tableEl.style.minWidth` to the sum of visible `column.getSize()` values before measuring, so the table can expand beyond its scroll container instead of being squeezed by `w-full`.

### Added

- `DataTableLoadingMore` and `DataTableVirtualizedLoadingMore` — composable "loading more" rows for infinite-scroll tables. Self-gate on `isFetching`.
- `onNearEnd` + `prefetchThreshold` on `DataTableVirtualizedBody` — virtualizer-index-driven prefetch trigger for infinite scroll. Strictly better than `onScrolledBottom`: catches fast scrolls, scrollbar drag, `scrollToIndex()` jumps, and short initial renders. Fires at most once per false→true transition.

### Changed

- Virtualized table — switched to native `<table>` layout with measure-and-lock column sizing. The browser distributes column widths from content; `DataTableVirtualizedBody` measures each `<th>` after first data render and locks to `table-layout: fixed`. Spacer rows use `<tr><td colSpan={n}>` to stay inside the table layout context.

### Fixed

- Scroll listener — `onScrolledBottom` / `onScrolledTop` now wire up even when `onScroll` isn't provided (was silently dead in all four bodies).
- Faceted filter — `dynamicCounts` honored on every code path (was silently ignored in fallback `useMemo` and the auto-generated branch).
- Faceted filter — caller-supplied `options` now go through count enrichment instead of short-circuiting (multi-select static-options filters now show live counts).
- Faceted filter — `TableColumnFacetedFilterMenu` now forwards `dynamicCounts` to the underlying hook (was dropping it).
- Faceted filter — zero-count options no longer disappear; option discovery is separated from count computation.

### Changed

- Faceted filter — multi-select now defaults `limitToFilteredRows` to `false` (single-select keeps `true`). Narrowing multi-select removed already-selected options from the visible list as the row set shrank. Expressed as `limitToFilteredRows ??= !multiple`.
- `preserve` merge strategy — returns user-defined `meta.options` untouched (no count injection). Only `augment` injects counts.

### Tests

- Vitest introduced. 23 tests covering every `(limitToFilteredRows × dynamicCounts)` permutation, merge-strategy branches, zero-count options, and prop-wiring regressions for both `TableColumnFacetedFilterMenu` and `DataTableFacetedFilter`.
- GitHub Actions CI runs `pnpm test`, `eslint`, and `pnpm build` on every PR and push to `main`.

### Documentation

- New example pages: Infinite Scroll Table (non-virtualized) and Infinite Scroll Virtualized Table.
- Core overview reference adds `DataTableLoadingMore`, `DataTableVirtualizedLoadingMore`, `onNearEnd`, `prefetchThreshold`.
- All product-based examples enriched with `brand`, `rating`, `revenue`, `releaseDate` columns; state-variant examples gain a Brand faceted filter.

---

## March 2026

### Performance

- Row click delegated at `<tbody>` instead of per-row across all six body components. Reduces allocations and keeps behavior consistent.
- `DataTableRoot`, `TablePagination`, `DataTableAside` — handlers memoized with `useCallback` for stable references.

### Fixed

- `TablePagination` — page input uses local draft state (typing `"1"` before completing `"12"` no longer jumps the table). Page index commits on blur or Enter.
- `TablePagination` — `onPageSizeChange` now receives the recalculated page index.
- Sticky header z-index — pinned body cells no longer overlap the sticky header. Sticky header `z-30` > header pinned `z-20` > body pinned `z-10`.
- Pinned header cells get `top: 0` in `getCommonPinningStyles` so they stick vertically when the header is sticky.

### Documentation

- `DataTableRoot` — docs list the required `children` prop and the optional `state` prop. Intro page documents `className`.

---

## February 2026 — Initial Release

The first public release of Niko Table — a composable, shadcn-compatible data table component registry built with TanStack Table and React.

### Components

- **DataTable** — Core data table with sorting, filtering, and pagination
- **DataTableVirtualized** — Virtualized rendering for large datasets
- **DataTablePagination** — Flexible pagination controls
- **DataTableSearchFilter** — Global search across all columns
- **DataTableFacetedFilter** — Multi-select faceted filtering with counts
- **DataTableFilterMenu** — Advanced filter menu with AND/OR logic
- **DataTableInlineFilter** — Inline filter bar with mixed operator support
- **DataTableSliderFilter** — Range slider filtering for numeric columns
- **DataTableDateFilter** — Date and date range filtering
- **DataTableExportButton** — CSV/JSON export
- **DataTableAside** — Side panel for row details
- **DataTableSelectionBar** — Bulk actions on selected rows
- **DataTableColumnSort** — Sort menu and sort icon components
- **DataTableColumnHide** — Column visibility toggle
- **DataTableColumnPin** — Column pinning (left/right)

### Features

- Row DnD, Column DnD (`@dnd-kit`)
- Row selection (single + multi) with bulk actions
- Row expansion with custom content
- Tree table — hierarchical data with expand/collapse
- Virtualization for 10k+ rows
- URL state via `nuqs`
- Server-side filtering, sorting, and pagination

### Filter System

- 15+ filter operators (contains, equals, greater than, between, etc.)
- Mixed AND/OR logic with mathematical precedence
- Per-filter join operator control
- Regex-cached filter execution for large datasets
