# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `DataTableVirtualizedFlexHeader` — flex-layout header for `DataTableVirtualizedDndBody`. Pick by body: plain → `DataTableVirtualizedHeader`, row-DnD → `DataTableVirtualizedFlexHeader`, column-DnD → `DataTableVirtualizedDndHeader`.
- `TableSearchFilter` — `debounceMs` prop (default `0`). Keystrokes update the input immediately; `table.setGlobalFilter` is delayed by the configured amount. Recommended at `200`+ for large client-side datasets; leave at `0` for server-driven tables where the network is already the rate limiter. In controlled mode, debounce in the consumer's `onChange` instead.

### Changed

- **Options with `count: 0` are hidden across every filter UI** (faceted filter, filter menu, inline filter). Server-side tables that pass cross-filter counts get automatic narrowing without writing helpers. Pure label-only callers (no counts) unaffected. Opt-out per option by passing `count: undefined`.
- **`autoResetPageIndex` defaults to `false`** (was `true`). Sort/filter changes now preserve the pagination cursor. Opt back in via `config={{ autoResetPageIndex: true }}`.

### Fixed

- **`TableRangeFilter`** — `[min, max]` memo now depends on faceted scalars, so the range refreshes when row data changes. `formatValue` no longer locale-formats numbers (`type="number"` inputs reject localized output).
- **`TableSliderFilter` clear button** — always `stopPropagation()` (was DIV-only, so SVG/icon clicks bubbled and re-opened the popover).
- **Sort / filter / inline-filter column memos** — now key on `table.options.columns` (table ref alone is too stable across column rebuilds).
- **`TableSortMenu`** — derives the next sorting from `table.getState().sorting` instead of the closure-captured `sorting`, eliminating drift if the callback fires across renders.
- **CSV export** — plain objects are now JSON-encoded instead of serializing as `[object Object]`.
- **Filter menu / inline filter — stale counts on filter changes.** `<DataTableFilterMenu />` and `<DataTableInlineFilter />` mutate `meta.options` to inject counts; once a count was pinned on first render it survived later filter changes, so the count-0 hide rule never fired (e.g. selecting Category=Clothing left every Brand option visible). Pristine options are now captured in a ref and `meta.options` is rebuilt from that source each render, so cross-filter narrowing works in both filter UIs (matching the column-header faceted filter).
- Faceted filter — caller-supplied options no longer narrowed to current row set; caller is the source of truth.
- `TableColumnFacetedFilterMenu` — `limitToFilteredRows` decoupled from `multiple` default for caller options (still applies to auto-generated/fallback).
- Cross-table "state update on unmounted component" warning silenced via mount-ref guards on every default state setter.
- `onRowClick` event type unified to `React.MouseEvent<HTMLElement>` across all bodies.
- Virtualized DnD body — expanded-row height re-measured on toggle without losing `useSortable` registration.
- Virtualized non-DnD body — `setColumnsLocked` race fixed; `columnsLocked` gates `measureElement`.
- Virtualized bodies — `data-index` uses `virtualRow.index`; click delegation via stable `data-row-id` + `table.getRow(rowId)`.
- Virtualized bodies — expanded-row height included in virtualizer measurement.
- Virtualized Row-DnD body — selected row styling applies (`data-state="selected"`).
- Virtualized DnD bodies — `onRowClick` widened to `React.MouseEvent<HTMLElement>`.
- Column-DnD bodies (virtualized + non-virtualized) — expanded-row rendering matched to other bodies.
- `VirtualizedDraggableRow` — added `data-index` alongside `data-row-index`.
- `FILTER_OPERATORS.RELATIVE` hidden from the date-filter dropdown (kept in catalogue for server-side consumers); per-row `console.error` throttled.
- `getObjectHash` — full sorted-keys join (was first-3 keys, false-negatived row selection with sequential IDs).
- `DndBodyRow` — `isSelected` was missing from props, so `React.memo` never re-rendered on selection changes; `TableDraggableRow`'s `data-state` stayed stale.
- `VirtualizedDndColumnBodyRow` — expansion toggle no longer silently skips the virtualizer re-measure. Added `elementRef` + `useEffect` matching the pattern in `VirtualizedDraggableRow`, so the combined base + expanded-pane height is measured without remounting the row.
- `TableSearchFilter` `debounceMs` — out-of-band table state resets (URL nav, programmatic clear) now cancel any pending debounce flush before syncing `pendingValue`, preventing a stale keystroke timer from overwriting the reset.

### Performance

- Scroll handler rAF-coalesced; `onScrolledTop` / `onScrolledBottom` fire only on the leading edge (false→true).
- Row-click guard hardened — suppresses clicks during active text selection; recognizes `textarea`, `select`, `label`, `[contenteditable]`, and ARIA `combobox`/`menuitem`/`textbox`.
- Slider filters — `facetedMin`/`facetedMax` hoisted into memo deps so `[min, max]` stays reactive on data change.
- `TableViewMenu` visible-columns memo keys on `table.options.columns` (was just table ref).
- `DataTableBody` — row clicks delegated to `<tbody>`, removing one listener per row.
- `tableOptions` — 6 inline fallback setters extracted to stable `useCallback`s; deps trimmed to destructured `state` / `initialState` / `globalFilterFn`.
- `expandColumnId` memoized in all six bodies (was O(rows × cols) per render).
- All six body row components wrapped with `React.memo` (`BodyRow`, `DndBodyRow`, `DndColumnBodyRow`, `VirtualizedBodyRow`, `VirtualizedDndBodyRow`, `VirtualizedDndColumnBodyRow`). A single-row state change (selection, expansion) now reconciles only that row rather than every visible row. Each component receives a `columnLayoutSignature` prop (visible col ids + pinning encoded as a string) so memo correctly invalidates on column visibility / order / pinning changes.
- `measureRowWithExpansion` — base-row height now reads from `ResizeObserverEntry.borderBoxSize[0].blockSize` when TanStack Virtual passes the entry, skipping a `getBoundingClientRect` forced layout read on the hot measure path. Falls back to `getBoundingClientRect` for initial measure and expanded sibling.
- Stable `measureElement` wrapper added to all virtualized bodies — the virtualizer recreates its callback on every render; wrapping it in a `useRef` + `useCallback([])` keeps the prop reference stable so `React.memo` on the row component isn't defeated on every parent render.
- `DataTableColumnHeaderRoot` context value memoized.
- `useKeyboardShortcuts` listener no longer re-attaches every render.
- `onRowSelection` no longer fires on initial mount — user-driven changes only.
- `handleRowSelectionChange` honors full `Updater<T>` contract; side effects moved to `useEffect`.
- `DataTableLoading` self-gates on `isLoading`.
- `useGeneratedOptions` — eliminated double `getFilteredRowsExcludingColumn` walk.

### Refactor

- Row-click guard moved to `lib/row-click.ts` (was inlined in 6 places); body-scroll listener extracted to `lib/create-scroll-handler.ts`.

### Internal

- `data-table-virtualized-dnd-structure.tsx` marked `@internal`.
- DnD virtualized bodies don't gate `measureElement` on `columnsLocked` — flex layout has no auto-layout pass.

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
