"use client"

import React from "react"

import {
  TableColumnPinOptions,
  TableColumnPinMenu,
} from "../filters/table-column-pin"
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
