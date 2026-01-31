"use client"

import * as React from "react"
import type { Table, Row } from "@tanstack/react-table"
import {
  TableFacetedFilter,
  TableFacetedFilterContent,
  useTableFacetedFilter,
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

/**
 * Hook to generate options for faceted filter.
 * Refactored from DataTableFacetedFilter to be reusable.
 */
function useFacetedOptions<TData>({
  table,
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows = true,
}: {
  table: Table<TData>
  accessorKey: string
  options?: Option[]
  showCounts?: boolean
  dynamicCounts?: boolean
  limitToFilteredRows?: boolean
}) {
  const column = table.getColumn(accessorKey)

  // Prefer shared generator that respects column meta (autoOptions, mergeStrategy, dynamicCounts, showCounts)
  // limitToFilteredRows controls whether to generate options from filtered rows (true) or all rows (false)
  const generatedFromMeta = useGeneratedOptionsForColumn(table, accessorKey, {
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
  })

  // Get current filter state for reactivity
  const state = table.getState()
  const columnFilters = state.columnFilters
  const globalFilter = state.globalFilter

  // Fallback generator that works for any variant (text/boolean/etc.) to preserve
  // the original behavior of faceted filter for quick categorical filtering.
  const fallbackGenerated = React.useMemo((): Option[] => {
    if (!column) return []

    const meta = column.columnDef.meta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoOptionsFormat = (meta as any)?.autoOptionsFormat ?? true

    // limitToFilteredRows controls whether to generate options from filtered rows (true) or all rows (false)
    // When generating options, we exclude the current column's filter so we see all options
    // that exist in the filtered dataset (from other filters)
    const rows = limitToFilteredRows
      ? getFilteredRowsExcludingColumn(
          table,
          accessorKey,
          columnFilters,
          globalFilter,
        )
      : table.getCoreRowModel().rows

    const valueCounts = new Map<string, number>()

    rows.forEach(row => {
      const raw = row.getValue(accessorKey) as unknown
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
  const dynamicOptions = React.useMemo(() => {
    // If options are explicitly provided, we still need to respect limitToFilteredRows
    if (options && options.length > 0) {
      if (limitToFilteredRows && column) {
        // Filter options to only include those that exist in the relevant rows
        // We reuse fallbackGenerated's logic of getting occurrenceMap from rows
        const rows = getFilteredRowsExcludingColumn(
          table,
          accessorKey,
          columnFilters,
          globalFilter,
        )
        const occurrenceMap = new Map<string, boolean>()
        rows.forEach(row => {
          const raw = row.getValue(accessorKey) as unknown
          const values: unknown[] = Array.isArray(raw) ? raw : [raw]
          values.forEach(v => {
            if (v != null) occurrenceMap.set(String(v), true)
          })
        })
        return options.filter(opt => occurrenceMap.has(opt.value))
      }
      return options
    }

    return generatedFromMeta.length ? generatedFromMeta : fallbackGenerated
  }, [
    options,
    generatedFromMeta,
    fallbackGenerated,
    limitToFilteredRows,
    column,
    table,
    accessorKey,
    columnFilters,
    globalFilter,
  ])

  return dynamicOptions
}

export function DataTableFacetedFilter<TData, TValue = unknown>({
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows = true,
  title,
  multiple,
  trigger,
  ...props
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey as string)

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  const dynamicOptions = useFacetedOptions({
    table,
    accessorKey: accessorKey as string,
    options,
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
  })

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
      trigger={trigger}
      {...props}
    />
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableFacetedFilter.displayName = "DataTableFacetedFilter"

export function DataTableFacetedFilterContent<TData, TValue = unknown>({
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows = true,
  title,
  multiple,
  onValueChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey as string)
  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  const dynamicOptions = useFacetedOptions({
    table,
    accessorKey,
    options,
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
  })

  // Use the shared hook for filter logic
  const { selectedValues, onItemSelect, onReset } = useTableFacetedFilter({
    column,
    onValueChange,
    multiple,
  })

  if (!column) return null

  return (
    <TableFacetedFilterContent
      title={derivedTitle}
      options={dynamicOptions}
      selectedValues={selectedValues}
      onItemSelect={onItemSelect}
      onReset={onReset}
    />
  )
}

DataTableFacetedFilterContent.displayName = "DataTableFacetedFilterContent"
