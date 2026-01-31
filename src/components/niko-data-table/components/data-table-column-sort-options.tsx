"use client"

import React from "react"

import { TableColumnSortOptions } from "../filters/table-column-sort"
import { useDataTable } from "../core"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Sorting options for column header menu using context.
 */
export function DataTableColumnSortOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortOptions>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortOptions column={column} table={table} {...props} />
}

DataTableColumnSortOptions.displayName = "DataTableColumnSortOptions"
