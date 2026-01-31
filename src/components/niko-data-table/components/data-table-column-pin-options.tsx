"use client"

import React from "react"

import { TableColumnPinOptions } from "../filters/table-column-pin"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Pinning options for column header menu using context.
 */
export function DataTableColumnPinOptions<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnPinOptions>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnPinOptions column={column} {...props} />
}

DataTableColumnPinOptions.displayName = "DataTableColumnPinOptions"
