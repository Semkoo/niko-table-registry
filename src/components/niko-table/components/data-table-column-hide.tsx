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
