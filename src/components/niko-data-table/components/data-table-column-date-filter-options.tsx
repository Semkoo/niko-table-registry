"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"

import { TableColumnDateFilterOptions } from "../filters/table-column-date-filter"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Date filter options for composing inside DataTableColumnActions using context.
 */
export function DataTableColumnDateFilterOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnDateFilterOptions>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnDateFilterOptions must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnDateFilterOptions column={column} {...props} />
}

DataTableColumnDateFilterOptions.displayName =
  "DataTableColumnDateFilterOptions"
