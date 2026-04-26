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

import {
  TableColumnSortOptions,
  TableColumnSortMenu,
} from "../filters/table-column-sort"
import { useDataTable } from "../core/data-table-context"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Sorting options for column header menu using context.
 */
export function DataTableColumnSortOptions<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortOptions>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortOptions column={column} table={table} {...props} />
}

DataTableColumnSortOptions.displayName = "DataTableColumnSortOptions"

/**
 * Sorting menu for column header using context.
 *
 * Standalone button variant for inline use outside dropdown menus.
 */
export function DataTableColumnSortMenu<TData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortMenu>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortMenu column={column} table={table} {...props} />
}

DataTableColumnSortMenu.displayName = "DataTableColumnSortMenu"
