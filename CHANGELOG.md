# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Base UI (shadcn `base-nova`) support** — all 31 blocks now install cleanly into both shadcn generations: the classic Radix style (`new-york`) and the Base UI style (`base-nova`, the current `shadcn init` default). The source is dual-generation safe: Select/Slider callbacks accept both signatures (Base UI passes `(value | null, eventDetails)`), tooltip delays spread as `{ delayDuration, delay }` so each provider reads its own prop, `SortableContent`/`SortableItem`/`SortableItemHandle` spread `asChild` so the CLI's Base UI codemod doesn't rewrite it (the sortable component keeps the `asChild` API in both generations), and the filter menu's `Popover` callback is declared single-param. Verified by fresh-app installs of every block under both styles (0 type errors each).
- **Server-Side Grid example** — editable Data Grid backed by a server: rows stream in on scroll (`onNearEnd`, no pagination) and edits travel back as a `created`/`updated`/`deleted` changeset with per-row server validation and `reconcile`; unsaved edits survive chunk merges. [Server-Side Grid](/examples/server-side-grid/)
- **Drizzle ORM guide** — implements the server-side wire contract with Drizzle + Postgres (column mapping, filter→WHERE dispatch incl. OR logic, ORDER BY, facets as grouped counts, API route), with a live mocked demo that shows the generated SQL for the current view. [Drizzle ORM](/examples/drizzle-orm/)
- **Drizzle ORM + Nuqs example** — the Drizzle server-side table with all state (page, sorting, search, filters, column visibility) persisted in the URL via nuqs, so any view is shareable/bookmarkable and survives reload. Same Drizzle `buildWhere`/`buildOrderBy`/`computeFacets` and Generated SQL panel; only the state source changes. [Drizzle ORM + Nuqs](/examples/drizzle-orm-nuqs/)
- **Toolbar facet buttons on the Drizzle examples** — `DataTableFacetedFilter` (Category, Brand) added to the toolbar alongside the header funnels, reading server-computed facet counts (`dynamicCounts={false}` / `limitToFilteredRows={false}`; narrows by dropping count-0 while pinning the current selection).
- **`normalizeFiltersFromUrl` export** from `filters/table-filter-menu` — counterpart of `serializeFiltersForUrl` for restoring advanced-menu filters from a URL or controlled state without duplicating the helper.
- **Data Grid (`data-table-grid`)** — composable spreadsheet grid on Niko Table: `useDataGrid` + `<DataGrid>` + opt-in children (clipboard, fill, move, reorder, status bar, six cell editors). Id-addressed so sort/filter keep working. [Introduction](/data-grid/introduction/) · [API](/data-grid/api/)
- **Persistence (`data-table-grid-changes`)** — `useGridChanges` → `{ created, updated, deleted }`, dirty set, `reconcile`. [Persistence](/examples/persistence-grid/)
- **Inline validation** — `CellState.error` tooltip on invalid cells. [Validation](/examples/validation-grid/)
- **Column resize** — `<DataTableColumnResize />` (grip + double-click autosize). Regular example: [Column Resize Table](/examples/column-resize-table/)
- **Column fill on by default** — the first non-pinned data column absorbs the leftover row width (`resolveFlexColumnIds`), so tables fill the container and a trailing actions column pins right, with no per-table setup. `meta.flex` overrides which column fills; `meta.flex: false` / `TableMeta.disableFlexFill` opt out. Pure layout — never written to `columnSizing`. [Column Resize Table](/examples/column-resize-table/)
- **Header-fit** — `useHeaderMinWidths` measures each header label off-DOM (canvas, zero reflow) and floors un-resized columns at their header width, so a compact column never truncates its label on load. A user-resized column keeps its width.
- **Resizable fill column** — the flex column resizes via a custom pointer drag that starts from its rendered width (no jump) and hands the fill to the next column on release.
- **Column auto-fit** — opt-in `<DataTableColumnAutoFit />` marker: spreads leftover space evenly across resizable columns to fill on load (the alternative to single-column flex fill). Fixed columns (`enableResizing: false`) keep their size; re-fits on container growth and stops once the user resizes or `columnSizing` is restored. [Column Resize Table](/examples/column-resize-table/)
- **Column sizing persistence** — opt-in `useColumnSizingPersistence(storageKey)` hook (`data-table-column-sizing-persistence`): wire its `columnSizing` + `onColumnSizingChange` into `<DataTableRoot>` and resized widths persist to `localStorage`. Immediate write (resize is `onEnd`, one write per drag), **syncs across tabs**, sanitizes corrupt storage; returns `resetColumnSizing()`. [Persist Widths](/examples/column-resize-table/#persist-widths)
- **Row context menu** — write-once `RowMenu*` for kebab + right-click. [Row Context Menu](/examples/row-context-menu-table/)
- **`DataTableViewDndMenu`** — drag-to-reorder view menu (separate package; plain view menu stays dnd-kit-free)
- **Core bridges** — `scrollRowIntoView`, `flashRows` / `flashCells`, `toggleRowSelection`
- **`getRowMemoKey`** on all bodies; **`TableSearchFilter debounceMs`**; **`DataTableVirtualizedFlexHeader`**
- **Docs** — Data Grid overview layers (Components / Core / Filters / Hooks / Library / Types / Config) + Data Grid Examples sidebar (Basic, All Features, Cell Types, Validation, Dynamic Columns, Persistence)
- **Docs** — [Documentation Guidelines](/contributing/documentation-guidelines/) for overview vs examples
- **Registry** — `data-table-virtualized-row-dnd` / `data-table-virtualized-column-dnd` ship virtualized DnD structure per axis

### Changed

- **Server-side examples reworked around a database-agnostic wire contract** — the table talks to one function taking a serializable `{ page, pageSize, sorting, search, columnFilters }`; a fenced `MOCK SERVER` section (with operator → SQL mapping) is the stand-in for any backend. All filters run server-side out of the box (search, faceted, slider, date incl. single-date timestamps, boolean, advanced menu AND/OR), cross-filter facets included; demos are labeled mocked and ship bigger datasets. [Server-Side Table](/examples/server-side-table/) · [Server-Side Nuqs Table](/examples/server-side-nuqs-table/)
- **Grid examples flex-fill and breathe** — every grid example mounts `<DataTableColumnResize />` so columns fill the table width, and spaces its toolbar/status/table with `space-y-2` on `<DataGrid>`.
- **Docs** — installation guide and homepage note that both shadcn generations are supported (`new-york` Radix and `base-nova` Base UI).
- **Column resize applies on drag-end** — `columnResizeMode: "onEnd"` with a container-level preview guide line, so memoized rows don't re-render on every mousemove during a drag.
- **Composability** — row/column DnD import from `data-table-row-dnd-structure` / `data-table-column-dnd-structure` (virtualized twins likewise); registry packages no longer cross-ship the other axis
- **Composability** — `DEFAULT_MIN_COLUMN_SIZE` lives in `lib/constants` so `DataTableRoot` no longer imports the resize-handle module for a constant
- **Composability** — `enableSorting` defaults to `false` unless config or feature detection turns it on (sorted row model stays off without sort UI)
- **DnD** — all four DnD bodies support `DataTableRowContextMenuSlot` / `renderRowContextMenu` like plain bodies
- **DnD** — non-virtualized `DataTableDndColumnBody` honors column resize (`getSize()`, layout lock, truncate); column-DnD example mounts `<DataTableColumnResize />`

### Removed

- **`data-table-dnd-structure.tsx` / `data-table-virtualized-dnd-structure.tsx`** — no re-export shims. Import the axis files above instead.

- Data Grid docs rewritten — shorter, shadcn-style install → anatomy → usage
- Intro demo includes search / faceted / advanced filters + **Current Table State** panel
- Docs Source/API links use Astro `DocsLink`; install yarn tab is `yarn dlx`
- Install Everything / Components catalog cover all registry items (incl. resize, axis DnD packages, Data Grid)
- Manual Installation project tree documents `grid/`, column resize, and flash/scroll hooks
- [Skills](/getting-started/skills/) — Data Grid prompts + install paths for Cursor, Claude Code, Windsurf, and `.agents` / `.agent`
- `niko-table-best-practices` skill — Data Grid composition (`useDataGrid`, cells, opt-in children, `useGridChanges`)
- Filter variants: `dateRange` / `multiSelect` (camelCase)
- Options with `count: 0` hidden in filter UIs
- `autoResetPageIndex` defaults to `false`
- Minimum Node 24

### Fixed

- **Advanced filter menu ↔ faceted dropdown out of sync** — building two same-column equality rows in the advanced filter menu (e.g. "Brand is Samsung / or Brand is Adidas") routed the filter to `globalFilter`, so the column's faceted dropdown — which reads `columnFilters` — showed nothing selected even though the query was correct. `processFiltersForLogic` now collapses repeated same-column equality (`eq`/`in`) filters into a single `IN` entry kept in `columnFilters`, so both surfaces read and write the same value and stay in sync — while the menu keeps displaying it as simple per-value rows ("Brand is Samsung / or Brand is Adidas", one row per value, never a "has any of" multi-select row) via the new `expandMergedEqualityFilters`. Pending rows (value not yet chosen) are inert: they don't leak into the merged values and don't disturb the routing mid-edit. Genuine cross-column OR and same-column non-equality filters (e.g. "contains") still route to `globalFilter`. Affects every example that pairs a faceted filter with the filter menu, including server-side, Drizzle ORM, and nuqs.
- **Faceted filter — a selected value could vanish from its own facet** — with `limitToFilteredRows`, selecting a value that another column's filter then excludes (e.g. Brand = Apple while Category = Clothing, which has no Apple rows) dropped that value from the Brand facet's own option list. The filter stayed applied (the table narrowed to zero rows) but the button pill disappeared and the value couldn't be un-checked — it looked cleared but wasn't. A column's currently-selected values are now always pinned into its own facet (and never count-0 hidden), across the toolbar/header/menu surfaces, so they stay visible and removable. Non-selected values still narrow as before. New `extractFilterSelectedValues` helper in `lib/build-faceted-options`.
- **Faceted filter now honors caller-supplied counts** — `buildFacetedOptions` (the toolbar `DataTableFacetedFilter` path) prefers an option's own `count` over the row-derived one (`opt.count ?? recomputed`), matching the header-funnel path. Server-side tables can pass true server-computed facet counts to a toolbar facet without them being clobbered by client page-local counts. Backward compatible — only options that already carry a count are affected.
- **Registry — fresh installs were broken** — `lib/row-click.ts` and `lib/create-scroll-handler.ts` were imported by the core structure files but shipped by no registry item, so every clean `shadcn add @niko-table/data-table` failed to typecheck with module-not-found errors. Both now ship with `data-table` (#154).
- **Server-side examples** — single-date column filters (bare ms timestamp) now match rows server-side instead of falling through to a text comparison; large page sizes scroll inside `maxHeight` instead of growing the page.
- **Core** — keyboard nudge and double-click autosize now exit auto-fit like a drag does, so the fit no longer redistributes the space a keyboard user just removed
- **Core** — header-fit floors use the same label fallback as the rendered title (formatted column id), apply only to resizable columns (no phantom floors on utility columns), and keep Map identity when nothing changed (no extra full-table re-render after first paint)
- **Core** — the resize handle announces the real rendered width (`aria-valuenow`) for fill/floored columns, and an in-flight fill-column drag tears down if the table unmounts (no width committed to a dead table)
- **Core** — `useColumnSizingPersistence` skips the redundant state write on mount and rejects non-positive stored widths
- **Core** — `resolveColumnWidth` checks `resizing` before `isFlex`, so a flex column keeps its declared `size` when resizing is off
- **Core** — regular (and virtualized) body cells use `truncate` so resize-shrunk text ellipsizes instead of overlapping neighbors; resize-on default `minSize` is 40px (matches the grip clamp)
- **Core** — `DataTableDndBody` honors column resize (`getSize()`, layout lock, truncate) so Row DnD tables can mount `<DataTableColumnResize />`
- **DnD** — pass stable `React.useId()` to every `DndContext` so SSR hydration no longer mismatches on `aria-describedby="DndDescribedBy-N"`
- **DnD + resize** — virtualized flex/DnD headers and bodies honor column resize; resize grip `stopPropagation` so it doesn’t start a column reorder
- **Docs** — Introduction composability map markdown table (stray column broke rendering)
- **Docs** — sidebar scroll position preserved without Starlight’s `SidebarPersister` (avoids main-thread freeze with `starlight-theme-black`)
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
