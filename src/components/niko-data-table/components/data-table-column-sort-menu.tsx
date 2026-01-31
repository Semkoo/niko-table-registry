"use client"

import React from "react"

import { TableColumnSortMenu } from "../filters/table-column-sort"
import { useDataTable } from "../core"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Sorting menu for column header using context.
 *
 * Standalone button variant for inline use outside dropdown menus.
 */
export function DataTableColumnSortMenu<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortMenu>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortMenu column={column} table={table} {...props} />
}

DataTableColumnSortMenu.displayName = "DataTableColumnSortMenu"
