"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useDataTable } from "./data-table-context"
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { flexRender } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableEmptyState } from "../components/data-table-empty-state"

// ============================================================================
// ScrollEvent Type
// ============================================================================

export interface ScrollEvent {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  isTop: boolean
  isBottom: boolean
  percentage: number
}

// ============================================================================
// DataTableHeader
// ============================================================================

export interface DataTableHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

export function DataTableHeader({
  className,
  sticky = true,
}: DataTableHeaderProps) {
  const { table } = useDataTable()

  const headerGroups = table?.getHeaderGroups() ?? []

  if (headerGroups.length === 0) {
    return null
  }

  return (
    <TableHeader
      className={cn(
        sticky && "sticky top-0 z-10 bg-background",
        // Ensure border is visible when sticky using pseudo-element
        sticky &&
          "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
        className,
      )}
    >
      {table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const hasSize = header.column.columnDef.size !== undefined
            return (
              <TableHead
                key={header.id}
                style={hasSize ? { width: header.getSize() } : undefined}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}

DataTableHeader.displayName = "DataTableHeader"

// ============================================================================
// DataTableBody
// ============================================================================

export interface DataTableBodyProps<TData> {
  children?: React.ReactNode
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  onRowClick?: (row: TData) => void
}

export function DataTableBody<TData>({
  children,
  className,
  onScroll,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
  onRowClick,
}: DataTableBodyProps<TData>) {
  const { table, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()
  const containerRef = React.useRef<HTMLTableSectionElement>(null)

  // Scroll handler
  React.useEffect(() => {
    const container = containerRef.current?.closest(
      '[data-slot="table-container"]',
    ) as HTMLDivElement
    if (!container || !onScroll) return

    const handleScroll = (event: Event) => {
      const element = event.currentTarget as HTMLDivElement
      const { scrollHeight, scrollTop, clientHeight } = element

      const isTop = scrollTop === 0
      const isBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold
      const percentage =
        scrollHeight - clientHeight > 0
          ? (scrollTop / (scrollHeight - clientHeight)) * 100
          : 0

      onScroll({
        scrollTop,
        scrollHeight,
        clientHeight,
        isTop,
        isBottom,
        percentage,
      })

      if (isTop) onScrolledTop?.()
      if (isBottom) onScrolledBottom?.()
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [onScroll, onScrolledTop, onScrolledBottom, scrollThreshold])

  return (
    <TableBody ref={containerRef} className={className}>
      {/* Only show rows when not loading */}
      {!isLoading && rows?.length
        ? rows.map(row => {
            const isClickable = !!onRowClick
            const isExpanded = row.getIsExpanded()

            // Find if any column has expandedContent meta
            const expandColumn = row
              .getAllCells()
              .find(cell => cell.column.columnDef.meta?.expandedContent)

            return (
              <React.Fragment key={row.id}>
                <TableRow
                  data-row-index={row?.index}
                  data-row-id={row?.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={event => {
                    // Check if the click originated from an interactive element
                    const target = event.target as HTMLElement
                    const isInteractiveElement =
                      // Check for buttons, inputs, links
                      target.closest("button") ||
                      target.closest("input") ||
                      target.closest("a") ||
                      // Check for elements with interactive roles
                      target.closest('[role="button"]') ||
                      target.closest('[role="checkbox"]') ||
                      // Check for Radix UI components
                      target.closest("[data-radix-collection-item]") ||
                      // Check for checkbox (Radix checkbox uses button with data-slot="checkbox")
                      target.closest('[data-slot="checkbox"]') ||
                      // Direct tag checks
                      target.tagName === "INPUT" ||
                      target.tagName === "BUTTON" ||
                      target.tagName === "A"

                    // Only call onRowClick if not clicking on an interactive element
                    if (!isInteractiveElement) {
                      onRowClick?.(row.original)
                    }
                  }}
                  className={cn(isClickable && "cursor-pointer")}
                >
                  {row.getVisibleCells().map(cell => {
                    const hasSize = cell.column.columnDef.size !== undefined
                    return (
                      <TableCell
                        key={cell.id}
                        style={
                          hasSize ? { width: cell.column.getSize() } : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>

                {/* Expanded content row */}
                {isExpanded && expandColumn && (
                  <TableRow>
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      className="p-0"
                    >
                      {expandColumn.column.columnDef.meta?.expandedContent?.(
                        row.original,
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })
        : null}

      {children}
    </TableBody>
  )
}

DataTableBody.displayName = "DataTableBody"

// ============================================================================
// DataTableEmptyBody
// ============================================================================

export interface DataTableEmptyBodyProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Empty state component for data tables.
 * Use composition pattern with DataTableEmpty* components for full customization.
 *
 * @example
 * <DataTableEmptyBody>
 *   <DataTableEmptyIcon>
 *     <PackageOpen className="size-12" />
 *   </DataTableEmptyIcon>
 *   <DataTableEmptyMessage>
 *     <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
 *     <DataTableEmptyDescription>
 *       Get started by adding your first product
 *     </DataTableEmptyDescription>
 *   </DataTableEmptyMessage>
 *   <DataTableEmptyFilteredMessage>
 *     No matches found
 *   </DataTableEmptyFilteredMessage>
 *   <DataTableEmptyActions>
 *     <Button onClick={handleAdd}>Add Product</Button>
 *   </DataTableEmptyActions>
 * </DataTableEmptyBody>
 */
export function DataTableEmptyBody({
  children,
  colSpan,
  className,
}: DataTableEmptyBodyProps) {
  const { table, columns, isLoading } = useDataTable()
  const { rows } = table.getRowModel()

  // Check if user is filtering or searching
  const globalFilter = table.getState().globalFilter
  const columnFilters = table.getState().columnFilters
  const isFiltered =
    (globalFilter && globalFilter.length > 0) ||
    (columnFilters && columnFilters.length > 0)

  // Don't show empty state when loading or when there are rows
  if (isLoading || rows.length > 0) return null

  return (
    <TableRow>
      <TableCell colSpan={colSpan ?? columns.length} className={className}>
        <DataTableEmptyState isFiltered={isFiltered}>
          {children}
        </DataTableEmptyState>
      </TableCell>
    </TableRow>
  )
}

DataTableEmptyBody.displayName = "DataTableEmptyBody"

// ============================================================================
// DataTableSkeleton
// ============================================================================

export interface DataTableSkeletonProps {
  children?: React.ReactNode
  colSpan?: number
  /**
   * Number of skeleton rows to display.
   * @default 5
   * @recommendation Set this to match your page size for better UX (e.g., if page size is 10, set rows={10})
   */
  rows?: number
  className?: string
  cellClassName?: string
  skeletonClassName?: string
}

export function DataTableSkeleton({
  children,
  colSpan,
  rows = 5,
  className,
  cellClassName,
  skeletonClassName,
}: DataTableSkeletonProps) {
  const { columns, isLoading } = useDataTable()

  // Show skeleton only when loading
  if (!isLoading) return null

  const numColumns = colSpan ?? columns.length

  // If custom children provided, show single row with custom content
  if (children) {
    return (
      <TableRow>
        <TableCell
          colSpan={numColumns}
          className={cn("h-24 text-center", className)}
        >
          {children}
        </TableCell>
      </TableRow>
    )
  }

  // Show skeleton rows that mimic the table structure
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: numColumns }).map((_, colIndex) => (
            <TableCell key={colIndex} className={cellClassName}>
              <Skeleton className={cn("h-4 w-full", skeletonClassName)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

DataTableSkeleton.displayName = "DataTableSkeleton"

// ============================================================================
// DataTableLoading
// ============================================================================

export interface DataTableLoadingProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

export function DataTableLoading({
  children,
  colSpan,
  className,
}: DataTableLoadingProps) {
  const { columns } = useDataTable()

  return (
    <TableRow>
      <TableCell
        colSpan={colSpan ?? columns.length}
        className={className ?? "h-24 text-center"}
      >
        {children ?? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

DataTableLoading.displayName = "DataTableLoading"
