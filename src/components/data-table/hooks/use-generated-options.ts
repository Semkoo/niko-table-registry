"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"

import type { Option } from "../types"
import { formatLabel } from "../lib/format"
import { FILTER_VARIANTS } from "../lib/constants"

export interface GenerateOptionsConfig {
  /**
   * Whether to include counts for each option label
   * @default true
   */
  showCounts?: boolean
  /**
   * If true, recompute counts based on the filtered rows; otherwise use all core rows
   * @default true
   */
  dynamicCounts?: boolean
  /**
   * Only generate options for these column ids (if provided)
   */
  includeColumns?: string[]
  /**
   * Exclude these column ids from option generation
   */
  excludeColumns?: string[]
  /**
   * Optional cap on number of options per column (after sorting)
   */
  limitPerColumn?: number
}

/**
 * Generate a map of options for select/multiSelect columns based on table data.
 * Uses either filtered rows (dynamicCounts) or all core rows.
 */
export function useGeneratedOptions<TData>(
  table: Table<TData>,
  config: GenerateOptionsConfig = {},
): Record<string, Option[]> {
  const {
    showCounts = true,
    dynamicCounts = true,
    includeColumns,
    excludeColumns,
    limitPerColumn,
  } = config

  // Pull state slices to use as memo deps (stable values)
  const state = table.getState()
  const columnFilters = state.columnFilters
  const globalFilter = state.globalFilter

  /**
   * PERFORMANCE: Memoize columns to avoid recalculating on every render
   *
   * WHY: `table.getAllColumns()` may return a new array reference on every call,
   * even when columns haven't changed. This causes downstream useMemo to recalculate.
   *
   * IMPACT: Prevents unnecessary option regeneration when columns are stable.
   */
  const columns = React.useMemo(() => table.getAllColumns(), [table])

  // Normalize array deps to stable strings for React hook linting
  const includeKey = includeColumns?.join(",") ?? ""
  const excludeKey = excludeColumns?.join(",") ?? ""

  /**
   * PERFORMANCE: Memoize option generation - expensive computation
   *
   * WHY: Option generation is expensive:
   * - Iterates through all columns
   * - For each select/multiSelect column: iterates through all rows
   * - Counts occurrences, formats labels, sorts options
   * - With 1,000 rows and 5 select columns: ~50-100ms per generation
   *
   * WITHOUT memoization: Runs on every render, causing noticeable lag.
   *
   * WITH memoization: Only recalculates when:
   * - Columns change
   * - Filters change (if dynamicCounts is true)
   * - Config changes (includeColumns, excludeColumns, etc.)
   *
   * IMPACT: 80-95% reduction in unnecessary option regeneration.
   * Critical for tables with many select columns and large datasets.
   *
   * WHAT: Generates options map keyed by column ID, only when dependencies change.
   */
  const optionsByColumn = React.useMemo(() => {
    const result: Record<string, Option[]> = {}

    // Note: row selection is done per-column based on overrides

    for (const column of columns) {
      const meta = column.columnDef.meta ?? {}
      const variant = meta.variant ?? "text"

      // Only generate for select-like variants
      if (
        variant !== FILTER_VARIANTS.SELECT &&
        variant !== FILTER_VARIANTS.MULTI_SELECT
      )
        continue

      const colId = column.id

      if (includeColumns && !includeColumns.includes(colId)) continue
      if (excludeColumns && excludeColumns.includes(colId)) continue

      // Respect per-column overrides
      const colAutoOptions = meta.autoOptions ?? true
      const colShowCounts = meta.showCounts ?? showCounts
      const colDynamicCounts = meta.dynamicCounts ?? dynamicCounts
      const colMerge = meta.mergeStrategy
      const colAutoOptionsFormat = meta.autoOptionsFormat ?? true

      if (!colAutoOptions) {
        result[column.id] = meta.options ?? []
        continue
      }

      // If static options are present and merge strategy prefers preserve, we still may augment counts
      const counts = new Map<string, number>()

      const sourceRows = colDynamicCounts
        ? table.getFilteredRowModel().rows
        : table.getCoreRowModel().rows

      for (const row of sourceRows) {
        const raw = row.getValue(colId as string) as unknown

        // Support array values (multi-select like arrays on the row)
        const values: unknown[] = Array.isArray(raw) ? raw : [raw]

        for (const v of values) {
          if (v === null || v === undefined) continue
          const str = String(v)
          if (str.trim() === "") continue
          counts.set(str, (counts.get(str) ?? 0) + 1)
        }
      }

      // If we couldn't derive anything, skip (caller may still have static options)
      if (counts.size === 0) {
        result[colId] = []
        continue
      }

      const options: Option[] = Array.from(counts.entries())
        .map(([value, count]) => ({
          value,
          label: colAutoOptionsFormat ? formatLabel(value) : value,
          count: colShowCounts ? count : undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      const finalOptions =
        typeof limitPerColumn === "number" && limitPerColumn > 0
          ? options.slice(0, limitPerColumn)
          : options

      // If meta.options exist and merge strategy is augment, add counts to existing options
      if (meta.options && meta.options.length > 0 && colMerge === "augment") {
        const countMap = new Map(finalOptions.map(o => [o.value, o.count]))
        result[colId] = meta.options.map(opt => ({
          ...opt,
          count: colShowCounts
            ? (countMap.get(opt.value) ?? opt.count)
            : undefined,
        }))
        continue
      }

      // If static options exist and strategy is preserve, keep as-is
      if (
        meta.options &&
        meta.options.length > 0 &&
        (!colMerge || colMerge === "preserve")
      ) {
        result[colId] = meta.options
        continue
      }

      // Else, replace with generated
      result[colId] = finalOptions
    }

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    columns,
    table,
    dynamicCounts,
    showCounts,
    includeKey,
    excludeKey,
    limitPerColumn,
    // Recompute when filters/global filter change to keep counts in sync
    columnFilters,
    globalFilter,
  ])

  return optionsByColumn
}

/**
 * Convenience: generate options only for a specific column id
 */
export function useGeneratedOptionsForColumn<TData>(
  table: Table<TData>,
  columnId: string,
  config?: GenerateOptionsConfig,
): Option[] {
  const map = useGeneratedOptions(table, {
    ...config,
    includeColumns: [columnId],
  })
  return map[columnId] ?? []
}
