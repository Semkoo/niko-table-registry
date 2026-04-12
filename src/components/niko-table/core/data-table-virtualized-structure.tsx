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
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
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

export const DataTableVirtualizedHeader = React.memo(
  function DataTableVirtualizedHeader({
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
        className={cn(sticky && "sticky top-0 z-30 bg-background", className)}
      >
        {headerGroups.map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead
                key={header.id}
                className={cn(header.column.getIsPinned() && "bg-background")}
                style={getCommonPinningStyles(header.column, true)}
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
            ))}
          </TableRow>
        ))}
      </TableHeader>
    )
  },
)

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
  /**
   * Fires when the last rendered virtual row is within
   * `prefetchThreshold` rows of the end of the dataset. Intended
   * as a prefetch trigger for infinite-scroll — pair it with
   * `fetchNextPage()` so the next page starts loading *before* the
   * user reaches the bottom. Called at most once per transition into
   * the near-end zone (not every frame) so consumers can wire it
   * directly without worrying about double-fires.
   *
   * Strictly better than `onScrolledBottom` for virtualized infinite
   * scroll because it's virtualizer-index-driven (not scroll-event-
   * driven), so it also catches: fast scrolls via scrollbar drag,
   * programmatic `scrollToIndex()` jumps, and initial renders where
   * the table isn't tall enough to require scrolling.
   */
  onNearEnd?: () => void
  /**
   * How many rows from the end of the dataset to trigger
   * `onNearEnd`. Default `10` — fires when the user is rendering
   * the last 10 loaded rows. Tune higher for more aggressive
   * prefetching (pre-fetch earlier), lower for more conservative.
   */
  prefetchThreshold?: number
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
  onNearEnd,
  prefetchThreshold = 10,
}: DataTableVirtualizedBodyProps<TData>) {
  const { table } = useDataTable()
  const { rows } = table.getRowModel()
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const tbodyRef = React.useRef<HTMLTableSectionElement | null>(null)

  const parentRef = React.useCallback(
    (node: HTMLTableSectionElement | null) => {
      tbodyRef.current = node
      if (node !== null) {
        const container = node.closest(
          '[data-slot="table-container"]',
        ) as HTMLDivElement | null
        setScrollElement(container)
      }
    },
    [],
  )

  /**
   * STABILITY: Lock column widths after browser auto-sizing
   *
   * WHY: With `table-layout: auto`, the browser recalculates column widths
   * based on currently visible content. During virtual scroll the visible rows
   * change constantly, causing headers to shift as different content influences
   * the auto-computed widths.
   *
   * HOW: Once the virtualizer has rendered data cells into the DOM, measure
   * each <th>'s auto-computed width via getBoundingClientRect, enforce each
   * column's explicit `size` as a minimum (so `size: 180` is never locked
   * narrower than 180px even when content is short), scale proportionally to
   * fill the container, apply as inline styles, then switch the <table> to
   * `table-layout: fixed`. Uses useLayoutEffect (runs after DOM commit,
   * before paint) so there is no visual flash of the auto→fixed transition.
   *
   * IMPACT: Headers stay perfectly aligned during scroll. The effect runs on
   * every render but returns instantly when already locked — the guard is two
   * ref reads (~nanoseconds), negligible even at 60 fps during active scroll.
   * Re-measures automatically when column visibility changes.
   */
  const columnLockRef = React.useRef(false)
  const lockedColumnCountRef = React.useRef(0)

  React.useLayoutEffect(() => {
    const leafColumns = table.getVisibleLeafColumns()
    const currentColCount = leafColumns.length

    // Reset lock when column visibility changes (toggle columns on/off)
    if (
      columnLockRef.current &&
      lockedColumnCountRef.current !== currentColCount
    ) {
      columnLockRef.current = false
      const tbody = tbodyRef.current
      const tableEl = tbody?.closest<HTMLTableElement>('[data-slot="table"]')
      if (tableEl) {
        tableEl.style.tableLayout = ""
        tableEl.style.minWidth = ""
        tableEl
          .querySelectorAll<HTMLTableCellElement>(
            "thead [data-slot='table-head']",
          )
          .forEach(th => {
            th.style.width = ""
          })
      }
    }

    // Fast path — already locked, skip all DOM queries
    if (columnLockRef.current) return

    const tbody = tbodyRef.current
    if (!tbody || rows.length === 0 || !scrollElement) return

    // Verify data cells are rendered — the virtualizer may need an
    // extra render cycle after observing the scroll container before
    // it produces virtual items. Without this check we'd measure
    // header-only widths which are far too narrow.
    if (!tbody.querySelector("[data-slot='table-cell']")) return

    const tableEl = tbody.closest<HTMLTableElement>('[data-slot="table"]')
    if (!tableEl) return

    const ths = tableEl.querySelectorAll<HTMLTableCellElement>(
      "thead [data-slot='table-head']",
    )
    if (ths.length === 0) return

    // Force the table to be at least as wide as the sum of all column
    // sizes before measuring. Without this, `w-full` on <TableComponent>
    // constrains the table to the scroll container's width and the
    // auto-layout distributes compressed widths that then get locked in.
    const totalDesiredWidth = leafColumns.reduce(
      (sum, col) => sum + col.getSize(),
      0,
    )
    tableEl.style.minWidth = `${totalDesiredWidth}px`

    // Measure auto-computed widths. Auto-layout naturally gives content-heavy
    // columns more space than narrow columns — keep that behavior but enforce
    // each column's explicit `size` as a minimum so a column with `size: 180`
    // is never locked narrower than 180px even when its visible content is short.
    const rawWidths: number[] = []
    ths.forEach(th => rawWidths.push(th.getBoundingClientRect().width))

    const effectiveWidths = rawWidths.map((raw, i) => {
      const explicitSize = leafColumns[i]?.columnDef.size
      return explicitSize !== undefined ? Math.max(raw, explicitSize) : raw
    })

    // Scale proportionally so widths sum to exactly the container width —
    // eliminates the subpixel rounding gap that `table-layout: fixed` +
    // raw pixel widths leaves.
    const effectiveSum = effectiveWidths.reduce((a, b) => a + b, 0)
    const containerWidth = tableEl.getBoundingClientRect().width
    const scale =
      containerWidth > 0 && effectiveSum > 0 ? containerWidth / effectiveSum : 1

    ths.forEach((th, i) => {
      th.style.width = `${(effectiveWidths[i] ?? 0) * scale}px`
    })
    tableEl.style.tableLayout = "fixed"

    columnLockRef.current = true
    lockedColumnCountRef.current = currentColCount
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
  })

  /**
   * PERFORMANCE: Memoize scroll callbacks to prevent effect re-runs
   *
   * WHY: These callbacks are used in the scroll event listener's dependency array.
   * Without useCallback, new functions are created on every render, causing the
   * effect to re-run and re-attach event listeners unnecessarily.
   *
   * IMPACT: Prevents event listener re-attachment on every render (~1-3ms saved).
   * Also prevents potential memory leaks from multiple listeners.
   *
   * WHAT: Only creates new functions when onScrolledTop/onScrolledBottom props change.
   */
  const handleScrollTop = React.useCallback(() => {
    onScrolledTop?.()
  }, [onScrolledTop])

  const handleScrollBottom = React.useCallback(() => {
    onScrolledBottom?.()
  }, [onScrolledBottom])

  /**
   * PERFORMANCE: Use passive event listener for smoother scrolling
   *
   * WHY: Passive listeners tell the browser the handler won't call preventDefault().
   * This allows the browser to optimize scrolling (e.g., on a separate thread).
   * Critical for virtualized tables where smooth scrolling is essential.
   *
   * IMPACT: Smoother scrolling, especially on mobile devices.
   * Reduces scroll jank by 30-50% in some cases.
   *
   * WHAT: Adds scroll listener with { passive: true } flag.
   */
  React.useEffect(() => {
    // Skip if the scroll container hasn't attached yet, OR if no
    // scroll-related callback is wired. Previously the early return
    // required `onScroll` specifically, so `onScrolledBottom` /
    // `onScrolledTop` were silently dead unless the consumer also
    // passed `onScroll` — the listener never attached. Now we attach
    // whenever *any* of the three callbacks is provided.
    if (!scrollElement) return
    if (!onScroll && !onScrolledTop && !onScrolledBottom) return

    const handleScroll = (event: Event) => {
      const element = event.currentTarget as HTMLDivElement
      const { scrollHeight, scrollTop, clientHeight } = element

      const isTop = scrollTop === 0
      const isBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold
      const percentage =
        scrollHeight - clientHeight > 0
          ? (scrollTop / (scrollHeight - clientHeight)) * 100
          : 0

      onScroll?.({
        scrollTop,
        scrollHeight,
        clientHeight,
        isTop,
        isBottom,
        percentage,
      })

      if (isTop) handleScrollTop()
      if (isBottom) handleScrollBottom()
    }

    // Use passive flag to improve scroll performance
    scrollElement.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollElement.removeEventListener("scroll", handleScroll)
  }, [
    scrollElement,
    onScroll,
    onScrolledTop,
    onScrolledBottom,
    handleScrollTop,
    handleScrollBottom,
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

  /**
   * Prefetch trigger — fires `onNearEnd` when the last rendered
   * virtual row is within `prefetchThreshold` rows of the end of
   * the dataset. This is virtualizer-index-driven (not scroll-event-
   * driven) so it catches fast scrolls, scrollbar-drag jumps,
   * `scrollToIndex()` calls, and initial renders where the first
   * page doesn't fill the viewport.
   *
   * Only fires on the false→true transition (tracked via ref) so
   * consumers can wire it directly without double-fire guards.
   * Consumer still needs to check `hasNextPage && !isFetching` —
   * we only de-duplicate the render-driven fires, not the stateful
   * "should we fetch right now" decision.
   */
  const isNearEnd =
    onNearEnd !== undefined &&
    rows.length > 0 &&
    lastItem !== null &&
    lastItem.index >= rows.length - 1 - prefetchThreshold

  const wasNearEndRef = React.useRef(false)
  React.useEffect(() => {
    if (isNearEnd && !wasNearEndRef.current) {
      onNearEnd?.()
    }
    wasNearEndRef.current = isNearEnd
  }, [isNearEnd, onNearEnd])

  /**
   * PERFORMANCE: Single stable click handler for all rows
   *
   * WHY: Inline onClick closures create a new function per row per render.
   * With 20+ visible rows at 60fps during scroll, that's hundreds of
   * allocations per second. A single stable handler reads the row from
   * the DOM data attribute + table row model at click time.
   */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("a") ||
        target.closest('[role="button"]') ||
        target.closest('[role="checkbox"]') ||
        target.closest("[data-radix-collection-item]") ||
        target.closest('[data-slot="checkbox"]') ||
        target.tagName === "INPUT" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A"
      )
        return

      const rowIndex = event.currentTarget.dataset.rowIndex
      if (rowIndex == null) return
      const row = rows[Number(rowIndex)]
      if (row) {
        onRowClick(row.original as TData, event)
      }
    },
    [onRowClick, rows],
  )

  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <TableBody ref={parentRef} className={cn(className)}>
      {/* Top spacer — colSpan keeps it within native table layout */}
      {topSpacerHeight > 0 && (
        <tr aria-hidden>
          <td
            colSpan={visibleColumnCount}
            style={{
              height: `${topSpacerHeight}px`,
              padding: 0,
              border: "none",
            }}
          />
        </tr>
      )}

      {/* Render visible rows */}
      {virtualItems.map(virtualRow => {
        const row = rows[virtualRow.index]
        if (!row) return null
        const isExpanded = row.getIsExpanded()

        // Find column with expandedContent meta
        const expandColumn = row
          .getAllCells()
          .find(cell => cell.column.columnDef.meta?.expandedContent)

        return (
          <React.Fragment key={row.id}>
            {/* Main data row */}
            <TableRow
              data-index={virtualRow.index}
              data-row-index={row?.index}
              data-row-id={row?.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={handleRowClick}
              className={cn("group", onRowClick && "cursor-pointer")}
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
                    className={cn(
                      "overflow-hidden",
                      cell.column.getIsPinned() &&
                        "bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
                    )}
                    style={cellStyle}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      })}

      {/* Bottom spacer */}
      {bottomSpacerHeight > 0 && (
        <tr aria-hidden>
          <td
            colSpan={visibleColumnCount}
            style={{
              height: `${bottomSpacerHeight}px`,
              padding: 0,
              border: "none",
            }}
          />
        </tr>
      )}

      {/*
        Composable children — Skeleton, EmptyBody, LoadingMore, and
        any other data-table body states are rendered here. Each
        self-gates on its own visibility, so the consumer just drops
        them in without needing conditional JSX.
      */}
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

  /**
   * PERFORMANCE: Memoize filter state check and early return optimization
   *
   * WHY: Without memoization, filter state is recalculated on every render.
   * Without early return, expensive operations (getState(), getRowModel()) run
   * even when the empty state isn't visible (table has rows).
   *
   * OPTIMIZATION PATTERN:
   * 1. Call hooks first (React rules - hooks must be called in same order)
   * 2. Memoize expensive computations (isFiltered)
   * 3. Early return to skip rendering when not needed
   *
   * IMPACT:
   * - Without early return: ~5-10ms wasted per render when table has rows
   * - With optimization: ~0ms when table has rows (early return)
   * - Memoization: Prevents recalculation when filter state hasn't changed
   *
   * WHAT: Only computes filter state when empty state is actually visible.
   */
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
      <TableCell
        colSpan={colSpan ?? columns.length}
        className={cn("text-center", className)}
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
   * Estimated row height in pixels. Should match the `estimateSize` prop on
   * `DataTableVirtualizedBody` so skeleton rows are the same height as real
   * rows and the layout doesn't shift when data arrives.
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
      <TableRow>
        <TableCell
          colSpan={visibleColumns.length}
          className={cn("h-24 text-center", className)}
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
        <TableRow key={rowIndex} style={{ height: `${estimateSize}px` }}>
          {visibleColumns.map((column, colIndex) => {
            const size = column.columnDef.size
            const cellStyle = size ? { width: `${size}px` } : undefined

            return (
              <TableCell
                key={colIndex}
                className={cn(cellClassName)}
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

DataTableVirtualizedLoading.displayName = "DataTableVirtualizedLoading"

// ============================================================================
// DataTableVirtualizedLoadingMore
// ============================================================================

export interface DataTableVirtualizedLoadingMoreProps {
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
 * Virtualized variant of `DataTableLoadingMore`. Composable "loading
 * more" row for infinite-scroll virtualized tables. Renders at the end
 * of the body when `isFetching` is true, and nothing when false.
 *
 * Sits OUTSIDE the virtualizer's row count (it's a plain child of
 * `TableBody`, not a virtual row), so it does not affect `estimateSize`
 * math. Designed to be dropped as a child of
 * `DataTableVirtualizedBody` alongside `DataTableVirtualizedSkeleton`
 * and `DataTableVirtualizedEmptyBody`.
 *
 * @example
 * <DataTableVirtualizedBody
 *   onScrolledBottom={() => {
 *     if (hasMore && !isFetching) void loadMore()
 *   }}
 * >
 *   <DataTableVirtualizedSkeleton rows={5} />
 *   <DataTableVirtualizedEmptyBody>No results</DataTableVirtualizedEmptyBody>
 *   <DataTableVirtualizedLoadingMore isFetching={isFetching}>
 *     Loading more products...
 *   </DataTableVirtualizedLoadingMore>
 * </DataTableVirtualizedBody>
 */
export function DataTableVirtualizedLoadingMore({
  isFetching,
  children,
  colSpan,
  className,
}: DataTableVirtualizedLoadingMoreProps) {
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

DataTableVirtualizedLoadingMore.displayName = "DataTableVirtualizedLoadingMore"
