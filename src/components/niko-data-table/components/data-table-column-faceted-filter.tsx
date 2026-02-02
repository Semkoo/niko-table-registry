"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"

import {
  TableColumnFacetedFilterOptions,
  TableColumnFacetedFilterMenu,
} from "../filters/table-column-faceted-filter"
import { useDataTable } from "../core"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Faceted filter options for composing inside DataTableColumnActions using context.
 */
export function DataTableColumnFacetedFilterOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnFacetedFilterOptions>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnFacetedFilterOptions must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnFacetedFilterOptions column={column} {...props} />
}

DataTableColumnFacetedFilterOptions.displayName =
  "DataTableColumnFacetedFilterOptions"

/**
 * Standalone faceted filter menu for column header using context.
 */
export function DataTableColumnFacetedFilterMenu<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnFacetedFilterMenu>,
    "column" | "table"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column
  const { table } = useDataTable<TData>()

  if (!column) {
    console.warn(
      "DataTableColumnFacetedFilterMenu must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return (
    <TableColumnFacetedFilterMenu column={column} table={table} {...props} />
  )
}

DataTableColumnFacetedFilterMenu.displayName =
  "DataTableColumnFacetedFilterMenu"
