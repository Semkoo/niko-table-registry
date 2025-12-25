"use client"

import * as React from "react"
import { useDataTable } from "../core"
import type { TableDateFilterProps } from "../filters/table-date-filter"
import { TableDateFilter } from "../filters/table-date-filter"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"
import { FILTER_VARIANTS } from "../lib/constants"

type DataTableDateFilterProps<TData> = Omit<
  TableDateFilterProps<TData>,
  "column" | "title"
> & {
  /**
   * The accessor key of the column to filter (matches column definition)
   */
  accessorKey: keyof TData & string
  /**
   * Optional title override (if not provided, will use column.meta.label)
   */
  title?: string
}

/**
 * A date filter component that automatically connects to the DataTable context
 * and derives the title from column metadata.
 *
 * @example - Auto-detect everything from column metadata
 * const columns: DataTableColumnDef[] = [{ accessorKey: "releaseDate",..., meta: { label: "Release Date" } },...]
 * <DataTableDateFilter accessorKey="releaseDate" />
 *
 * @example - Date range filter
 * <DataTableDateFilter
 *   accessorKey="releaseDate"
 *   multiple
 * />
 *
 * @example - Custom title
 * <DataTableDateFilter
 *   accessorKey="createdAt"
 *   title="Created Date"
 * />
 *
 * @example - Single date selection
 * <DataTableDateFilter
 *   accessorKey="dueDate"
 *   title="Due Date"
 *   multiple={false}
 * />
 */

export function DataTableDateFilter<TData>({
  accessorKey,
  title,
  multiple,
  ...props
}: DataTableDateFilterProps<TData>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(String(accessorKey))

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  // Auto-set variant in column meta if not already set
  // This allows the auto-filterFn to be applied based on variant
  React.useMemo(() => {
    if (!column) return
    const meta = (column.columnDef.meta ||= {})
    // Only set variant if not already set (respects manual configuration)
    if (!meta.variant) {
      meta.variant = multiple
        ? FILTER_VARIANTS.DATE_RANGE
        : FILTER_VARIANTS.DATE
    }
  }, [column, multiple])

  // Early return if column not found
  if (!column) {
    console.warn(
      `Column with accessorKey "${accessorKey}" not found in table columns`,
    )
    return null
  }

  return (
    <TableDateFilter
      column={column}
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

DataTableDateFilter.displayName = "DataTableDateFilter"
