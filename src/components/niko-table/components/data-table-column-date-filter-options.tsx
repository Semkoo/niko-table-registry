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
  TableColumnDateFilterOptions,
  TableColumnDateFilterMenu,
} from "../filters/table-column-date-filter"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Date filter options for composing inside DataTableColumnActions using context.
 */
export function DataTableColumnDateFilterOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnDateFilterOptions>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnDateFilterOptions must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnDateFilterOptions column={column} {...props} />
}

DataTableColumnDateFilterOptions.displayName =
  "DataTableColumnDateFilterOptions"

/**
 * Standalone date filter menu for column header using context.
 */
export function DataTableColumnDateFilterMenu<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnDateFilterMenu>,
    "column"
  > & {
    column?: Column<TData, TValue>
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)
  const column = props.column || context?.column

  if (!column) {
    console.warn(
      "DataTableColumnDateFilterMenu must be used within DataTableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return <TableColumnDateFilterMenu column={column} {...props} />
}

DataTableColumnDateFilterMenu.displayName = "DataTableColumnDateFilterMenu"
