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
