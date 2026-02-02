"use client"

import React from "react"

import {
  TableColumnHideOptions,
  TableColumnHideMenu,
} from "../filters/table-column-hide"
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
