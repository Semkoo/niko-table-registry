"use client"

import * as React from "react"
import {
  TableFacetedFilter,
  type TableFacetedFilterProps,
} from "../filters/table-faceted-filter"
import { useDataTable } from "../core"
import type { Option } from "../types"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"
import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { formatLabel } from "../lib/format"

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
  title,
  multiple,
  ...props
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey as string)

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  // Prefer shared generator that respects column meta (autoOptions, mergeStrategy, dynamicCounts, showCounts)
  const generatedFromMeta = useGeneratedOptionsForColumn(
    table,
    accessorKey as string,
    { showCounts, dynamicCounts },
  )

  // Fallback generator that works for any variant (text/boolean/etc.) to preserve
  // the original behavior of faceted filter for quick categorical filtering.
  const fallbackGenerated = React.useMemo((): Option[] => {
    if (!column) return []

    const rows = dynamicCounts
      ? table.getFilteredRowModel().rows
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
        label: formatLabel(value),
        value,
        count: showCounts ? count : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [accessorKey, column, dynamicCounts, showCounts, table])

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
