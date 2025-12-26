"use client"

import { useDataTable } from "../core"
import {
  TablePagination,
  type TablePaginationProps,
} from "../filters/table-pagination"

type DataTablePaginationProps<TData> = Omit<
  TablePaginationProps<TData>,
  "table" | "isLoading"
> & {
  /**
   * Override the loading state from context
   */
  isLoading?: boolean
}

export function DataTablePagination<TData>({
  isLoading: externalLoading,
  ...props
}: DataTablePaginationProps<TData>) {
  const { table, isLoading: contextLoading } = useDataTable<TData>()

  // Use external loading if provided, otherwise use context loading
  const isLoading = externalLoading ?? contextLoading

  return <TablePagination table={table} isLoading={isLoading} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTablePagination.displayName = "DataTablePagination"
