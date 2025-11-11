"use client"

import { useDataTable } from "../core"
import type { TableDateFilterProps } from "../filters/table-date-filter"
import { TableDateFilter } from "../filters/table-date-filter"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"

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
  ...props
}: DataTableDateFilterProps<TData>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(String(accessorKey))

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  // Early return if column not found
  if (!column) {
    console.warn(
      `Column with accessorKey "${accessorKey}" not found in table columns`,
    )
    return null
  }

  return <TableDateFilter column={column} title={derivedTitle} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableDateFilter.displayName = "DataTableDateFilter"
