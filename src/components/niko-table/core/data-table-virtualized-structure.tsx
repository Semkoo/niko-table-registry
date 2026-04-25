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
import { useVirtualizer } from "@tanstack/react-virtual"
import { flexRender, type Row } from "@tanstack/react-table"
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
import { createScrollHandler } from "../lib/create-scroll-handler"
import { isInteractiveClickTarget } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"

// ============================================================================
// Stable measureElement — computed once at module level
// ============================================================================

// Sums base + expanded sibling height (ResizeObserver only sees the base row).
// Disabled in Firefox where stale `getBoundingClientRect` causes measure loops.
//
// Prefers `ResizeObserverEntry.borderBoxSize` for the base row when TanStack
// Virtual passes the entry through — that height is computed off the same
// observation that fired the callback, so we skip a forced layout read.
// Falls back to `getBoundingClientRect` for the initial measure (no entry)
// and for the expanded sibling (not observed by the virtualizer).
const measureElement:
  | ((element: Element, entry?: ResizeObserverEntry | undefined) => number)
  | undefined =
  typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
    ? (element, entry) => {
        const baseHeight =
          entry?.borderBoxSize?.[0]?.blockSize ??
          element.getBoundingClientRect().height
        const next = element.nextElementSibling
        if (
          next &&
          next.getAttribute("data-slot") === "datatable-expanded-row"
        ) {
          return baseHeight + next.getBoundingClientRect().height
        }
        return baseHeight
      }
    : undefined

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
// DataTableVirtualizedFlexHeader
// ============================================================================

export interface DataTableVirtualizedFlexHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

/**
 * Flex-layout header — pairs with `DataTableVirtualizedDndBody` (row-DnD).
 * Mirrors the body's cell sizing so columns stay aligned.
 *
 * Use `DataTableVirtualizedHeader` for plain tables and
 * `DataTableVirtualizedDndHeader` for column-DnD tables.
 *
 * @example
 * <DataTableRowDndProvider data={data} onReorder={setData}>
 *   <DataTable height={500}>
 *     <DataTableVirtualizedFlexHeader />
 *     <DataTableVirtualizedDndBody />
 *   </DataTable>
 * </DataTableRowDndProvider>
 */
export const DataTableVirtualizedFlexHeader = React.memo(
  function DataTableVirtualizedFlexHeader({
    className,
    sticky = true,
  }: DataTableVirtualizedFlexHeaderProps) {
    const { table } = useDataTable()

    const headerGroups = table?.getHeaderGroups() ?? []

    if (headerGroups.length === 0) {
      return null
    }

    return (
      <TableHeader
        className={cn(
          "block",
          sticky && "sticky top-0 z-30 bg-background",
          className,
        )}
      >
        {headerGroups.map(headerGroup => (
          <TableRow key={headerGroup.id} className="flex w-full border-b">
            {headerGroup.headers.map(header => {
              const size = header.column.columnDef.size
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    size ? "shrink-0" : "min-w-0 flex-1",
                    "flex items-center",
                    header.column.getIsPinned() && "bg-background",
                  )}
                  style={{
                    width: size ? `${size}px` : undefined,
                    ...getCommonPinningStyles(header.column, true),
                  }}
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
  },
)

DataTableVirtualizedFlexHeader.displayName = "DataTableVirtualizedFlexHeader"

// ============================================================================
// VirtualizedBodyRow — memoized to keep selection / expansion / column-vis
// changes from cascading into all visible rows
// ============================================================================

/**
 * Per-row component for `DataTableVirtualizedBody`. Wrapped with
 * `React.memo` so single-row state changes (selection, expansion) don't
 * reconcile every other visible row.
 *
 * The measure ref is wrapped in a stable callback by the parent so it
 * doesn't invalidate the memo on every parent render. Composite key
 * (`${row.id}-${isExpanded}`) stays on the parent so the row remounts
 * on expansion toggle and `ResizeObserver` re-attaches.
 */
interface VirtualizedBodyRowProps<TData> {
  row: Row<TData>
  virtualIndex: number
  expandColumnId: string | undefined
  isExpanded: boolean
  isSelected: boolean
  isClickable: boolean
  measureRef: ((node: HTMLTableRowElement | null) => void) | undefined
  onClick: (event: React.MouseEvent<HTMLElement>) => void
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
  /**
   * Per-row memo key. Change this string to force React.memo to re-render a
   * specific row when row-level state changes outside of TanStack Table's
   * tracked props (e.g. inline edit mode, optimistic state).
   */
  rowMemoKey: string
}

const VirtualizedBodyRowInner = function VirtualizedBodyRow<TData>({
  row,
  virtualIndex,
  expandColumnId,
  isExpanded,
  isSelected,
  isClickable,
  measureRef,
  onClick,
  columnLayoutSignature,
  // rowMemoKey is intentionally not used inside — it exists solely so
  // React.memo re-renders this row when per-row external state changes.
}: VirtualizedBodyRowProps<TData>) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  // Cache the base-row DOM node so we can re-trigger measureRef when column
  // layout changes while the row is expanded (no remount = no automatic re-measure).
  const elementRef = React.useRef<HTMLTableRowElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      elementRef.current = node
      if (measureRef) measureRef(node)
    },
    [measureRef],
  )

  // Re-measure when column layout changes while expanded so the virtualizer
  // picks up the updated combined base + expanded-pane height.
  React.useEffect(() => {
    if (isExpanded && measureRef && elementRef.current) {
      measureRef(elementRef.current)
    }
  }, [isExpanded, columnLayoutSignature, measureRef])

  return (
    <>
      <TableRow
        ref={setRef}
        data-index={virtualIndex}
        data-row-id={row.id}
        data-state={isSelected ? "selected" : undefined}
        onClick={onClick}
        className={cn("group", isClickable && "cursor-pointer")}
      >
        {visibleCells.map(cell => {
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

      {isExpanded && expandCell && (
        <TableRow data-slot="datatable-expanded-row">
          <TableCell colSpan={visibleCells.length} className="p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// React.memo strips generics; cast back so call sites stay typed.
const VirtualizedBodyRow = React.memo(
  VirtualizedBodyRowInner,
) as typeof VirtualizedBodyRowInner

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
  /**
   * Click is dispatched per-row from each row's `onClick`. Typed as
   * `React.MouseEvent<HTMLElement>` to match the other body
   * variants (`DataTableBody`, `DataTableDndBody`,
   * `DataTableVirtualizedDndBody`, etc.) so a single handler can be
   * passed through wrappers that switch between bodies. Consumers
   * needing the row element can `event.target.closest("tr[data-row-id]")`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
  /**
   * Return a per-row memo invalidation key. When the returned string changes
   * for a specific row, React.memo re-renders that row even if TanStack Table
   * props (selection, expansion, column layout) are unchanged. Use this for
   * row-level external state that cell renderers depend on — e.g. inline edit
   * mode, optimistic overlays, or any closure-captured state in column
   * definitions that changes independently of the table's own state.
   *
   * @example
   * // Trigger re-render on inline edit toggle (only the edited row re-renders)
   * getRowMemoKey={(row) => (isEditing(row.id) ? "editing" : "")}
   */
  getRowMemoKey?: (row: TData) => string
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
  getRowMemoKey,
}: DataTableVirtualizedBodyProps<TData>) {
  const { table, columns } = useDataTable()
  const { rows } = table.getRowModel()

  // Hoist expand-column lookup above the virtualizer loop (was O(virtual_rows × cols) per frame).
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    [table, columns],
  )

  const { columnVisibility, columnOrder, columnPinning } = table.getState()
  // Encodes visible column ids + pinning so memoized rows re-render on layout changes.
  const columnLayoutSignature = React.useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .map(c => {
          const pinned = c.getIsPinned()
          return pinned ? `${c.id}:${pinned}` : c.id
        })
        .join(","),
    [table, columnVisibility, columnOrder, columnPinning],
  )

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

  // Lock column widths post auto-size: measure each <th>, enforce explicit
  // `size` as a minimum, scale to container, then switch to `table-layout: fixed`.
  // Without this, auto-layout shifts headers during virtual scroll as visible
  // content changes. useLayoutEffect avoids the auto→fixed flash.
  const columnLockRef = React.useRef(false)
  const lockedColumnCountRef = React.useRef(0)
  // Mirrored as state so row-render can gate `measureElement` on it. Attaching
  // the ResizeObserver before the lock would read inflated wrapped-text heights
  // and bake huge spacer gaps into the virtualizer.
  const [columnsLocked, setColumnsLocked] = React.useState(false)

  React.useLayoutEffect(() => {
    const leafColumns = table.getVisibleLeafColumns()
    const currentColCount = leafColumns.length

    // Reset lock when column visibility changes (toggle columns on/off)
    if (
      columnLockRef.current &&
      lockedColumnCountRef.current !== currentColCount
    ) {
      columnLockRef.current = false
      setColumnsLocked(false)
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
      // Bail so React commits the unlocked render before re-locking —
      // batching both updates would let `ResizeObserver` capture
      // inflated heights during the auto-layout pass.
      return
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
    setColumnsLocked(true)
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
    measureElement,
  })

  // Passive scroll listener — shared `createScrollHandler` across all body variants.
  React.useEffect(() => {
    if (!scrollElement) return
    if (!onScroll && !onScrolledTop && !onScrolledBottom) return

    const handleScroll = createScrollHandler({
      onScroll,
      onScrolledTop,
      onScrolledBottom,
      scrollThreshold,
    })
    scrollElement.addEventListener("scroll", handleScroll, { passive: true })
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

  // Virtualizer-index-driven prefetch: fires once on false→true transition,
  // catching fast scrolls, scrollbar drags, and short initial pages that
  // scroll-event-based triggers miss.
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

  // One stable handler vs N inline closures — at 20 rows × 60fps that's
  // hundreds of allocations/sec saved during scroll.
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!onRowClick) return
      if (isInteractiveClickTarget(event.target as HTMLElement)) return

      // Resolve via stable `row.id` rather than a positional index —
      // sort/filter/reorder leave indices unstable but ids are
      // canonical. `table.getRow` is a Map lookup internally so this
      // stays O(1).
      const rowId = event.currentTarget.dataset.rowId
      if (rowId == null) return
      const row = table.getRow(rowId)
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, table],
  )

  // Stable wrapper around the virtualizer's measure callback. The
  // virtualizer recreates its `measureElement` on every render, which
  // would invalidate `React.memo` on the row component if passed
  // directly. The latest-ref pattern keeps the prop reference stable
  // while still calling through to the current measurer.
  const measureElementRef = React.useRef(rowVirtualizer.measureElement)
  measureElementRef.current = rowVirtualizer.measureElement
  const stableMeasureElement = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      measureElementRef.current(node)
    },
    [],
  )

  const isClickable = !!onRowClick
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

        // Composite key forces a remount on expansion toggle so
        // `ResizeObserver` re-attaches and re-reads the combined height.
        // DnD bodies use a stable key (preserving `useSortable`) and
        // re-measure imperatively instead.
        return (
          <VirtualizedBodyRow
            key={`${row.id}-${isExpanded}`}
            row={row as Row<TData>}
            virtualIndex={virtualRow.index}
            expandColumnId={expandColumnId}
            isExpanded={isExpanded}
            isSelected={row.getIsSelected()}
            isClickable={isClickable}
            measureRef={columnsLocked ? stableMeasureElement : undefined}
            onClick={handleRowClick}
            columnLayoutSignature={columnLayoutSignature}
            rowMemoKey={
              getRowMemoKey ? getRowMemoKey(row.original as TData) : ""
            }
          />
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

  // Hooks first (rules-of-hooks), then early-return below skips work when
  // the table has rows.
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
