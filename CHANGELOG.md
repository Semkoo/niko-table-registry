# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `DataTableVirtualizedFlexHeader` — flex-layout header for `DataTableVirtualizedDndBody`. Pick by body: plain → `DataTableVirtualizedHeader`, row-DnD → `DataTableVirtualizedFlexHeader`, column-DnD → `DataTableVirtualizedDndHeader`.

### Refactor

- Row-click guard moved to `lib/row-click.ts` — `isInteractiveClickTarget()` + `resolveRowFromClick()`. Was inlined in 6 places.

### Changed

- **Faceted filter — caller-supplied options with `count: 0` are hidden by default.** Server-side tables that pass cross-filter counts now get automatic narrowing — selecting Category=Electronics hides "Brand: Nike" without each caller writing a filter helper. Pure label-only callers (no counts anywhere) are unaffected. Opt-out per option by passing `count: undefined`.

### Fixed

- **Faceted filter — caller-supplied options no longer narrowed to current row set.** Previously the `enrichedCallerOptions` memo silently filtered options to values present in `filteredRows`/`coreRows`, which on server-side tables meant the dropdown only ever showed values from the current page. Caller is now the source of truth for the option list; cross-filter counts (above) handle narrowing.
- **`TableColumnFacetedFilterMenu` `multiple` default** documented (`true`). Previously `undefined`, which made `limitToFilteredRows ??= !multiple` resolve to `true` and silently hide options not present in the current row set. The `enrichedCallerOptions` rewrite makes this default-decoupled — `limitToFilteredRows` only applies to auto-generated/fallback options now.

### Performance

- Slider filters (`TableColumnSliderFilter`, `TableSliderFilter`) — `facetedMin`/`facetedMax` hoisted into memo deps so `[min, max]` stays reactive when filters or row data change.
- `TableViewMenu` — visible-columns memo now keys on `table.options.columns` (table ref alone was too stable).
- `DataTableBody` — row clicks delegated to `<tbody>` via `resolveRowFromClick`, matching the DnD bodies and removing one listener per row.
- `tableOptions` memo: 6 inline fallback setters extracted to stable `useCallback`s; `setX` setters dropped from dep array.
- `tableOptions` memo deps now use destructured `state` / `initialState` / `globalFilterFn` instead of the `rest` bag — silences the React-19 + StrictMode "state update on unmounted component" warning class.
- `expandColumnId` memoized in all six bodies (was O(rows × cols) per render).
- `DataTableColumnHeaderRoot` context value memoized.
- `useKeyboardShortcuts` listener no longer re-attaches every render (shortcuts mirrored into a ref).
- `onRowSelection` no longer fires on initial mount — user-driven changes only.
- `handleRowSelectionChange` honors full `Updater<T>` contract; side effects moved into a `useEffect`.
- `DataTableLoading` self-gates on `isLoading`.
- `useGeneratedOptions` — eliminated double `getFilteredRowsExcludingColumn` walk.

### Fixed

- `onRowClick` event type unified to `React.MouseEvent<HTMLElement>` across all bodies (backward compatible).
- Virtualized DnD body — expanded-row height re-measured on toggle without losing `useSortable` registration.
- Cross-table "state update on unmounted component" warning silenced. `autoResetPageIndex` now defaults to `false`. **Behavior change:** sort/filter changes preserve pagination cursor. Opt back in via `config={{ autoResetPageIndex: true }}`.
- `FILTER_OPERATORS.RELATIVE` hidden from the date-filter dropdown (kept in catalogue for server-side consumers).
- RELATIVE filter `console.error` throttled to once per page load.
- Virtualized Row-DnD body — selected row styling applies (`data-state="selected"`).
- Virtualized bodies — `data-index` uses `virtualRow.index`; click delegation via stable `data-row-id` + `table.getRow(rowId)`.
- Virtualized non-DnD body — `setColumnsLocked` race fixed and `columnsLocked` gates `measureElement`.
- Column-DnD bodies (virtualized + non-virtualized) — expanded-row rendering matched to other bodies.
- Virtualized DnD bodies — `onRowClick` widened to `React.MouseEvent<HTMLElement>`.
- `VirtualizedDraggableRow` — added `data-index` alongside `data-row-index`.
- Virtualized bodies — expanded-row height included in virtualizer measurement.
- `getObjectHash` — full sorted-keys join (was first-3 keys, false-negatived row selection with sequential IDs).

### Internal

- `data-table-virtualized-dnd-structure.tsx` marked `@internal`.
- Body-scroll listener extracted to `lib/create-scroll-handler.ts`.

### Notes

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
