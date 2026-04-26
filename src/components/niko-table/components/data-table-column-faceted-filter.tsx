"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
import React from "react"
import type { Column } from "@tanstack/react-table"

import {
  TableColumnFacetedFilterOptions,
  TableColumnFacetedFilterMenu,
} from "../filters/table-column-faceted-filter"
import { useDataTable } from "../core/data-table-context"
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
