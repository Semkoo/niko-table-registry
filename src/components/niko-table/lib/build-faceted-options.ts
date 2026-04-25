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
 * Pure builder for the option list surfaced by a faceted filter. Handles
 * both explicit `staticOptions` (narrow + enrich with counts) and
 * row-derived options. Plain function (not a hook) so the wrapper can
 * gate it behind a single `useMemo`.
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

  // Scope counts to baseOptions values up-front so every returned option
  // has a count and every count maps to a returned option.
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
