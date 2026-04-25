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
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { createScrollHandler } from "../lib/create-scroll-handler"
import { resolveRowFromClick } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"

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

export const DataTableHeader = React.memo(function DataTableHeader({
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
        sticky && "sticky top-0 z-30 bg-background",
        // Ensure border is visible when sticky using pseudo-element
        sticky &&
          "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
        className,
      )}
    >
      {headerGroups.map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const size = header.column.columnDef.size
            const headerStyle = {
              width: size ? `${size}px` : undefined,
              ...getCommonPinningStyles(header.column, true),
            }

            return (
              <TableHead
                key={header.id}
                style={headerStyle}
                className={cn(header.column.getIsPinned() && "bg-background")}
              >
                {header.isPlaceholder ? null : (
                  <DataTableColumnHeaderRoot column={header.column}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </DataTableColumnHeaderRoot>
                )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
})

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
  /**
   * Click is dispatched per-row from each cell's onClick. The
   * event's `currentTarget` is the `<td>` cell — typed as
   * `HTMLElement` to stay consistent with the virtualized variants
   * (which delegate on `<tbody>`). Consumers needing the row
   * element can `event.target.closest("tr[data-row-id]")`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
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
  const { table, columns, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()
  const containerRef = React.useRef<HTMLTableSectionElement>(null)

  // Single delegated click handler — avoids one inline fn per row.
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const row = resolveRowFromClick(event.target as HTMLElement, table)
      if (!row) return
      onRowClick(row.original, event)
    },
    [onRowClick, table],
  )

  // Passive scroll listener — shared `createScrollHandler` keeps all four body
  // variants in sync; passive flag unlocks the browser's scroll-thread path.
  React.useEffect(() => {
    const container = containerRef.current?.closest(
      '[data-slot="table-container"]',
    ) as HTMLDivElement
    if (!container) return
    if (!onScroll && !onScrolledTop && !onScrolledBottom) return

    const handleScroll = createScrollHandler({
      onScroll,
      onScrolledTop,
      onScrolledBottom,
      scrollThreshold,
    })
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [onScroll, onScrolledTop, onScrolledBottom, scrollThreshold])

  // Hoist expand-column lookup above the row map (was O(rows × cols) per render).
  // `columns` is in deps because the table reference is too stable on its own.
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    [table, columns],
  )

  return (
    <TableBody
      ref={containerRef}
      className={className}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {/* Only show rows when not loading */}
      {!isLoading && rows?.length
        ? rows.map(row => {
            const isClickable = !!onRowClick
            const isExpanded = row.getIsExpanded()

            // Resolve the expand cell only when expanded, using the
            // memoized `expandColumnId`.
            const expandCell =
              isExpanded && expandColumnId
                ? row.getAllCells().find(c => c.column.id === expandColumnId)
                : undefined

            return (
              <React.Fragment key={row.id}>
                <TableRow
                  data-row-index={row?.index}
                  data-row-id={row?.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(isClickable && "cursor-pointer", "group")}
                >
                  {row.getVisibleCells().map(cell => {
                    const size = cell.column.columnDef.size
                    const cellStyle = {
                      width: size ? `${size}px` : undefined,
                      ...getCommonPinningStyles(cell.column, false),
                    }

                    return (
                      <TableCell
                        key={cell.id}
                        style={cellStyle}
                        className={cn(
                          cell.column.getIsPinned() &&
                            "bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
                        )}
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
                {expandCell && (
                  <TableRow>
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      className="p-0"
                    >
                      {expandCell.column.columnDef.meta?.expandedContent?.(
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

  // Hooks first (rules-of-hooks), then early-return below skips work when
  // the empty state isn't visible.
  const tableState = table.getState()
  const isFiltered = React.useMemo(
    () =>
      (tableState.globalFilter && tableState.globalFilter.length > 0) ||
      (tableState.columnFilters && tableState.columnFilters.length > 0),
    [tableState.globalFilter, tableState.columnFilters],
  )

  // Early return after hooks - this prevents rendering when not needed
  const rowCount = table.getRowModel().rows.length
  if (isLoading || rowCount > 0) return null

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
  const { table, columns, isLoading } = useDataTable()

  // Show skeleton only when loading
  if (!isLoading) return null

  // Get visible columns from table to match actual structure
  const visibleColumns = table.getVisibleLeafColumns()
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
          {visibleColumns.map((column, colIndex) => {
            const size = column.columnDef.size
            const cellStyle = size ? { width: `${size}px` } : undefined

            return (
              <TableCell
                key={colIndex}
                className={cellClassName}
                style={cellStyle}
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
  const { columns, isLoading } = useDataTable()

  // Self-gate on `isLoading` to match peer composables — otherwise the row
  // stays visible after data resolves.
  if (!isLoading) return null

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

// ============================================================================
// DataTableLoadingMore
// ============================================================================

export interface DataTableLoadingMoreProps {
  /**
   * Whether a next-page fetch is currently in flight. Typically wired
   * to a library state like TanStack Query's `isFetchingNextPage`,
   * SWR's `isValidating`, or a plain `useState` flag. When false, this
   * component renders nothing.
   */
  isFetching: boolean
  /**
   * Optional custom content. Defaults to a spinner + "Loading more..."
   * label. Pass children to customize per-table (e.g. "Loading more
   * products...").
   */
  children?: React.ReactNode
  colSpan?: number
  className?: string
}

/**
 * Composable "loading more" row for infinite-scroll tables. Renders at
 * the end of the body when `isFetching` is true, and nothing when
 * false — designed to be dropped as a child of `DataTableBody`
 * alongside `DataTableSkeleton` and `DataTableEmptyBody`.
 *
 * Self-gates on its own `isFetching` prop. Combine with
 * `onScrolledBottom` on `DataTableBody` to trigger next-page fetches.
 *
 * @example
 * <DataTableBody
 *   onScrolledBottom={() => {
 *     if (hasMore && !isFetching) void loadMore()
 *   }}
 * >
 *   <DataTableSkeleton rows={5} />
 *   <DataTableEmptyBody>No results</DataTableEmptyBody>
 *   <DataTableLoadingMore isFetching={isFetching}>
 *     Loading more products...
 *   </DataTableLoadingMore>
 * </DataTableBody>
 */
export function DataTableLoadingMore({
  isFetching,
  children,
  colSpan,
  className,
}: DataTableLoadingMoreProps) {
  const { columns } = useDataTable()

  // Self-gating — nothing to render when no fetch is in flight.
  if (!isFetching) return null

  return (
    <TableRow data-slot="datatable-loading-more-row">
      <TableCell
        colSpan={colSpan ?? columns.length}
        className={cn(
          "py-3 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <span>{children ?? "Loading more..."}</span>
        </span>
      </TableCell>
    </TableRow>
  )
}

DataTableLoadingMore.displayName = "DataTableLoadingMore"
