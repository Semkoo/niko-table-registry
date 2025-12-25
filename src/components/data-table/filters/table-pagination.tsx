"use client"
import React from "react"
import { type Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface TablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
  defaultPageSize?: number
  /**
   * External loading state (e.g., from API)
   */
  isLoading?: boolean
  /**
   * External fetching state (e.g., from TanStack Query).
   * Used for displaying loading indicators, but doesn't disable pagination by default.
   */
  isFetching?: boolean
  /**
   * Explicitly disable the next page button.
   * Useful when you want to prevent navigation during initial load but allow it during background fetching.
   */
  disableNextPage?: boolean
  /**
   * Explicitly disable the previous page button.
   * Useful when you want to prevent navigation during initial load but allow it during background fetching.
   */
  disablePreviousPage?: boolean
  /**
   * Total count of items from server (for server-side pagination).
   * If provided, this will be used instead of table.getFilteredRowModel().rows.length
   */
  totalCount?: number
  onPageSizeChange?: (pageSize: number, pageIndex: number) => void
  onPageChange?: (pageIndex: number) => void
  onNextPage?: (pageIndex: number) => void
  onPreviousPage?: (pageIndex: number) => void
  /**
   * Callback when pagination initialization is complete
   */
  onPaginationReady?: () => void
}
export function TablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = pageSizeOptions[0],
  isLoading,
  isFetching,
  disableNextPage,
  disablePreviousPage,
  totalCount,
  onPageSizeChange,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onPaginationReady,
}: TablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination

  // Use totalCount if provided (server-side), otherwise use filtered row model (client-side)
  const totalRows = totalCount ?? table.getFilteredRowModel().rows.length
  const startItem = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalRows)
  const totalPages = table.getPageCount()
  const currentPage = pageIndex + 1

  // Determine if buttons should be disabled
  // Default to isLoading for initial load, but allow explicit overrides
  // Also disable during fetching to prevent navigation while data is loading
  const canNextPage = table.getCanNextPage()
  const isDisabled = isLoading || isFetching
  const canGoNext = !disableNextPage && !isDisabled && canNextPage
  const canGoPrevious =
    !disablePreviousPage && !isDisabled && table.getCanPreviousPage()

  // Set default page size on initial render
  React.useEffect(() => {
    if (pageSize !== defaultPageSize) {
      table.setPageSize(defaultPageSize)
    }
    onPaginationReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading skeleton while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>

        <Skeleton className="h-8 w-32" />

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-20" />
          </div>

          <div className="flex items-center space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <nav
      className="flex items-center justify-between px-4 py-2"
      aria-label="Table pagination"
    >
      <div className="flex items-center space-x-2">
        <span
          className="text-sm text-muted-foreground"
          id="pagination-page-size-label"
        >
          Items per page
        </span>
        <Select
          value={`${Number(pageSize) === 0 ? defaultPageSize : Number(pageSize)}`}
          onValueChange={value => {
            const newPageSize = Number(value)
            table.setPageSize(newPageSize)
            onPageSizeChange?.(newPageSize, pageIndex)
          }}
          disabled={isLoading}
        >
          <SelectTrigger
            className="h-8 w-16 focus:ring-0"
            aria-label="Select page size"
            aria-labelledby="pagination-page-size-label"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions?.map(size => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {totalRows === 0
          ? "0 items"
          : `${startItem}-${endItem} of ${totalRows} items`}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <label htmlFor="page-number-input" className="sr-only">
            Page number
          </label>
          <Input
            id="page-number-input"
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={e => {
              const page = Number(e.target.value)
              if (page >= 1 && page <= totalPages) {
                const newPageIndex = page - 1
                table.setPageIndex(newPageIndex)
                onPageChange?.(newPageIndex)
              }
            }}
            onBlur={e => {
              const page = Number(e.target.value)
              if (isNaN(page) || page < 1 || page > totalPages) {
                if (e.currentTarget) {
                  e.currentTarget.value = currentPage.toString()
                }
              }
            }}
            className="h-8 min-w-12 text-center"
            style={{
              width: `${Math.max(String(totalPages).length, 2) + 1}ch`,
            }}
            disabled={totalPages === 0 || isLoading || isFetching}
            aria-label={`Page ${currentPage} of ${totalPages}`}
          />
          <span aria-hidden="true">of {Math.max(1, totalPages)} pages</span>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              const newPageIndex = pageIndex - 1
              table.previousPage()
              onPreviousPage?.(newPageIndex)
            }}
            disabled={!canGoPrevious}
            aria-label={`Go to previous page, page ${pageIndex}`}
            title="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              const newPageIndex = pageIndex + 1
              table.nextPage()
              onNextPage?.(newPageIndex)
            }}
            disabled={!canGoNext}
            aria-label={`Go to next page, page ${pageIndex + 2}`}
            title="Go to next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TablePagination.displayName = "TablePagination"
