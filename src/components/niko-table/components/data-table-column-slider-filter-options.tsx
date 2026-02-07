"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"

import {
  TableColumnSliderFilterOptions,
  TableColumnSliderFilterMenu,
} from "../filters/table-column-slider-filter"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Slider filter options for composing inside DataTableColumnActions using context.
 */
export function DataTableColumnSliderFilterOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSliderFilterOptions>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnSliderFilterOptions must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnSliderFilterOptions column={column} {...props} />
}

DataTableColumnSliderFilterOptions.displayName =
  "DataTableColumnSliderFilterOptions"

/**
 * Standalone slider filter menu for column header using context.
 */
export function DataTableColumnSliderFilterMenu<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSliderFilterMenu>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnSliderFilterMenu must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnSliderFilterMenu column={column} {...props} />
}

DataTableColumnSliderFilterMenu.displayName = "DataTableColumnSliderFilterMenu"
