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
  TableExportButton,
  type TableExportButtonProps,
} from "../filters/table-export-button"

export type DataTableExportButtonProps<TData> = Omit<
  TableExportButtonProps<TData>,
  "table"
>

/**
 * Context-aware export button component that automatically gets the table from DataTableRoot context.
 * This is the recommended way to use the export button in most cases.
 *
 * @example
 * ```tsx
 * <DataTableRoot data={data} columns={columns}>
 *   <DataTableExportButton filename="products" />
 * </DataTableRoot>
 * ```
 */
export function DataTableExportButton<TData>({
  ...props
}: DataTableExportButtonProps<TData>) {
  const { table } = useDataTable<TData>()

  return <TableExportButton table={table} {...props} />
}

DataTableExportButton.displayName = "DataTableExportButton"
