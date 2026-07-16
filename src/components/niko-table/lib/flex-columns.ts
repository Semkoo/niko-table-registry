/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
import type { Column, ColumnSizingState, Table } from "@tanstack/react-table"

/**
 * Resolve which column(s) should flex to fill the leftover row width.
 *
 * Flex fill is ON BY DEFAULT for resizable tables. A flex column renders with
 * no explicit width, so under `table-layout: fixed` it soaks up the surplus:
 * the table fills its container and a trailing actions column pins to the right
 * edge instead of leaving dead space. It's pure layout — never writes
 * `columnSizing`, so no persistence side effects.
 *
 * Selection: when no column opts in explicitly, the DEFAULT is the first
 * non-pinned, resizable column (the primary text column). Selection / expand /
 * actions columns are non-resizable (`enableResizing: false`), so they're
 * skipped automatically; the default lands on the first real data column.
 *
 * Overrides:
 * - `meta: { flex: true }` on a column flexes THAT column instead of the
 *   default — use it when the primary column isn't the first one (e.g. a table
 *   whose first columns are narrow codes/dates and a later column should grow).
 * - `meta: { flex: false }` opts a column out of ever being auto-picked.
 * - `meta: { disableFlexFill: true }` on the table (TableMeta) turns fill off
 *   entirely — for a wide table meant to scroll horizontally rather than fill.
 *
 * Returns the set of column ids to render widthless (empty when fill is off or
 * no eligible column exists — the table then sizes to its columns as before).
 */
export function resolveFlexColumnIds<TData>(
  table: Table<TData>,
): ReadonlySet<string> {
  const ids = new Set<string>()
  // Flex only applies under the fixed layout that resizing turns on.
  if (!table.options.enableColumnResizing) return ids
  if (table.options.meta?.disableFlexFill) return ids

  const leafColumns = table.getVisibleLeafColumns()
  // A column the user has explicitly resized is fixed at their width and never
  // flexes — so dragging a flex column pins it and hands the fill to the next
  // eligible column, keeping the table full.
  const columnSizing = table.getState().columnSizing

  // Explicit opt-in wins: flex the marked column(s) unless the user resized it.
  let hasExplicit = false
  for (const column of leafColumns) {
    if (
      column.columnDef.meta?.flex === true &&
      columnSizing[column.id] == null
    ) {
      ids.add(column.id)
      hasExplicit = true
    }
  }
  if (hasExplicit) return ids

  // Default: the first non-pinned, resizable, un-resized, non-opted-out column.
  const auto = leafColumns.find(
    column =>
      column.getCanResize() &&
      !column.getIsPinned() &&
      column.columnDef.meta?.flex !== false &&
      columnSizing[column.id] == null,
  )
  if (auto) ids.add(auto.id)
  return ids
}

/**
 * The width to render for a single column. Centralizes the flex + header-fit
 * rules so the header, body cells, and the min-width lock all agree.
 *
 * - Off (no resizing): the declared `size` (or auto when unset).
 * - Flex column: no width — it fills the leftover row width.
 * - Resized by the user: exactly `getSize()` — their choice wins, even if it's
 *   narrower than the header (matches how spreadsheet grids let you shrink).
 * - Otherwise: floored at the header's natural width (`headerMinWidths`) so the
 *   label never truncates on load. Pure layout — `headerMinWidths` is measured,
 *   never written back into `columnSizing`, so nothing persists or goes stale.
 */
export function resolveColumnWidth<TData>(
  column: Column<TData>,
  params: {
    resizing: boolean
    isFlex: boolean
    columnSizing: ColumnSizingState
    headerMinWidths: ReadonlyMap<string, number>
  },
): number | string | undefined {
  const size = column.columnDef.size
  // Off (no resizing): the declared `size`. Flex only means "fill the surplus"
  // under the fixed layout that resizing turns on, so a flex column keeps its
  // declared size here — check resizing before flex.
  if (!params.resizing) return size ? `${size}px` : undefined
  if (params.isFlex) return undefined
  const base = column.getSize()
  if (params.columnSizing[column.id] != null) return base
  const headerMin = params.headerMinWidths.get(column.id) ?? 0
  return headerMin > base ? headerMin : base
}
