"use client"

import { useDataTable } from "../core"
import {
  TableSortMenu,
  type TableSortMenuProps,
} from "../filters/table-sort-menu"

type DataTableSortMenuProps<TData> = Omit<TableSortMenuProps<TData>, "table">

/**
 * A sort menu component that automatically connects to the DataTable context
 * and allows users to manage multiple sorting criteria.
 *
 * @example - Basic usage with default settings
 * <DataTableSortMenu />
 *
 * @example - Custom alignment and positioning
 * <DataTableSortMenu align="end" side="bottom" />
 *
 * @example - With debounce for performance
 * <DataTableSortMenu debounceMs={300} />
 *
 * @example - With throttle for frequent updates
 * <DataTableSortMenu throttleMs={100} />
 *
 * @example - Custom styling
 * <DataTableSortMenu className="w-[400px]" />
 */
export function DataTableSortMenu<TData>(props: DataTableSortMenuProps<TData>) {
  const { table } = useDataTable<TData>()
  return <TableSortMenu<TData> table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableSortMenu.displayName = "DataTableSortMenu"
