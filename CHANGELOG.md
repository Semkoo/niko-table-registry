# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`DataGridAddRows` — `className` + `label` props, and singular "Add row" copy.** `count={1}` now reads "Add row" instead of the ungrammatical "Add 1 rows"; any other count keeps "Add N rows". `className` restyles the button (e.g. a full-width dashed bar under the grid body for a spreadsheet-style always-visible single-row append), and `label` overrides the text. Backward-compatible — existing `<DataGridAddRows count={5} />` is unchanged. See [Data Grid API → Toolbar](/data-grid/api/#toolbar).
- **Inline cell validation errors (`CellState.error` → tooltip).** `GridCellDisplay` now renders a cell's `error` string in a tooltip when its `status` is `"invalid"` — so per-field and cross-field validation surfaces inline, on the offending cell, with no summary block. Valid/empty cells render the bare shell unchanged (the tooltip wraps only invalid cells, preserving the cheap display path). Wire it from any validation library; see the [Validation guide](/data-grid/validation/) for the Zod pattern (per-field schema in `resolve` + a cross-field rule folded onto the cell via `lastCommit`).
- **`data-table-grid-changes` — change tracking & persistence for the grid (opt-in).** A new `useGridChanges(grid, { initialRows, getRowId?, isEqual? })` hook that observes the uncontrolled engine and turns edits into a CRUD change-set: `getChangeSet()` → `{ created, updated, deleted }`, plus `dirtyRowIds` / `isDirty` (reactive), `reconcile({ succeededIds, failedIds })` to settle dirty state after a save (succeeded rows fold into the baseline, failed rows stay dirty and land in `failedRowIds`), and `reset(rows?)` to re-baseline. Classification is O(1) per keystroke (bulk ops recompute once); `isDirty` is conservative while `getChangeSet()` is precise (filters revert-to-original via `isEqual`). Plain React, no dependency; separate registry entry, requires `data-table-grid`. Powers staging saves, debounced autosave, and full CRUD. See the [Persistence guide](/data-grid/persistence/).
- **`grid.lastCommit` — a general "what changed last commit" engine signal (added to `data-table-grid`, backward-compatible).** `GridCommit` is `{ kind: "set" | "add" | "remove"; ids; seq }` or `{ kind: "bulk" | "reset"; seq }`. `seq` advances only on a real (non-no-op) commit, so any observer — a dirty badge, analytics, or `useGridChanges` — can `useEffect([grid.lastCommit?.seq])`.
- **`data-table-grid` — a composable, editable spreadsheet grid.** A new registry block that turns niko-table into an editable grid: a headless engine (`useDataGrid` — focused cell, selection rectangle, edit lifecycle, undo/redo, all addressed by row id so sort/filter work while editing) plus a composable skin (`<DataGrid>` container + cell editors + opt-in feature components) assembled inside `DataTableRoot` around the virtualized body. Keyboard cell navigation, drag range-select with edge auto-scroll, quote-aware TSV copy/cut/paste with one-to-many tiling, corner-drag fill, drag-to-move, grid-native row drag-to-reorder, dynamic columns (add/rename/move/delete/retype), a selection status bar (Count/Sum/Avg/Min/Max), cross-highlight, and six cell editors (text, number, currency, checkbox, date, select/combobox). Every capability is an opt-in child of `<DataGrid>` — unmounted features attach no listeners and tree-shake out. Depends on `data-table`, `data-table-virtualized`, and `data-table-column-resize`. See the [Data Grid example](/data-grid/introduction/) and the [API reference](/data-grid/api/).
- **Additive `data-table` core APIs (backward-compatible).** `scrollRowIntoView(index, { align })` + `useDataTableScroll()` — a virtualizer-agnostic scroll bridge. `flashRows(ids)` / `flashCells(cells)` + `useDataTableFlash()` — briefly highlight changed rows/cells (scroll into view + soft fade pulse), applied per-cell in both bodies. `toggleRowSelection(rowId, shiftKey)` — Shift+click range row selection in display order. A table that doesn't use them behaves identically.
- **`data-table-column-resize` — opt-in column resizing.** Mount `<DataTableColumnResize />` to enable drag-to-resize with a double-click autosize (measures natural text width) and a keyboard-operable handle. Separate registry entry; composes with `data-table` + `data-table-virtualized`.
- **Row context menu — composable, write-once row actions.** Give every row a native right-click menu that mirrors its "…" (kebab) dropdown, defined once and rendered into both surfaces. New files in the `data-table` block: `data-table-row-menu.tsx` (polymorphic `RowMenuItem` / `RowMenuSeparator` / `RowMenuSub` / `RowMenuSubTrigger` / `RowMenuSubContent` / `RowMenuGroup` / `RowMenuLabel` + `DataTableRowMenuScope` + `useDataTableRow`), `data-table-row-context-menu-slot.tsx` (`DataTableRowContextMenuSlot` — nest it in a body; optional `enabledFor` per-row predicate), and `data-table-row-context-menu.tsx` (the per-row primitive + open-row highlight). The `RowMenu*` pieces render as a dropdown or a context menu depending on the surface they read from context, so one `<XRowMenu>` powers both. Adds a `context-menu` registry dependency. See the [Row Context Menu Table example](/examples/row-context-menu-table/).
- **`renderRowContextMenu` prop on every body** — low-level escape hatch for a per-row menu when you'd rather pass a `(row) => menu` callback than nest `DataTableRowContextMenuSlot`; the slot takes precedence when both are present.
- **`TableViewDndMenu` / `DataTableViewDndMenu`** — new drag-to-reorder variant of the view menu (separate registry entry `data-table-view-dnd-menu`). Required `columnOrder` + `onColumnOrderChange` drive the same state the table consumes; combines with `TableColumnDndProvider` so header drag and menu drag stay in lockstep. Lives in its own file so consumers of the plain `TableViewMenu` skip the `@dnd-kit/*` bundle.
- **`TableViewMenu` / `TableViewDndMenu` — `lockedColumnIds` + `onReset` / `resetLabel`** (both menus). `lockedColumnIds` surfaces columns marked `enableHiding: false` in the list as disabled (always-on); `onReset` renders a Reset button at the bottom.
- **`ColumnMeta.formatOptionLabel`** — per-column label formatter for auto-derived faceted-filter options. Wins over `autoOptionsFormat`; ignored when the caller passes explicit `options`. Lets columns whose cell prefixes the raw value (e.g. `L${level}`, `$${amount}`) keep filter dropdown labels in sync.
- **`getRowMemoKey` prop** on all six body components — return a per-row string encoding external row state (inline edits, optimistic overlays). React.memo re-renders only the affected row. See the [Inline Edit Table example](/examples/inline-edit-table/).
- **`rowMemoKey` in expanded-row re-measure deps** — virtualized rows re-measure when inline edit state changes while expanded.
- **`DataTableVirtualizedFlexHeader`** — flex-layout header for `DataTableVirtualizedDndBody`.
- **`TableSearchFilter` — `debounceMs` prop** (default `0`). Input updates immediately; `table.setGlobalFilter` is delayed. Use `200`+ for large client-side datasets.

### Changed

- **Filter variant naming normalized to camelCase** — canonical variant values use `dateRange` and `multiSelect` (was `date_range` / `multi_select`).
- **Options with `count: 0` hidden across every filter UI** (faceted, filter-menu, inline). Server-side tables get automatic narrowing for free; opt-out per option by passing `count: undefined`.
- **`autoResetPageIndex` defaults to `false`** (was `true`). Sort/filter changes preserve the pagination cursor. Opt back in via `config={{ autoResetPageIndex: true }}`.
- **Minimum Node** bumped to 24 (was 22.13) via `.nvmrc` + `engines.node`.

### Performance

- **`TableViewMenu` + `TableViewDndMenu` tuned for 200+ columns** — `lockedColumnIds` consulted via a `Set` (O(1) per row instead of O(m)), rows extracted to a `React.memo`'d `MenuRow`/`MenuItem` with a stable `onToggle` callback, and plain `TableViewMenu` filters search at the parent (`shouldFilter={false}`) so non-matching rows skip rendering entirely instead of being rendered + hidden by cmdk. Search keystrokes at 200–500 columns now only reconcile the rows whose props actually changed.

### Fixed

- **`updateRows` polluted undo/redo when re-settling derived state.** A consumer that re-settles rows after an edit (e.g. folding validation status onto cells in a `lastCommit` effect) went through `updateRows`, which always pushed an undoable entry and cleared the redo stack — so undo stepped through the settle instead of the user's edit, and a settle after an undo could drop the redo history. `updateRows` now takes an optional `{ history: false }` that routes through a new non-undoable `settle` reducer path (leaves `past`/`future` untouched, still advances `lastCommit` so observers converge). Undoable by default; nothing changes for existing callers.
- **Portaled cell editors silently dropped mouse-picked values.** A grid cell editor that portals its surface (date calendar, combobox/command list, time picker) renders outside the cell's DOM, but React events still bubble through the React tree to the grid's cell `mousedown` handler. That handler called `selectCell`, which clears `editingCell` and unmounts the editor _before_ its own click / `onSelect` fired — so picking a date or option by mouse committed nothing (keyboard entry was unaffected). `onCellMouseDown` now bails when the event target is inside `[data-grid-cell-editor]`, matching the existing document-level click-away guard. Cell editors mark their portaled surface with that attribute (`GridDateCell`, `GridComboboxCell` already do); see [Cell Types → Portaled editors](/data-grid/cell-types/#portaled-editors--tag-the-surface-with-data-grid-cell-editor).
- **View menu split bundle cost** — moved DnD reorder out of `TableViewMenu` into the new `TableViewDndMenu`. Plain-menu consumers no longer pull `@dnd-kit/*`.
- **`TableViewDndMenu` orphan grip handles when search filters rows** — cmdk's built-in filter only hides the inner `CommandItem`. The menu now uses `shouldFilter={false}` and filters rows itself, so wrapper + handle + item disappear together for non-matching rows.
- **`TableViewDndMenu` drag handle a11y + partial `columnOrder` support** — handle is a real `<button>` (focus ring, `sortableKeyboardCoordinates`) instead of `<span role="button">`. Rows omitted from a partial `columnOrder` render without a handle rather than producing no-op drags.
- **`TableColumnDndProvider`** — 8px drag activation threshold on `MouseSensor` + `TouchSensor` so clicks on inline header chrome (sort menus, tooltips) land as clicks.
- **`TableSortMenu` / `DataTableSortMenu`** — "Add sort" is hidden when `enableMultiSort: false` AND a sort already exists. The first sort can still be added from the menu.
- **`TableSortMenu`** — next sorting derived from `table.getState().sorting` instead of closure-captured state.
- **Sort / filter / inline-filter column memos** — key on `table.options.columns` instead of the stable table ref.
- **`columnLayoutSignature` memo deps** — all six bodies now depend on `columnVisibility` / `columnOrder` / `columnPinning` from `table.getState()` instead of the stable `columns` array.
- **Filter menu / inline filter — stale counts on filter changes**. Pristine options captured in a ref and `meta.options` rebuilt each render, so cross-filter narrowing works.
- **`DataTableInlineFilter` + `useGeneratedOptions` mergeStrategy fallback** — component-level `mergeStrategy` now propagates into option generation as the fallback when column `meta.mergeStrategy` is unset. Fixes `limitToFilteredRows` + `mergeStrategy="replace"` inline-select options getting stuck narrowed after removing other filters.
- **Faceted filter** — caller-supplied options no longer narrowed to current row set; caller is the source of truth. `TableColumnFacetedFilterMenu` decouples `limitToFilteredRows` from the `multiple` default for caller options.
- **`TableRangeFilter`** — `[min, max]` memo depends on faceted scalars; `formatValue` no longer locale-formats numbers.
- **`TableSliderFilter` clear button** — always `stopPropagation()` (SVG/icon clicks no longer reopen the popover).
- **`TableSliderFilter` popover range feedback** — shows a live match-count badge for the active range (computed from faceted rows in current cross-filter context) and uses fluid min/max inputs for better narrow-layout usability.
- **`TableSearchFilter` `debounceMs`** — pending timer cancelled on `!debounceEnabled` early return and before out-of-band state resets, preventing stale flushes.
- **CSV export** — plain objects JSON-encoded instead of serializing as `[object Object]`.
- **Virtualized bodies** — expanded-row height re-measured on toggle/column-layout change without losing `useSortable` registration; `data-index` uses `virtualRow.index`; click delegation via stable `data-row-id`.
- **`VirtualizedBodyRowInner` / `VirtualizedDndColumnBodyRowInner`** — re-measure effect includes `columnLayoutSignature` so virtualizer picks up height changes while a row is expanded.
- **Virtualized non-DnD body** — `setColumnsLocked` race fixed; `columnsLocked` gates `measureElement`.
- **Column-DnD bodies** (virtualized + non-virtualized) — expanded-row rendering matched to other bodies.
- **Virtualized Row-DnD body** — selected row styling applies (`data-state="selected"`).
- **`onRowClick`** event type unified to `React.MouseEvent<HTMLElement>` across all bodies.
- **`DndBodyRow`** — `isSelected` added to props so `React.memo` re-renders on selection change.
- **`VirtualizedDraggableRow`** — `data-index` added alongside `data-row-index`.
- **Cross-table "state update on unmounted component"** warning silenced via mount-ref guards on every default state setter.
- **`FILTER_OPERATORS.RELATIVE`** hidden from the date-filter dropdown (kept for server-side consumers); per-row `console.error` throttled.
- **`getObjectHash`** — full sorted-keys join (was first-3 keys, false-negatived row selection with sequential IDs).

### Internal

- **Registry URL smoke test** skips pre-deploy entries by checking against the live `/r/registry.json` index. Fixes false-positive PR failures for newly-added registry items.

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
