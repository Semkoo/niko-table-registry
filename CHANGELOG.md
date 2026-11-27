# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **One registry URL for all three bases** — the docs (home, Installation, Niko Table and Niko Grid introductions, README) now tell every user to register `https://niko-table.com/r/{style}/{name}.json`, so the shadcn CLI picks the Radix, Base UI or React Aria build from the project's `style`, like shadcn/ui itself. Non-`aria-*` styles get the same `/r/<name>.json` file as before, and the old `/r/{name}.json` URL keeps working.
- **React Aria support, part 2: installable from the registry (experimental)** — `registry:build` now also runs `scripts/build-registry-aria.mjs`, which writes a React Aria build of every item to `public/r-aria/<name>.json` (primitives replaced by `registry-aria/`, niko-table `registryDependencies` pointed at `/r-aria/`, the `command` shadcn dependency dropped in favour of the `cmdk` npm package, and `react-aria`, `react-aria-components`, `@internationalized/date` added where the primitives import them). `public/_redirects` serves `/r/{style}/{name}.json` for every shadcn style: the eight `aria-*` styles (vega, nova, maia, lyra, mira, luma, rhea, sera) get `/r-aria/`, any other style gets the unchanged `/r/<name>.json`. React Aria users register `"@niko-table": "https://niko-table.com/r/{style}/{name}.json"` in `components.json` (the shadcn directory entry still lists `/r/{name}.json`, which is the Radix build). `public/r` is byte-for-byte unchanged. The install harness now installs like a user (`shadcn add @niko-table/<name>` through the `{style}` URL, served with the `_redirects` rewrites), with no file swapping, and runs the app's tests. Verified: fresh React Aria (`aria-nova`) Vite app, all 44 items: 0 type errors, builds, 16 runtime tests pass; Base UI app: 0 errors, builds. A new `aria-*` style from shadcn needs one more `_redirects` line.
- **Blocks page previews and categories** — `/blocks/` now shows each block as a card with a half-size live preview (a lazy `iframe` of `/view/<name>/?thumb`, inert so the card is one link) grouped by category (Base, Filtering, Columns, Expansion, Grouping, Editing, Drag & Drop, Virtualization), each a `##` section in "On this page". Every entry in `src/data/blocks.ts` now has a `category`; `blockCategories` sets the order and a test checks every block uses one.
- **Changelog rules** in `CLAUDE.md` and the Documentation Guidelines: the public changelog page is plain English in point form; technical detail stays in this file.
- **React Aria support, part 1 (experimental)** — shadcn's third base, React Aria (`aria-*` styles), now type-checks and builds with all 44 Niko Table items (blocks included), down from 247 errors. Every shadcn component whose React Aria version has a different shape (popover, tooltip, dropdown-menu, context-menu, dialog, sheet, select, checkbox, slider, calendar, command, button) is imported through one file in `components/niko-table/primitives/`; on Radix and Base UI these only re-export the shadcn members, so there is no behaviour change, but every install now also adds a `components/niko-table/primitives/` folder. React Aria versions of those files live in `registry-aria/niko-table/primitives/` (see its README). New `DropdownMenuPanel` marks free-form content in column-action menus; `RowMenuSub` re-provides the row scope to its submenu. `scripts/test-install-local.mjs` (`pnpm test:install:local`, `:base`, `:aria`) installs the locally built `public/r` into a real app through a local server instead of niko-table.com, optionally swaps in the React Aria files, then type-checks and builds. Verified: Base UI app 0 errors and builds; React Aria app 0 errors, builds, and a jsdom smoke test of menus, submenu, right-click menu, popovers, calendar, select and tooltip passes. Known differences on React Aria: popovers and menus are modal, the command list stays on cmdk, single-date calendars cannot be cleared by clicking the selected day, and a range calendar reports only complete ranges.
- **Inventory Grid block** (`@niko-table/inventory-grid`) — an editable product inventory on Niko Grid with a typed editor per column (text, number, select, checkbox, date), inline validation (price above 0, whole-number stock, required name), low-stock markers, live totals, an unsaved changes bar driven by `useGridChanges` (Save disables while any cell is invalid, Discard reverts), add / duplicate / delete product, undo and redo, copy and paste, and a virtualized body. [Inventory Grid](/blocks/inventory-grid/)
- **Transactions block** (`@niko-table/transactions-table`) — a bank-style ledger that loads as you scroll: a seeded fake server serves 20,000 transactions 100 at a time (`onNearEnd` plus a Load more button), search and the Category and Type filters run on the server with `manualFiltering`, stale responses are ignored by request id, the day shows once per group of same-day rows, and View details / Copy transaction ID / Show only this category are one piece each, shared by the row menu and right-click. [Transactions](/blocks/transactions-table/)
- **Shipments block** (`@niko-table/shipments-table`) — a wide logistics table you shape yourself: every column resizes (`DataTableColumnResize`, double-click to autosize) with widths saved by `useColumnSizingPersistence`, each column menu has sort, Pin left / Pin right / Unpin and Hide, pinning and visibility persist too, and a Reset layout button restores the defaults. Tracking ID is pinned start and the row menu end by default. Route and late-ETA cells, a status badge, and Copy tracking ID / Mark delivered / Flag exception (one piece each, shared by the row menu and right-click). Sample data is generated by a seeded PRNG. [Shipments](/blocks/shipments-table/)
- **Sprint Backlog block** (`@niko-table/backlog-table`) — a sprint backlog you prioritize by dragging rows (`DataTableRowDndProvider` + `DataTableDndBody`, keyboard sensor included, with an aria-live note after each move), a capacity line that marks issues "Below the line" and moves as you reorder, column order from `DataTableViewDndMenu`, drag handles that switch off while a search or filter is active, and Move to top / Move to bottom / Status / Remove from sprint actions (one piece each, shared by the row menu and right-click). [Sprint Backlog](/blocks/backlog-table/)
- **Invoices block** (`@niko-table/invoices-table`) — a billing screen with invoices grouped by status through `DataTableGroupedRows` (each group shows its invoice count and summed amount; on by default, switched on and off from a toolbar button (the Status column menu can also turn it on)), KPIs (outstanding, overdue, paid this month, drafts) that follow the filters, a due date range filter, due-in / overdue-by labels, and Mark as paid / Send reminder / Copy invoice link / Void invoice actions (one piece each, shared by the row menu and right-click) plus bulk Mark as paid. Voiding moves an invoice to a `void` status instead of deleting it. Sample data is generated by a seeded PRNG. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [Invoices](/blocks/invoices-table/)
- **API Request Logs block** (`@niko-table/request-logs-table`) — a developer request log that renders 5,000 seeded requests through `DataTableVirtualizedBody` in a fixed-height scroll area (only the visible window is in the DOM), with a summary (requests, error rate, p95 latency) that follows the filters, method / status class / region filters, a latency slider, and a details panel with a response preview. View details / Copy request ID / Filter by this path are one piece each, shared by the row menu and right-click. Sample data is generated by a seeded PRNG. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [API Request Logs](/blocks/request-logs-table/)
- **Team Members block** (`@niko-table/team-table`) — a workspace members screen with the member and actions columns pinned (`columnPinning` start/end) so they stay put while the rest scrolls sideways, a Role submenu in the row menu (`RowMenuSub`, shared by the kebab and right-click, owner locked), Resend invite / Suspend / Reactivate / Remove per member, bulk remove, and an Invite member dialog. Sample data is generated by a seeded PRNG. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [Team Members](/blocks/team-table/)
- **Support Tickets block** (`@niko-table/tickets-table`) — a support inbox with quick views (All, Mine, Unassigned, At risk, Solved) that write the same filters as the toolbar so both stay in sync, SLA timers sorted most urgent first, priority / status / assignee filters, a Priority submenu in the row menu (`RowMenuSub`, shared by the kebab and right-click), and Assign to me / Mark solved per ticket or in bulk. Quick views are plain buttons because Radix and Base UI `ToggleGroup`s take different value shapes. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [Support Tickets](/blocks/tickets-table/)
- **GitHub stars** — the header's GitHub link shows the repo's star count, and every docs page ends with a short "Find Niko Table useful? Star it on GitHub" prompt. The count is fetched once at build time (`src/lib/github-stars.ts`), so visitors never call the GitHub API; if the fetch fails, only the icon shows. Set `GITHUB_TOKEN` in the build environment to avoid GitHub's unauthenticated rate limit.
- **Orders Table block** (`@niko-table/orders-table`) — an orders screen with live totals (orders, paid revenue, awaiting payment, to ship) that follow the filters, payment and fulfillment filters, a price slider, a date range, expandable rows with line items and totals, and Mark as shipped / Copy order ID / Refund actions (one piece each, shared by the row menu and right-click) plus bulk Mark as shipped. Sample data is generated by a seeded PRNG. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [Orders Table](/blocks/orders-table/)
- **Blocks** — full, ready-to-copy screens built only from Niko Table pieces and shadcn/ui. First block: **Customers Table** (`@niko-table/customers-table`) with search, status/plan filters, sortable columns, bulk selection, CSV export, a details panel on row click, an add-customer form, and a row menu that also opens on right-click. Each block has a page at `/blocks/<name>/` (Preview / Code, desktop / tablet / mobile widths, open in a new tab) and a bare view at `/view/<name>/`. The registry item adds `success` / `warning` color tokens on install. Verified by installing into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes. [Blocks](/blocks/)
- **Example galleries** — [Table Examples](/examples/) and [Grid Examples](/data-grid/examples/) show every example as a card with a half-size live preview, one section per group, listed in "On this page". Previews load when scrolled into view (`client:visible`) and are inert, so the whole card is one link. The top nav's "Table Examples" and "Grid Examples" links and a new "Gallery" entry in each sidebar group open them. Groups live in `src/data/example-gallery.ts`, and a test fails if they drift from the example pages.

- **`DataTableGroupedRows`** — group rows are now composed, not configured. Nesting `<DataTableGroupedRows />` in a `DataTableBody` renders the bands **and** is what feature detection reads to enable grouping + expanding, so there is no `config.enableGrouping` to set and no renderer to wire — the same marker contract as `DataTableColumnResize` and `DataTableRowContextMenuSlot`. Bring your own band by nesting a component that reads `useDataTableGroupRow()` (no render prop, no callback); `enabledFor` falls individual groups back to the built-in row, and `DataTableGroupedRowCells` is exported for reuse. Group bands render in both `DataTableBody` and `DataTableVirtualizedBody` from the same marker (leave `fixedRowHeight` off there — a band is taller than a leaf row and must be measured); the DnD bodies stay out of scope, since manual row order and grouped order conflict. [Grouping Table](/examples/grouping-table/)
- **Composable feature groups** in `lib/data-table-features.ts` — `coreFeatures`, `filteringFeatures`, `sortingFeatures`, `expandingFeatures`, `groupingFeatures`, `paginationFeatures` and `selectionFeatures` are spread into `tableFeatures({ … })`, so the engine layer finally matches the registry's own rule: register only what you use. The file previously documented that principle while registering all fourteen features, eight row models and eleven aggregation functions. `features` is unchanged as the batteries-included default — trimming is now a one-line edit rather than picking imports apart. [Lib](/niko-table/overview/lib/)

- **`createDataTableColumnHelper`** — pre-bound TanStack Table v9 column helper in `lib/data-table-features.ts`. TanStack v9 docs recommend `createColumnHelper()` first for static columns (typed `getValue()` in cells) and shadcn/ui's v9 migration adopted the same idiom; the raw v9 helper needs the features generic hand-threaded (`createColumnHelper<DataTableFeatures, TData>()`), so this wraps it the same way the `DataTable*` type aliases pre-bind `DataTableFeatures`. Plain `DataTableColumnDef<TData>[]` arrays remain the default in examples — best for copy-paste and dynamic columns. [Lib](/niko-table/overview/lib/)
- **`data-table-ui` registry item** — ships `components/ui/table.tsx` alone (`TableComponent` + scroll container with `tabIndex={0}` for WCAG 2.1.1). `@niko-table/data-table` depends on it; `data-table-core` / à-la-carte controls do not, so a customized table is no longer overwritten when installing pagination/filters only. Part of [#180](https://github.com/Semkoo/niko-table-registry/issues/180).
- **`data-table-core` registry item** — shared floor (context, non-virtualized structure, types, config, and the lib/hooks bodies/controls need) split out of `data-table`. À-la-carte controls now depend on `data-table-core` instead of the full owner, so a server-driven install of pagination + search + faceted + clear + column-sort no longer pulls `DataTableRoot` / feature-detection / toolbar chrome. `@niko-table/data-table` still installs the full owner and depends on core. Closes [#180](https://github.com/Semkoo/niko-table-registry/issues/180).
- **Row grouping / aggregation** (`data-table-column-group`) — TanStack's grouped row model registered in `lib/data-table-features.ts` (opt into the bands by composing `DataTableGroupedRows`; the column menu and `config.enableGrouping` also turn the feature on). Column actions expose **Group by** / **Stop grouping by**; bodies render grouped / aggregated / placeholder cells with accessible expand controls. Supports nested groups, `aggregationFn` (e.g. `sum`), and `getGroupingValue` (e.g. group dates by month). [Grouping Table](/examples/grouping-table/) · closes [#173](https://github.com/Semkoo/niko-table-registry/issues/173)
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

- **`onReorder` reports the move** (`data-table-row-dnd`, `data-table-virtualized-row-dnd`) — the callback also receives `{ activeId, overId }` as a second argument. Existing `(data) => void` callbacks keep working.
- **Data Grid is now called Niko Grid** in the docs, sidebar, breadcrumbs and READMEs, to show it's the grid in Niko Table rather than a separate library. Registry item names (`data-table-grid`, `data-table-grid-changes`), code names (`DataGrid`, `useDataGrid`) and `/data-grid/` URLs are unchanged, so existing installs and links keep working.
- **Docs breadcrumbs** show where a page sits, and every step links: Docs › section › sub-section › page (e.g. Docs › Table Examples › Row & Column Features › Row Selection Table, Docs › Blocks › Customers Table). Sections come from the page's sidebar groups; each links to its first page, Table/Grid Examples link to their galleries, and example sub-groups jump to their section on the gallery. The BreadcrumbList JSON-LD now uses the same trail (`src/lib/breadcrumbs.ts`) instead of URL segments, which pointed at section URLs with no page.
- **TanStack Table v9** — the registry targets `@tanstack/react-table@^9` (`useTable` + shared `lib/data-table-features.ts`). v8 bundled every behavior into `useReactTable`; v9 imports only what you need — the same **Composable** principle as installing only the registry pieces you need, at the table-engine layer. For column authoring, `createDataTableColumnHelper<TData>()` pre-binds the features generic the same way `DataTableColumnDef<TData>` does. No live Table v8 docs track; existing copied installs stay on v8 until you upgrade the peer and re-add/migrate. See TanStack’s [React migrating guide](https://tanstack.com/table/latest/docs/framework/react/guide/migrating). Two clean breaks to know about: persisted v8 `columnPinning` state (localStorage, shared URLs, server prefs) uses the old `left`/`right` keys, which v9 ignores — pinning resets on first load after the upgrade (re-pin and re-save; there is no runtime migration). And dynamic facet counts now resolve each column's filter through `column.getFilterFn()` (the same callable the table filters with), so externally-built tables passed to `Table*` components may see option counts shift where v8 skipped unregistered built-in filter names. Closes [#177](https://github.com/Semkoo/niko-table-registry/issues/177).
- **Manual installation page loads each file on demand** — the component browser used to serialize every file's source and both Shiki themes into its island props, which pushed the built page to 25 MiB (past Cloudflare Pages' per-file limit, and past the ~15 MB Googlebot fetches). Source now comes from static per-file JSON endpoints (`/manual-install/<path>.json`) fetched on expand: the page ships at ~190 KB with the same collapse/copy UX. [Manual Installation](/getting-started/manual-installation/)
- **`enableGrouping` defaults to `false`** unless `DataTableColumnGroupOptions` / `Menu` is mounted or `config.enableGrouping` is set (previously defaulted `true` without wiring the grouped row model). Additive for apps that never grouped; set `config.enableGrouping: true` if you relied on the old default for column `getCanGroup()` without the new UI.
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

- **Docs: "Open in v0" button** on example previews. The Preview / Code switch is now a compact pill with icons instead of a full-width bar.
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

- **Pagination page-size select no longer clips its value** — the trigger was a fixed `w-16`, so `10` next to the chevron was cut off under some themes; it is now `w-auto min-w-16` in `filters/table-pagination.tsx`.
- **Docs list styles no longer leak into card grids** — the restored `ul`/`ol` bullets and padding excluded descendants of `.not-content` but not a list that carries the class itself, so the `/blocks/` grid was indented.
- **Missing registry dependencies** — `data-table-core` now lists `dropdown-menu`, `data-table` lists `tooltip`, and `data-table-column-slider-filter` lists `popover`. Before, a fresh install of these items lacked a component they import.
- **Right-click row menus on draggable rows** — `TableDraggableRow` and the virtualized `VirtualizedDraggableRow` dropped the props and ref a `ContextMenuTrigger` hands down, so `DataTableRowContextMenuSlot` / `renderRowContextMenu` never opened in `DataTableDndBody` or `DataTableVirtualizedDndBody`. Both rows now forward them (the DnD transform and transition still win over a passed `style`). Re-add `data-table-row-dnd` / `data-table-virtualized-row-dnd` to pick up the fix.
- **Default Vite projects now build** (`core/data-table-context`, `filters/table-filter-menu`, `filters/table-inline-filter`, `lib/filter-functions`) — a fresh `shadcn init -t vite` app runs `tsc -b` before `vite build`, and its tsconfig sets `erasableSyntaxOnly` and ships without `@types/node`. Installing the registry there gave 18 type errors, so `npm run build` failed: the `DataTableActions` enum is not erasable syntax, and the dev-only `process.env.NODE_ENV` checks had no `process` type. `DataTableActions` is now a `const` object with the same members, and each file declares the one `process.env.NODE_ENV` field it reads. Bundlers still inline `NODE_ENV`, so the dev warnings drop out of production builds as before. Verified by installing all 34 items into a fresh Base UI (`base-nova`) Vite app: 0 type errors, build passes.
- **Expanded rows no longer make Firefox scroll jump** (`core/data-table-virtualized-structure`, `core/data-table-virtualized-row-dnd-structure`, `core/data-table-virtualized-column-dnd-structure`, new `lib/measure-row-with-expansion`) — the virtualized bodies measured a row together with its open detail pane in every browser except Firefox, which fell back to TanStack Virtual's default and counted the row alone. The virtualizer lost every open pane's height, so when a pane left the rendered window the content jumped by that height, and with a pane taller than the viewport scrolling up pushed the list further down. All browsers now share one measurer that adds the pane's height, rounded to whole pixels like the library's own so sub-pixel rows cannot start a re-measure loop. The three bodies import it from `lib/` instead of each carrying a copy; `data-table-virtualized` ships the new file and both virtualized DnD items get it through that dependency.
- **Closed selects show their label on Base UI** (`filters/table-filter-menu`, `filters/table-inline-filter`, `filters/table-sort-menu`, `config/data-table`) — Base UI's `Select.Value` resolves the closed trigger's label only from the root's `items` prop and never reads the `SelectItem` children, so on a `base-nova` install the filter operator read `iLike` instead of "contains", the boolean filter read `true` instead of "True", and the sort direction read `asc` instead of "Asc" until opened. Radix reads the item text, which is why the Radix renders never showed it. Those selects now pass `items` — the operator list, a new `dataTableConfig.booleanValues` that the boolean items also render from, and the sort labels (`SortLabels` is now a `Record` so it is assignable as an items map). The prop is spread (`{...{ items }}`) rather than written as an attribute, so the one source still type-checks against Radix, which ignores it. The dual-generation guard now fails any select without a label source Base UI can read: it passes `items`, or every item renders exactly its own value, as the join-operator and page-size selects do.

- **CSV export no longer corrupts negative numbers** (`filters/table-export-button`) — formula neutralisation prefixed an apostrophe to anything opening with `=`, `+`, `-`, `@`, tab or carriage return. Treating every `-` as hostile is the common advice and it is wrong for tabular data: negative amounts are ordinary, so a fee column exported as `'-5.00` reads as visibly wrong and, worse, returns as text when the file is read back — silently corrupting a whole column on round trip. A leading `-` is now neutralised only when the value is not a number, so `-5.00` and `-1,234.56` pass through while `-2+3+cmd|'/c calc'!A1` is still escaped; `Number` rejects anything carrying an operator, so the carve-out costs nothing in safety. `escapeCsvValue` is exported so the encoding rules can be tested and reused.

- **Anchor variables resolve in both shadcn generations** (`filters/table-filter-menu`, `filters/table-sort-menu`, `filters/table-inline-filter`, `grid/cells/grid-combobox-cell`) — the popover and select positioners read `--radix-*` custom properties, which are correct for a `new-york` install and undefined for a `base-nova` one, where Base UI publishes `--anchor-width`, `--available-width` and `--transform-origin` instead. On Base UI the declarations resolved to nothing, so anchored widths fell back to intrinsic sizing and popovers animated from the wrong origin. All 21 occurrences now carry a CSS fallback — `var(--radix-popover-trigger-width,var(--anchor-width))` — which resolves to the Radix value where one exists and to the Base UI value where it does not, with no build step or codemod. The CLI's Base UI codemod rewrites component APIs, not custom-property names inside class strings, so this is the same category as the callback and `asChild` shims: dual-generation safety the source has to carry itself.

- **Drizzle examples — filter robustness** — comparison operators (`eq`/`neq`/`gt`/`gte`/`lt`/`lte`) now guard the incoming value against a scalar-shape check before handing it to the query builder, so a malformed advanced-menu filter value drops the condition instead of reaching the driver as a bad bound parameter. Applied to both Drizzle examples and the Drizzle ORM guide's `buildWhere`. Search and column filters are also now debounced together as a single atomic snapshot (rather than on separate clocks), so an advanced-menu change that writes both applies them to the same request instead of momentarily mixing a new filter with a stale one. [Drizzle ORM](/examples/drizzle-orm/) · [Drizzle ORM + Nuqs](/examples/drizzle-orm-nuqs/)
- **Same-column collapse no longer crosses a clause boundary** — `processFiltersForLogic` collapsed a column's equality filters by grouping across the whole list, so "brand=A AND category=C OR brand=B" merged the two brands into `brand IN (A, B)` even though a different-column filter sat between them. Under the mixed-filter precedence evaluator that turned `(A ∧ C) ∨ B` into `(A ∨ B) ∧ C` — a different result. Collapse now only merges a **contiguous** run of a column's filters (nothing from another column interleaved); interleaved same-column filters are left independent.
- **Advanced menu single-select kept its zero-count selection** — the menu's count-0 hide rule preserved a selected value only when `selectedValues` was an array (multi-select). A single-select filter holds a bare string, so a selected value narrowed to count 0 by another filter was hidden and could not be un-checked. The rule now handles both the array and string shapes.
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
