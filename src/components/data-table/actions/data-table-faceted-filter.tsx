"use client"

import * as React from "react"
import type { Table, Row } from "@tanstack/react-table"
import {
  TableFacetedFilter,
  type TableFacetedFilterProps,
} from "../filters/table-faceted-filter"
import { useDataTable } from "../core"
import type { Option } from "../types"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"
import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { formatLabel } from "../lib/format"

/**
 * Get filtered rows excluding a specific column's filter.
 * This is useful when generating options for a column - we want to see
 * options that exist in the filtered dataset (from other filters) but
 * not be limited by the current column's own filter.
 */
function getFilteredRowsExcludingColumn<TData>(
  table: Table<TData>,
  excludeColumnId: string,
  columnFilters: Array<{ id: string; value: unknown }>,
  globalFilter: unknown,
): Row<TData>[] {
  // Filter out the current column's filter
  const otherFilters = columnFilters.filter(
    filter => filter.id !== excludeColumnId,
  )

  // Get all core rows
  const coreRows = table.getCoreRowModel().rows

  // If no filters to apply (excluding the current column), return core rows
  if (otherFilters.length === 0 && !globalFilter) {
    return coreRows
  }

  // Filter rows manually, excluding the current column's filter
  return coreRows.filter(row => {
    // Apply column filters (excluding the current column)
    for (const filter of otherFilters) {
      const column = table.getColumn(filter.id)
      if (!column) continue

      const filterValue = filter.value
      const filterFn = column.columnDef.filterFn || "extended"

      // Skip if filter function is a string (built-in) and we don't have access
      if (typeof filterFn === "string") {
        // Use the table's filterFns
        const fn = table.options.filterFns?.[filterFn]
        if (fn && typeof fn === "function") {
          if (!fn(row, filter.id, filterValue, () => {})) {
            return false
          }
        }
      } else if (typeof filterFn === "function") {
        if (!filterFn(row, filter.id, filterValue, () => {})) {
          return false
        }
      }
    }

    // Apply global filter if present
    if (globalFilter) {
      const globalFilterFn = table.options.globalFilterFn
      if (globalFilterFn && typeof globalFilterFn === "function") {
        if (!globalFilterFn(row, "global", globalFilter, () => {})) {
          return false
        }
      }
    }

    return true
  })
}

type DataTableFacetedFilterProps<TData, TValue> = Omit<
  TableFacetedFilterProps<TData, TValue>,
  "column" | "options"
> & {
  /**
   * The accessor key of the column to filter (matches column definition)
   */
  accessorKey: keyof TData & string
  /**
   * Optional title override (if not provided, will use column.meta.label)
   */
  title?: string
  /**
   * Static options (if provided, will be used instead of dynamic generation)
   */
  options?: Option[]
  /**
   * Whether to show counts for each option
   * @default true
   */
  showCounts?: boolean
  /**
   * Whether to update counts based on other active filters
   * @default true
   */
  dynamicCounts?: boolean
  /**
   * If true, only show options that exist in the currently filtered table rows.
   * If false, show all options from the entire dataset (useful for multi-select filters
   * where you want to see all possible options even if they're not in the current filtered results).
   * @default true
   */
  limitToFilteredRows?: boolean
}

/**
 * A faceted filter component that automatically connects to the DataTable context
 * and dynamically generates options with counts based on the filtered data.
 *
 * @example - Auto-detect options from data with dynamic counts
 * const columns: DataTableColumnDef[] = [{ accessorKey: "category", ..., meta: { label: "Category" } }, ...]
 * <DataTableFacetedFilter accessorKey="category" />
 *
 * @example - With static options
 * const categoryOptions: Option[] = [
 *   { label: "Electronics", value: "electronics" },
 *   { label: "Clothing", value: "clothing" },
 * ]
 * <DataTableFacetedFilter
 *   accessorKey="category"
 *   title="Category"
 *   options={categoryOptions}
 * />
 *
 * @example - With dynamic option generation and multiple selection
 * <DataTableFacetedFilter
 *   accessorKey="brand"
 *   title="Brand"
 *   multiple
 *   dynamicCounts
 * />
 *
 * @example - Without counts
 * <DataTableFacetedFilter
 *   accessorKey="status"
 *   showCounts={false}
 * />
 */
export function DataTableFacetedFilter<TData, TValue = unknown>({
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows = true,
  title,
  multiple,
  ...props
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey as string)

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  // Prefer shared generator that respects column meta (autoOptions, mergeStrategy, dynamicCounts, showCounts)
  // limitToFilteredRows controls whether to generate options from filtered rows (true) or all rows (false)
  const generatedFromMeta = useGeneratedOptionsForColumn(
    table,
    accessorKey as string,
    { showCounts, dynamicCounts, limitToFilteredRows },
  )

  // Get current filter state for reactivity
  const state = table.getState()
  const columnFilters = state.columnFilters
  const globalFilter = state.globalFilter

  // Fallback generator that works for any variant (text/boolean/etc.) to preserve
  // the original behavior of faceted filter for quick categorical filtering.
  const fallbackGenerated = React.useMemo((): Option[] => {
    if (!column) return []

    const meta = column.columnDef.meta
    const autoOptionsFormat = meta?.autoOptionsFormat ?? true

    // limitToFilteredRows controls whether to generate options from filtered rows (true) or all rows (false)
    // When generating options, we exclude the current column's filter so we see all options
    // that exist in the filtered dataset (from other filters)
    const rows = limitToFilteredRows
      ? getFilteredRowsExcludingColumn(
          table,
          accessorKey as string,
          columnFilters,
          globalFilter,
        )
      : table.getCoreRowModel().rows

    const valueCounts = new Map<string, number>()

    rows.forEach(row => {
      const raw = row.getValue(accessorKey as string) as unknown
      const values: unknown[] = Array.isArray(raw) ? raw : [raw]
      values.forEach(v => {
        if (v == null) return
        const s = String(v)
        if (!s) return
        valueCounts.set(s, (valueCounts.get(s) || 0) + 1)
      })
    })

    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        label: autoOptionsFormat ? formatLabel(value) : value,
        value,
        count: showCounts ? count : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [
    accessorKey,
    column,
    limitToFilteredRows,
    showCounts,
    table,
    columnFilters,
    globalFilter,
  ])

  // Final options selection priority: explicit props.options > meta-driven > fallback
  const dynamicOptions =
    options ??
    (generatedFromMeta.length ? generatedFromMeta : fallbackGenerated)

  // Early return if column not found
  if (!column) {
    console.warn(
      `Column with accessorKey "${accessorKey}" not found in table columns`,
    )
    return null
  }

  return (
    <TableFacetedFilter
      column={column}
      options={dynamicOptions}
      title={derivedTitle}
      multiple={multiple}
      {...props}
    />
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableFacetedFilter.displayName = "DataTableFacetedFilter"
