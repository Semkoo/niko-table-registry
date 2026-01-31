"use client"

import React from "react"

import { TableColumnHideMenu } from "../filters/table-column-hide"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Standalone hide menu for column header using context.
 */
export function DataTableColumnHideMenu<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnHideMenu>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnHideMenu column={column} {...props} />
}

DataTableColumnHideMenu.displayName = "DataTableColumnHideMenu"
