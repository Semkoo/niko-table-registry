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
import { useDataTable } from "../core/data-table-context"
import {
  TableViewMenu,
  type TableViewMenuProps,
} from "../filters/table-view-menu"

type DataTableViewMenuProps<TData> = Omit<TableViewMenuProps<TData>, "table">

export function DataTableViewMenu<TData>(props: DataTableViewMenuProps<TData>) {
  const { table } = useDataTable<TData>()
  return <TableViewMenu table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableViewMenu.displayName = "DataTableViewMenu"
