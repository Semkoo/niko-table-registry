"use client"

import React from "react"

import { TableColumnFilterTrigger } from "../filters/table-column-faceted-filter"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * A standard filter trigger button (Funnel icon) using context.
 */
export function DataTableColumnFilterTrigger<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnFilterTrigger>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnFilterTrigger column={column} {...props} />
}

DataTableColumnFilterTrigger.displayName = "DataTableColumnFilterTrigger"
