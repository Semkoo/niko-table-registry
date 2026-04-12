import type { Row, Table } from "@tanstack/react-table"

import { getFilteredRowsExcludingColumn } from "./filter-rows"
import { formatLabel } from "./format"
import type { Option } from "../types"

export interface BuildFacetedOptionsConfig {
  /**
   * If provided, these options are the source of truth and the returned list
   * is a subset of them (optionally narrowed by `limitToFilteredRows` and
   * enriched with live counts).
   *
   * If omitted, options are derived from the rows themselves — useful for
   * columns that are not declared as `select`/`multi_select` variants but are
   * still being used with a faceted filter (boolean, text, etc.).
   */
  staticOptions?: Option[]
  /**
   * Narrow the returned options to values that exist in rows passing every
   * *other* active filter (the current column's own filter is excluded).
   */
  limitToFilteredRows: boolean
  /**
   * Compute counts against filtered rows (again, excluding the current
   * column's filter) rather than against the full core row model.
   */
  dynamicCounts: boolean
  /**
   * When false, `count` is stripped from the output for a consistent shape.
   */
  showCounts: boolean
  /**
   * When deriving options from rows, run labels through `formatLabel` (title
   * case etc.). Ignored when `staticOptions` is provided — callers' labels
   * are always preserved as-is.
   */
  autoOptionsFormat: boolean
}

/**
 * Pure builder for the option list surfaced by a faceted filter.
 *
 * A faceted filter component produces enriched options in two distinct
 * scenarios:
 *
 *  1. The caller passed an explicit `options` array — we treat it as the
 *     source of truth, optionally narrow it to values present in the
 *     filtered dataset, and attach live counts.
 *  2. No static options were provided and the column is not a declared
 *     `select`/`multi_select` variant (so the meta-aware generator in
 *     `useGeneratedOptions` returns nothing). We derive options directly
 *     from the row data and attach counts.
 *
 * Both scenarios share the same row-walking, filtering, and counting logic —
 * this helper is the single implementation. The wrapper component just
 * decides which config to pass.
 *
 * This function is intentionally a plain function (not a hook) so it can be
 * called inside a single `useMemo` in the wrapper, making it trivial to gate
 * work behind the "is this path actually needed?" check.
 */
export function buildFacetedOptions<TData>(
  table: Table<TData>,
  coreRows: Row<TData>[],
  accessorKey: string,
  columnFilters: Array<{ id: string; value: unknown }>,
  globalFilter: unknown,
  config: BuildFacetedOptionsConfig,
): Option[] {
  const {
    staticOptions,
    limitToFilteredRows,
    dynamicCounts,
    showCounts,
    autoOptionsFormat,
  } = config

  // Fast path: explicit options, no narrowing, no counts — just normalize the
  // shape so every return path of this function looks the same to callers.
  if (staticOptions && !limitToFilteredRows && !showCounts) {
    return staticOptions.map(opt => ({ ...opt, count: undefined }))
  }

  // Only compute the filtered row subset if at least one flag actually needs
  // it. This avoids the cost of `getFilteredRowsExcludingColumn` when the
  // caller has opted out of both narrowing and dynamic counts.
  const needsFilteredRows = limitToFilteredRows || dynamicCounts
  const filteredRows = needsFilteredRows
    ? getFilteredRowsExcludingColumn(
        table,
        coreRows,
        accessorKey,
        columnFilters,
        globalFilter,
      )
    : coreRows

  const optionRows = limitToFilteredRows ? filteredRows : coreRows
  const countRows = dynamicCounts ? filteredRows : coreRows

  // Collect the set of values present in `optionRows`. Used for narrowing
  // static options and for producing the auto-derived option list.
  const availableValues = collectRowValues(optionRows, accessorKey)

  // Build the base option list (no counts yet).
  let baseOptions: Option[]
  if (staticOptions) {
    baseOptions = limitToFilteredRows
      ? staticOptions.filter(opt => availableValues.has(opt.value))
      : staticOptions
  } else {
    baseOptions = Array.from(availableValues)
      .map(value => ({
        value,
        label: autoOptionsFormat ? formatLabel(value) : value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  if (!showCounts) {
    return baseOptions.map(opt => ({ ...opt, count: undefined }))
  }

  // Count occurrences, scoped to the values that appear in `baseOptions`.
  // Scoping up-front (instead of counting everything and filtering later)
  // keeps the invariant: "every returned option has a count, and every
  // accumulated count maps to a returned option." This is the same scoping
  // used by the meta-aware generator in `useGeneratedOptions`.
  const targetValues = new Set(baseOptions.map(opt => opt.value))
  const valueCounts = new Map<string, number>()
  for (const row of countRows) {
    const raw = row.getValue(accessorKey) as unknown
    const values: unknown[] = Array.isArray(raw) ? raw : [raw]
    for (const v of values) {
      if (v == null) continue
      const str = String(v)
      if (!str) continue
      if (targetValues.has(str)) {
        valueCounts.set(str, (valueCounts.get(str) ?? 0) + 1)
      }
    }
  }

  return baseOptions.map(opt => ({
    ...opt,
    count: valueCounts.get(opt.value) ?? 0,
  }))
}

function collectRowValues<TData>(
  rows: Row<TData>[],
  accessorKey: string,
): Set<string> {
  const set = new Set<string>()
  for (const row of rows) {
    const raw = row.getValue(accessorKey) as unknown
    const values: unknown[] = Array.isArray(raw) ? raw : [raw]
    for (const v of values) {
      if (v == null) continue
      const str = String(v)
      if (str) set.add(str)
    }
  }
  return set
}
