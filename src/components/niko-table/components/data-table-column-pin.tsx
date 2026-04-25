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
