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
  TableColumnGroupOptions,
  TableColumnGroupMenu,
} from "../filters/table-column-group"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Grouping options for column header menu using context.
 */
export function DataTableColumnGroupOptions<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnGroupOptions>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnGroupOptions column={column} {...props} />
}

DataTableColumnGroupOptions.displayName = "DataTableColumnGroupOptions"

/**
 * Standalone grouping menu for column header using context.
 */
export function DataTableColumnGroupMenu<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnGroupMenu>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnGroupMenu column={column} {...props} />
}

DataTableColumnGroupMenu.displayName = "DataTableColumnGroupMenu"
