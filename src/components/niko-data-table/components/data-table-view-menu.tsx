"use client"

import { useDataTable } from "../core"
import {
  TableViewMenu,
  type TableViewMenuProps,
} from "../filters/table-view-menu"

type DataTableViewMenuProps<TData> = Omit<TableViewMenuProps<TData>, "table">

export function DataTableViewMenu<TData>(props: DataTableViewMenuProps<TData>) {
  const { table } = useDataTable<TData>()
  return <TableViewMenu table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableViewMenu.displayName = "DataTableViewMenu"
