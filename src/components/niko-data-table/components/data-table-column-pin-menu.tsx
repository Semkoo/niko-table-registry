"use client"

import React from "react"

import { TableColumnPinMenu } from "../filters/table-column-pin"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Standalone pinning menu for column header using context.
 */
export function DataTableColumnPinMenu<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnPinMenu>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnPinMenu column={column} {...props} />
}

DataTableColumnPinMenu.displayName = "DataTableColumnPinMenu"
