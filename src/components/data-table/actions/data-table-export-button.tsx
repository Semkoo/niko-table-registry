"use client"

import { useDataTable } from "../core"
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
