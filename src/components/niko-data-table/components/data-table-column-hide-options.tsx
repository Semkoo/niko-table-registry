"use client"

import React from "react"

import { TableColumnHideOptions } from "../filters/table-column-hide"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Hide options for column header menu using context.
 */
export function DataTableColumnHideOptions<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnHideOptions>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnHideOptions column={column} {...props} />
}

DataTableColumnHideOptions.displayName = "DataTableColumnHideOptions"
