"use client"

import React from "react"

import { TableColumnTitle } from "../filters/table-column-title"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Renders the column title using context.
 */
export function DataTableColumnTitle<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnTitle>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnTitle column={column} {...props} />
}

DataTableColumnTitle.displayName = "DataTableColumnTitle"
