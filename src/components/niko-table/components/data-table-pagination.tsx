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
