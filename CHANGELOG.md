# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `DataTableVirtualizedFlexHeader` — flex-layout header that pairs with `DataTableVirtualizedDndBody`. The standard `DataTableVirtualizedHeader` uses table layout; pairing it with the row-DnD body (which uses flex because `useSortable` transforms don't compose with `display: table-row`) made columns drift apart. New header mirrors the body's cell sizing exactly. Pick the header that matches your body: plain → `DataTableVirtualizedHeader`, row-DnD → `DataTableVirtualizedFlexHeader`, column-DnD → `DataTableVirtualizedDndHeader`.

### Refactor

- Row-click guard + row resolution moved to `lib/row-click.ts`. The interactive-element list was inlined in 6 places across the four body files. Now exposed as `isInteractiveClickTarget(target)` (per-row variants) and `resolveRowFromClick(target, table)` (delegated `<tbody>` variants). No behavior change.

### Performance

- `expandColumnId` lookup memoized in all six bodies (was O(rows × cols) per render).
- `DataTableColumnHeaderRoot` context value memoized — consumers only re-render on column-identity change.
- `useKeyboardShortcuts` (multi-shortcut variant) — listener no longer re-attaches every render. `shortcuts` mirrored into a ref so callers can pass inline arrays without churn.
- `onRowSelection` no longer fires on initial mount — only on user-driven changes.
- `handleRowSelectionChange` honors the full TanStack `Updater<T>` contract (value or function) and side effects moved out of the state updater into a `useEffect` (React requires updaters to be pure). Behavior nuance: `onRowSelection` now fires on _any_ `rowSelection` change, including controlled updates.
- `tableOptions` memo deps trimmed to specific destructured props (`state`, `initialState`, `globalFilterFn`) instead of the unmemoized `rest` bag — eliminates the React-19 + Strict Mode + Turbopack "state update on a component that hasn't mounted yet" warning class.
- `DataTableLoading` now self-gates on `isLoading` (was rendering unconditionally).
- `useGeneratedOptions` — eliminated double `getFilteredRowsExcludingColumn` walk when both `limitToFilteredRows` and `dynamicCounts` are true.

### Fixed

- Virtualized non-DnD body — `onRowClick` event type unified to `React.MouseEvent<HTMLElement>` across all bodies. A single handler now works through wrappers that switch between bodies. Backward compatible.
- Virtualized DnD body — expanded-row height re-measured on toggle without losing `useSortable` registration. Stable `key={row.id}` is preserved; an `isExpanded` prop drives a `useEffect` that imperatively re-calls `measureRef`.
- Cross-table "state update on a component that hasn't mounted yet" warning silenced. `autoResetPageIndex` now defaults to `false` (matches TanStack's own default) and a mount-ref guards every default state setter. **Behavior change:** tables that previously reset to page 0 on sort/filter changes now preserve the cursor — better UX for server-side / infinite scroll. Opt back in via `config={{ autoResetPageIndex: true }}`.
- `FILTER_OPERATORS.RELATIVE` hidden from the date-filter dropdown until the comparison logic ships. Constant kept in the operator catalogue for server-side consumers.
- Per-row `console.error` for unimplemented RELATIVE filter throttled — module-scoped flag so the warning fires at most once per page load.
- Virtualized Row-DnD body — selected row styling now applies. `VirtualizedDraggableRow` carries `group flex w-full` and emits `data-state={isSelected ? "selected" : undefined}`; caller passes `isSelected={row.getIsSelected()}`.
- Virtualized bodies — `data-index` set to `virtualRow.index` (TanStack Virtual's slot index, not the source-data index) so dynamic measurements survive sort/filter/reorder. Click delegation switched to stable `data-row-id` + `table.getRow(rowId)`.
- Virtualized non-DnD body — `setColumnsLocked` race fixed; explicit `return` after the unlock branch lets React commit the unlocked render before re-locking.
- Virtualized non-DnD body — `columnsLocked` gate added around `measureElement` so `ResizeObserver` can't capture inflated row heights during the auto-layout pass.
- Column-DnD bodies (virtualized + non-virtualized) — expanded-row rendering now matches the other bodies. Same `data-slot="datatable-expanded-row"` block for measurement parity.
- Virtualized DnD bodies — `onRowClick` event type widened to `React.MouseEvent<HTMLElement>` (delegated on `<tbody>` at runtime; the prior `HTMLTableRowElement` typing was a lie).
- `VirtualizedDraggableRow` — added `data-index` alongside `data-row-index` so `measureElement` can map measured nodes back to virtualizer slots.
- Virtualized bodies — expanded-row height included in virtualizer measurement via a module-level helper that walks `nextElementSibling` for `data-slot="datatable-expanded-row"`.
- `getObjectHash` collision risk fixed — full sorted-keys join instead of "first 3 keys", which false-negatived row selection state with sequential IDs.

### Notes

- DnD virtualized bodies intentionally do not gate `measureElement` on `columnsLocked` — they use flex layout (no auto-layout pass to mismeasure during).

### Internal

- `data-table-virtualized-dnd-structure.tsx` marked `@internal` — deep-import only, not re-exported from the package barrel.
- Body-scroll listener extracted to `lib/create-scroll-handler.ts` (was duplicated across four bodies).

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
