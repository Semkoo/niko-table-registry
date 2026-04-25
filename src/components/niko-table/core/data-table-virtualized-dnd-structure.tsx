"use client"

import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useDataTable } from "./data-table-context"
import {
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { getCommonPinningStyles } from "../lib/styles"
import {
  SortableContext,
  verticalListSortingStrategy,
  type UniqueIdentifier,
} from "../filters/table-row-dnd"
import {
  TableDraggableHeader,
  TableDragAlongCell,
} from "../filters/table-column-dnd"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ScrollEvent } from "./data-table-virtualized-structure"

// ============================================================================
// Stable measureElement — computed once at module level
// ============================================================================

/**
 * Custom element measurer for the row virtualizer. Returns the
 * base row height plus, when present, the height of an adjacent
 * expanded-content row (`<tr data-slot="datatable-expanded-row">`).
 * See the equivalent helper in `data-table-virtualized-structure.tsx`
 * for the full rationale — short version: the virtualizer's
 * `ResizeObserver` only attaches to the base row, so expanded
 * sibling content goes unmeasured and `getTotalSize()` drifts.
 *
 * Disabled in Firefox where `getBoundingClientRect` returns stale
 * values during virtual-scroll reflows, causing measurement loops.
 *
 * Defined at module scope so every virtualizer instance shares the
 * same stable function reference — no `useCallback` / `useMemo`
 * overhead, and React never detaches/reattaches the ref due to a
 * changed identity.
 */
const measureElement: ((element: Element) => number) | undefined =
  typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
    ? (element: Element) => {
        const baseHeight = element.getBoundingClientRect().height
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
// VirtualizedDraggableRow — internal row component for virtualized DnD
// ============================================================================

interface VirtualizedDraggableRowProps {
  children: React.ReactNode
  rowId: string
  /** Used for event delegation (row click); forwarded as data-row-index. */
  rowIndex?: number
  className?: string
  measureRef?: (node: HTMLTableRowElement | null) => void
}

function VirtualizedDraggableRow({
  children,
  rowId,
  rowIndex,
  className,
  measureRef,
}: VirtualizedDraggableRowProps) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: rowId,
  })

  const setRefs = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      setNodeRef(node)
      if (measureRef) measureRef(node)
    },
    [setNodeRef, measureRef],
  )

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <TableRow
      ref={setRefs}
      style={style}
      className={cn("flex w-full", isDragging && "bg-muted/50", className)}
      data-index={rowIndex}
      data-row-index={rowIndex}
    >
      {children}
    </TableRow>
  )
}

// ============================================================================
// DataTableVirtualizedDndBody (Row DnD + Virtualization)
// ============================================================================

export interface DataTableVirtualizedDndBodyProps<TData> {
  children?: React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  /**
   * Click is delegated on `<tbody>` (so a single listener serves all
   * virtual rows). The event therefore arrives with `currentTarget`
   * = the `<tbody>`. If you need the row element, query
   * `event.target.closest("tr[data-row-index]")` — typed as
   * `HTMLElement` to reflect that runtime shape rather than lying
   * with `HTMLTableRowElement`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
}

/**
 * Virtualized DnD-aware table body that combines row virtualization with
 * drag-and-drop reordering. Uses @tanstack/react-virtual for performance
 * and @dnd-kit/sortable for drag interactions.
 *
 * Must be wrapped in a DataTableRowDndProvider (or TableRowDndProvider).
 *
 * @example
 * <DataTableRowDndProvider data={data} onReorder={setData}>
 *   <DataTable height={400}>
 *     <DataTableVirtualizedHeader />
 *     <DataTableVirtualizedDndBody estimateSize={34} overscan={10} />
 *   </DataTable>
 * </DataTableRowDndProvider>
 */
export function DataTableVirtualizedDndBody<TData>({
  children,
  estimateSize = 34,
  overscan = 20,
  className,
  onScroll,
  onRowClick,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
}: DataTableVirtualizedDndBodyProps<TData>) {
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
    measureElement,
  })

  const handleScrollTop = React.useCallback(() => {
    onScrolledTop?.()
  }, [onScrolledTop])

  const handleScrollBottom = React.useCallback(() => {
    onScrolledBottom?.()
  }, [onScrolledBottom])

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      const rowElement = target.closest("tr[data-row-index]")
      if (!rowElement) return

      const isInteractiveElement =
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
      if (isInteractiveElement) return

      const rowIndexAttr = rowElement.getAttribute("data-row-index")
      if (rowIndexAttr === null) return
      const index = parseInt(rowIndexAttr, 10)
      if (Number.isNaN(index) || index < 0 || index >= rows.length) return
      const row = rows[index]
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, rows],
  )

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

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.id),
    [rows],
  )

  const virtualItems = rowVirtualizer.getVirtualItems()
  const hasVirtualItems = virtualItems.length > 0

  const topSpacerHeight = hasVirtualItems ? virtualItems[0].start : 0
  const lastItem = hasVirtualItems
    ? virtualItems[virtualItems.length - 1]
    : null
  const bottomSpacerHeight = lastItem
    ? rowVirtualizer.getTotalSize() - lastItem.end
    : 0

  return (
    <TableBody
      ref={parentRef}
      className={cn("block", className)}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
        {/* Top spacer for virtual scrolling offset */}
        {topSpacerHeight > 0 && (
          <TableRow
            style={{ height: `${topSpacerHeight}px`, display: "block" }}
          />
        )}

        {/* Render visible rows as draggable */}
        {virtualItems.map(virtualRow => {
          const row = rows[virtualRow.index]
          const isClickable = !!onRowClick
          const isExpanded = row.getIsExpanded()

          const expandColumn = row
            .getAllCells()
            .find(cell => cell.column.columnDef.meta?.expandedContent)

          return (
            <React.Fragment key={`${row.id}-${isExpanded}`}>
              <VirtualizedDraggableRow
                rowId={row.id}
                rowIndex={row?.index}
                measureRef={rowVirtualizer.measureElement}
              >
                {row.getVisibleCells().map(cell => {
                  const size = cell.column.columnDef.size
                  const cellStyle = {
                    width: size ? `${size}px` : undefined,
                    minHeight: `${estimateSize}px`,
                    ...getCommonPinningStyles(cell.column, false),
                  }

                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        size ? "shrink-0" : "min-w-0 flex-1",
                        "flex items-center",
                        isClickable && "cursor-pointer",
                        cell.column.getIsPinned() &&
                          "bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
                      )}
                      style={cellStyle}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  )
                })}
              </VirtualizedDraggableRow>

              {/* Expanded content row */}
              {isExpanded && expandColumn && (
                <TableRow
                  data-slot="datatable-expanded-row"
                  className="flex w-full"
                >
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
      </SortableContext>

      {/* Empty state and other children */}
      {children}
    </TableBody>
  )
}

DataTableVirtualizedDndBody.displayName = "DataTableVirtualizedDndBody"

// ============================================================================
// DataTableVirtualizedDndHeader (Column DnD + Virtualization)
// ============================================================================

export interface DataTableVirtualizedDndHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

/**
 * Virtualized DnD-aware table header for column drag-and-drop.
 * Uses flex layout matching the virtualized table structure.
 *
 * Must be wrapped in a DataTableColumnDndProvider (or TableColumnDndProvider).
 *
 * @example
 * <DataTableColumnDndProvider columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}>
 *   <DataTable height={400}>
 *     <DataTableVirtualizedDndHeader />
 *     <DataTableVirtualizedDndColumnBody estimateSize={34} />
 *   </DataTable>
 * </DataTableColumnDndProvider>
 */
export const DataTableVirtualizedDndHeader = React.memo(
  function DataTableVirtualizedDndHeader({
    className,
    sticky = true,
  }: DataTableVirtualizedDndHeaderProps) {
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
                <TableDraggableHeader
                  key={header.id}
                  header={header}
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
                </TableDraggableHeader>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
    )
  },
)

DataTableVirtualizedDndHeader.displayName = "DataTableVirtualizedDndHeader"

// ============================================================================
// DataTableVirtualizedDndColumnBody (Column DnD + Virtualization)
// ============================================================================

export interface DataTableVirtualizedDndColumnBodyProps<TData> {
  children?: React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
  /**
   * Click is delegated on `<tbody>` (so a single listener serves all
   * virtual rows). The event therefore arrives with `currentTarget`
   * = the `<tbody>`. If you need the row element, query
   * `event.target.closest("tr[data-row-index]")` — typed as
   * `HTMLElement` to reflect that runtime shape rather than lying
   * with `HTMLTableRowElement`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
}

/**
 * Virtualized DnD-aware table body for column drag-and-drop.
 * Each cell follows column drag position using useSortable.
 *
 * Must be wrapped in a DataTableColumnDndProvider (or TableColumnDndProvider).
 *
 * @example
 * <DataTableColumnDndProvider columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}>
 *   <DataTable height={400}>
 *     <DataTableVirtualizedDndHeader />
 *     <DataTableVirtualizedDndColumnBody estimateSize={34} />
 *   </DataTable>
 * </DataTableColumnDndProvider>
 */
export function DataTableVirtualizedDndColumnBody<TData>({
  children,
  estimateSize = 34,
  overscan = 20,
  className,
  onScroll,
  onRowClick,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
}: DataTableVirtualizedDndColumnBodyProps<TData>) {
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
    measureElement,
  })

  const handleScrollTop = React.useCallback(() => {
    onScrolledTop?.()
  }, [onScrolledTop])

  const handleScrollBottom = React.useCallback(() => {
    onScrolledBottom?.()
  }, [onScrolledBottom])

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

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      const rowElement = target.closest("tr[data-row-index]")
      if (!rowElement) return

      const isInteractiveElement =
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
      if (isInteractiveElement) return

      const rowIndexAttr = rowElement.getAttribute("data-row-index")
      if (rowIndexAttr === null) return
      const index = parseInt(rowIndexAttr, 10)
      if (Number.isNaN(index) || index < 0 || index >= rows.length) return
      const row = rows[index]
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, rows],
  )

  const virtualItems = rowVirtualizer.getVirtualItems()
  const hasVirtualItems = virtualItems.length > 0

  const topSpacerHeight = hasVirtualItems ? virtualItems[0].start : 0
  const lastItem = hasVirtualItems
    ? virtualItems[virtualItems.length - 1]
    : null
  const bottomSpacerHeight = lastItem
    ? rowVirtualizer.getTotalSize() - lastItem.end
    : 0

  return (
    <TableBody
      ref={parentRef}
      className={cn("block", className)}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {/* Top spacer for virtual scrolling offset */}
      {topSpacerHeight > 0 && (
        <TableRow
          style={{ height: `${topSpacerHeight}px`, display: "block" }}
        />
      )}

      {/* Render visible rows with drag-along cells */}
      {virtualItems.map(virtualRow => {
        const row = rows[virtualRow.index]
        const isClickable = !!onRowClick

        return (
          <TableRow
            key={row.id}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            data-row-index={row?.index}
            data-row-id={row?.id}
            data-state={row.getIsSelected() && "selected"}
            className={cn("group flex w-full", isClickable && "cursor-pointer")}
          >
            {row.getVisibleCells().map(cell => {
              const size = cell.column.columnDef.size
              return (
                <TableDragAlongCell
                  key={cell.id}
                  cell={cell}
                  className={cn(
                    size ? "shrink-0" : "min-w-0 flex-1",
                    "flex items-center",
                    cell.column.getIsPinned() &&
                      "bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
                  )}
                  style={{
                    width: size ? `${size}px` : undefined,
                    minHeight: `${estimateSize}px`,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableDragAlongCell>
              )
            })}
          </TableRow>
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

DataTableVirtualizedDndColumnBody.displayName =
  "DataTableVirtualizedDndColumnBody"
