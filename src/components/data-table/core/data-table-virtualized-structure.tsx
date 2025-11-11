"use client"

import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useDataTable } from "./data-table-context"
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
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
// DataTableVirtualizedHeader
// ============================================================================

export interface DataTableVirtualizedHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

export function DataTableVirtualizedHeader({
  className,
  sticky = true,
}: DataTableVirtualizedHeaderProps) {
  const { table } = useDataTable()

  const headerGroups = table?.getHeaderGroups() ?? []

  if (headerGroups.length === 0) {
    return null
  }

  return (
    <TableHeader
      className={cn(
        "block",
        sticky && "sticky top-0 z-10 bg-background",
        className,
      )}
    >
      {table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id} className="flex w-full border-b">
          {headerGroup.headers.map(header => {
            const hasSize = header.column.columnDef.size !== undefined
            return (
              <TableHead
                key={header.id}
                className="flex items-center"
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

DataTableVirtualizedHeader.displayName = "DataTableVirtualizedHeader"

// ============================================================================
// DataTableVirtualizedBody
// ============================================================================

export interface DataTableVirtualizedBodyProps<TData> {
  children?: React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  onRowClick?: (
    row: TData,
    event: React.MouseEvent<HTMLTableRowElement>,
  ) => void
}

export function DataTableVirtualizedBody<TData>({
  children,
  estimateSize = 34,
  overscan = 20,
  className,
  onScroll,
  onRowClick,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
}: DataTableVirtualizedBodyProps<TData>) {
  const { table } = useDataTable()
  const { rows } = table.getRowModel()
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)

  const parentRef = React.useCallback(
    (node: HTMLTableSectionElement | null) => {
      if (node !== null) {
        const container = node.closest(
          '[data-slot="table-container"]',
        ) as HTMLDivElement | null
        setScrollElement(container)
      }
    },
    [],
  )

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
  })

  React.useEffect(() => {
    if (!scrollElement || !onScroll) return

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

    scrollElement.addEventListener("scroll", handleScroll)
    return () => scrollElement.removeEventListener("scroll", handleScroll)
  }, [
    scrollElement,
    onScroll,
    onScrolledTop,
    onScrolledBottom,
    scrollThreshold,
  ])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const hasVirtualItems = virtualItems.length > 0

  // Calculate spacer heights for virtual scrolling
  const topSpacerHeight = hasVirtualItems ? virtualItems[0].start : 0
  const lastItem = hasVirtualItems
    ? virtualItems[virtualItems.length - 1]
    : null
  const bottomSpacerHeight = lastItem
    ? rowVirtualizer.getTotalSize() - lastItem.end
    : 0

  return (
    <TableBody ref={parentRef} className={cn("block", className)}>
      {/* Top spacer for virtual scrolling offset */}
      {topSpacerHeight > 0 && (
        <TableRow
          style={{ height: `${topSpacerHeight}px`, display: "block" }}
        />
      )}

      {/* Render visible rows */}
      {virtualItems.map(virtualRow => {
        const row = rows[virtualRow.index]
        const isClickable = !!onRowClick
        const isExpanded = row.getIsExpanded()

        // Find column with expandedContent meta
        const expandColumn = row
          .getAllCells()
          .find(cell => cell.column.columnDef.meta?.expandedContent)

        return (
          <React.Fragment key={`${row.id}-${isExpanded}`}>
            {/* Main data row */}
            <TableRow
              ref={node => {
                // Measure element for dynamic height when expanded/collapsed
                if (node) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  rowVirtualizer.measureElement(node as any)
                }
              }}
              data-index={virtualRow.index}
              data-row-index={row?.index}
              data-row-id={row?.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={event => {
                if (onRowClick) {
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
                    onRowClick(
                      row.original as TData,
                      event as React.MouseEvent<HTMLTableRowElement>,
                    )
                  }
                }
              }}
              className={cn("flex w-full", isClickable && "cursor-pointer")}
            >
              {row.getVisibleCells().map(cell => {
                const hasSize = cell.column.columnDef.size !== undefined
                return (
                  <TableCell
                    key={cell.id}
                    className="flex items-center"
                    style={{
                      ...(hasSize ? { width: cell.column.getSize() } : {}),
                      minHeight: `${estimateSize}px`,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Expanded content row */}
            {isExpanded && expandColumn && (
              <TableRow className="flex w-full">
                <TableCell
                  colSpan={row.getVisibleCells().length}
                  className="w-full p-0"
                >
                  {expandColumn.column.columnDef.meta?.expandedContent?.(
                    row.original,
                  )}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )
      })}

      {/* Bottom spacer for remaining virtual height */}
      {bottomSpacerHeight > 0 && (
        <TableRow
          style={{ height: `${bottomSpacerHeight}px`, display: "block" }}
        />
      )}

      {/* Empty state and other children */}
      {children}
    </TableBody>
  )
}

DataTableVirtualizedBody.displayName = "DataTableVirtualizedBody"

// ============================================================================
// DataTableVirtualizedEmptyBody
// ============================================================================

export interface DataTableVirtualizedEmptyBodyProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Empty state component specifically for virtualized tables.
 * Uses flex layout to properly center content in virtualized table bodies.
 * Use composition pattern with DataTableEmpty* components for full customization.
 *
 * @example
 * <DataTableVirtualizedEmptyBody>
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
 * </DataTableVirtualizedEmptyBody>
 */
export function DataTableVirtualizedEmptyBody({
  children,
  colSpan,
  className,
}: DataTableVirtualizedEmptyBodyProps) {
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
    <TableRow className="flex w-full">
      <TableCell
        colSpan={colSpan ?? columns.length}
        className={cn("flex w-full items-center justify-center", className)}
      >
        <DataTableEmptyState isFiltered={isFiltered}>
          {children}
        </DataTableEmptyState>
      </TableCell>
    </TableRow>
  )
}

DataTableVirtualizedEmptyBody.displayName = "DataTableVirtualizedEmptyBody"

// ============================================================================
// DataTableVirtualizedSkeleton
// ============================================================================

export interface DataTableVirtualizedSkeletonProps {
  children?: React.ReactNode
  /**
   * Number of skeleton rows to display.
   * @default 5
   * @recommendation Set this to match your visible viewport for better UX
   */
  rows?: number
  /**
   * Estimated row height (should match estimateSize prop of DataTableVirtualizedBody).
   * @default 34
   */
  estimateSize?: number
  className?: string
  cellClassName?: string
  skeletonClassName?: string
}

export function DataTableVirtualizedSkeleton({
  children,
  rows = 5,
  estimateSize = 34,
  className,
  cellClassName,
  skeletonClassName,
}: DataTableVirtualizedSkeletonProps) {
  const { table, isLoading } = useDataTable()

  // Show skeleton only when loading
  if (!isLoading) return null

  // Get visible columns from table
  const visibleColumns = table.getVisibleLeafColumns()

  // If custom children provided, show single row with custom content
  if (children) {
    return (
      <TableRow className="flex w-full">
        <TableCell
          colSpan={visibleColumns.length}
          className={cn(
            "flex h-24 w-full items-center justify-center",
            className,
          )}
        >
          {children}
        </TableCell>
      </TableRow>
    )
  }

  // Show skeleton rows that mimic the virtualized table structure
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="flex w-full">
          {visibleColumns.map((column, colIndex) => {
            const hasSize = column.columnDef.size !== undefined
            return (
              <TableCell
                key={colIndex}
                className={cn("flex items-center", cellClassName)}
                style={{
                  ...(hasSize ? { width: column.getSize() } : {}),
                  minHeight: `${estimateSize}px`,
                }}
              >
                <Skeleton className={cn("h-4 w-full", skeletonClassName)} />
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

DataTableVirtualizedSkeleton.displayName = "DataTableVirtualizedSkeleton"

// ============================================================================
// DataTableVirtualizedLoading
// ============================================================================

export interface DataTableVirtualizedLoadingProps {
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Loading state component specifically for virtualized tables.
 * Uses flex layout to properly center content in virtualized table bodies.
 */
export function DataTableVirtualizedLoading({
  children,
  colSpan,
  className,
}: DataTableVirtualizedLoadingProps) {
  const { columns, isLoading } = useDataTable()

  // Show loading only when loading
  if (!isLoading) return null

  return (
    <TableRow className="flex w-full">
      <TableCell
        colSpan={colSpan ?? columns.length}
        className={className ?? "flex h-24 w-full items-center justify-center"}
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

DataTableVirtualizedLoading.displayName = "DataTableVirtualizedLoading"
