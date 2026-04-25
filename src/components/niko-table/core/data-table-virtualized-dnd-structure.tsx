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
/**
 * @internal Deep-import only.
 * Intentionally not re-exported from the package barrel — the DnD
 * virtualized variants are an opt-in advanced surface; the deep
 * path keeps consumers explicit about pulling them in and avoids
 * bloating the barrel for the common (non-DnD) case.
 */

import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { flexRender, type Row } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useDataTable } from "./data-table-context"
import {
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { createScrollHandler } from "../lib/create-scroll-handler"
import { resolveRowFromClick } from "../lib/row-click"
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

// See `data-table-virtualized-structure.tsx` for full rationale: sums base +
// adjacent expanded-row height since ResizeObserver only attaches to the base.
// Prefers `ResizeObserverEntry.borderBoxSize` over `getBoundingClientRect`
// when TanStack Virtual passes the entry — skips a forced layout read on
// the hot path. Disabled in Firefox (stale getBoundingClientRect during
// scroll). Module-scoped for stable reference identity.
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
// VirtualizedDraggableRow — internal row component for virtualized DnD
// ============================================================================

interface VirtualizedDraggableRowProps {
  children: React.ReactNode
  /**
   * Stable row identity from `row.id`. Used by event delegation to
   * resolve which row was clicked via `table.getRow(rowId)` —
   * survives sort/filter/reorder, unlike `row.index`.
   */
  rowId: string
  /**
   * Virtualizer slot index (`virtualRow.index`). Forwarded to
   * `data-index`, which TanStack Virtual's `measureElement` reads to
   * map a measured DOM node back to its virtualizer slot. Must be
   * the virtualizer's index, not the source-data `row.index` —
   * under sort/filter those drift apart.
   */
  virtualIndex: number
  /**
   * Whether this row is currently selected. Used to set `data-state`
   * + a `group` class on the row so the existing
   * `data-[state=selected]` and `group-data-[state=selected]`
   * selectors (on the row itself and on pinned-column cells)
   * actually fire.
   */
  isSelected?: boolean
  /**
   * Whether the row is currently expanded. Used to imperatively
   * re-trigger `measureRef` (the virtualizer's `measureElement`)
   * when expansion toggles — the DnD body intentionally uses a
   * stable `key={row.id}` so `useSortable`'s registration is
   * preserved across expand/collapse, but that means `setRefs`
   * doesn't re-run on toggle and the virtualizer would otherwise
   * keep the stale collapsed-height measurement.
   */
  isExpanded?: boolean
  className?: string
  measureRef?: (node: HTMLTableRowElement | null) => void
}

function VirtualizedDraggableRow({
  children,
  rowId,
  virtualIndex,
  isSelected,
  isExpanded,
  className,
  measureRef,
}: VirtualizedDraggableRowProps) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: rowId,
  })

  // Cache the row DOM node so the `isExpanded` effect can pass it
  // back to `measureRef` (the virtualizer's `measureElement`) on
  // demand — without unmounting the row.
  const elementRef = React.useRef<HTMLTableRowElement | null>(null)

  const setRefs = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      setNodeRef(node)
      elementRef.current = node
      if (measureRef) measureRef(node)
    },
    [setNodeRef, measureRef],
  )

  // Re-measure on expansion toggle — `measureRef` is idempotent and
  // re-walks `nextElementSibling` to include the expanded pane.
  // Keeps `key={row.id}` stable so `useSortable` registration survives.
  React.useEffect(() => {
    if (measureRef && elementRef.current) {
      measureRef(elementRef.current)
    }
  }, [isExpanded, measureRef])

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
      className={cn(
        "group flex w-full",
        isDragging && "bg-muted/50",
        className,
      )}
      data-index={virtualIndex}
      data-row-id={rowId}
      data-state={isSelected ? "selected" : undefined}
    >
      {children}
    </TableRow>
  )
}

// ============================================================================
// VirtualizedDndBodyRow / VirtualizedDndColumnBodyRow — memoized rows
// ============================================================================

/**
 * Per-row component for `DataTableVirtualizedDndBody` (row-DnD +
 * virtualization). Wraps the existing `VirtualizedDraggableRow` (which
 * owns the `useSortable` registration) and renders cells inside it.
 * Memoized so a single-row state change (selection, expansion) doesn't
 * reconcile every other visible row.
 */
interface VirtualizedDndBodyRowProps<TData> {
  row: Row<TData>
  virtualIndex: number
  expandColumnId: string | undefined
  isExpanded: boolean
  isSelected: boolean
  isClickable: boolean
  estimateSize: number
  measureRef: ((node: HTMLTableRowElement | null) => void) | undefined
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
}

const VirtualizedDndBodyRowInner = function VirtualizedDndBodyRow<TData>({
  row,
  virtualIndex,
  expandColumnId,
  isExpanded,
  isSelected,
  isClickable,
  estimateSize,
  measureRef,
}: VirtualizedDndBodyRowProps<TData>) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  return (
    <>
      <VirtualizedDraggableRow
        rowId={row.id}
        virtualIndex={virtualIndex}
        isSelected={isSelected}
        isExpanded={isExpanded}
        measureRef={measureRef}
      >
        {visibleCells.map(cell => {
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
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </VirtualizedDraggableRow>

      {isExpanded && expandCell && (
        <TableRow data-slot="datatable-expanded-row" className="flex w-full">
          <TableCell colSpan={visibleCells.length} className="w-full p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const VirtualizedDndBodyRow = React.memo(
  VirtualizedDndBodyRowInner,
) as typeof VirtualizedDndBodyRowInner

/**
 * Per-row component for `DataTableVirtualizedDndColumnBody`
 * (column-DnD + virtualization). Memoized to keep selection /
 * expansion changes local to one row instead of cascading across the
 * viewport. `TableDragAlongCell` manages per-cell drag state internally.
 */
interface VirtualizedDndColumnBodyRowProps<TData> {
  row: Row<TData>
  virtualIndex: number
  expandColumnId: string | undefined
  isExpanded: boolean
  isSelected: boolean
  isClickable: boolean
  estimateSize: number
  measureRef: ((node: HTMLTableRowElement | null) => void) | undefined
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
}

const VirtualizedDndColumnBodyRowInner = function VirtualizedDndColumnBodyRow<
  TData,
>({
  row,
  virtualIndex,
  expandColumnId,
  isExpanded,
  isSelected,
  isClickable,
  estimateSize,
  measureRef,
  columnLayoutSignature,
}: VirtualizedDndColumnBodyRowProps<TData>) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  // Cache the row DOM node so the isExpanded effect can re-trigger measureRef
  // without unmounting. Same pattern as VirtualizedDraggableRow.
  const elementRef = React.useRef<HTMLTableRowElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      elementRef.current = node
      if (measureRef) measureRef(node)
    },
    [measureRef],
  )

  // Re-measure on expansion toggle so the virtualizer picks up the combined
  // base + expanded-pane height without remounting the row (stable key = no
  // useSortable re-registration). Column-DnD rows don't have useSortable on
  // the row itself but we keep key stable for consistency.
  React.useEffect(() => {
    if (measureRef && elementRef.current) measureRef(elementRef.current)
  }, [isExpanded, columnLayoutSignature, measureRef])

  return (
    <>
      <TableRow
        ref={setRef}
        data-index={virtualIndex}
        data-row-id={row.id}
        data-state={isSelected ? "selected" : undefined}
        className={cn("group flex w-full", isClickable && "cursor-pointer")}
      >
        {visibleCells.map(cell => {
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

      {isExpanded && expandCell && (
        <TableRow data-slot="datatable-expanded-row" className="flex w-full">
          <TableCell colSpan={visibleCells.length} className="w-full p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const VirtualizedDndColumnBodyRow = React.memo(
  VirtualizedDndColumnBodyRowInner,
) as typeof VirtualizedDndColumnBodyRowInner

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
   * `event.target.closest("tr[data-row-id]")` — typed as
   * `HTMLElement` to reflect that runtime shape rather than lying
   * with `HTMLTableRowElement`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
  /**
   * Virtualizer-index-driven prefetch trigger — fires when the
   * last rendered virtual row is within `prefetchThreshold` rows
   * of the end. See `DataTableVirtualizedBody.onNearEnd` for the
   * full rationale (strictly better than `onScrolledBottom` for
   * infinite scroll: catches scrollbar drags, programmatic
   * `scrollToIndex` jumps, and short initial renders).
   */
  onNearEnd?: () => void
  /** Default `10`. See `DataTableVirtualizedBody.prefetchThreshold`. */
  prefetchThreshold?: number
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
  onNearEnd,
  prefetchThreshold = 10,
}: DataTableVirtualizedDndBodyProps<TData>) {
  const { table, columns } = useDataTable()
  const { rows } = table.getRowModel()

  // Hoist expand-column lookup above the virtualizer loop. See `DataTableVirtualizedBody`.
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

  // No `columnsLocked` gate — DnD bodies use flex layout (no auto-layout
  // pass to mismeasure during), so `ResizeObserver` can attach immediately.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
    measureElement,
  })

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const row = resolveRowFromClick(event.target as HTMLElement, table)
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, table],
  )

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

  const isClickable = !!onRowClick

  // Stable wrapper around the virtualizer's measure callback (see
  // `DataTableVirtualizedBody` for full rationale — `measureElement`
  // is recreated on every render and would invalidate `React.memo`
  // on the row component if forwarded directly).
  const measureElementRef = React.useRef(rowVirtualizer.measureElement)
  measureElementRef.current = rowVirtualizer.measureElement
  const stableMeasureElement = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      measureElementRef.current(node)
    },
    [],
  )

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
          if (!row) return null

          return (
            <VirtualizedDndBodyRow
              key={row.id}
              row={row as Row<TData>}
              virtualIndex={virtualRow.index}
              expandColumnId={expandColumnId}
              isExpanded={row.getIsExpanded()}
              isSelected={row.getIsSelected()}
              isClickable={isClickable}
              estimateSize={estimateSize}
              measureRef={stableMeasureElement}
              columnLayoutSignature={columnLayoutSignature}
            />
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
   * `event.target.closest("tr[data-row-id]")` — typed as
   * `HTMLElement` to reflect that runtime shape rather than lying
   * with `HTMLTableRowElement`.
   */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLElement>) => void
  /**
   * Virtualizer-index-driven prefetch trigger — fires when the
   * last rendered virtual row is within `prefetchThreshold` rows
   * of the end. See `DataTableVirtualizedBody.onNearEnd` for the
   * full rationale.
   */
  onNearEnd?: () => void
  /** Default `10`. See `DataTableVirtualizedBody.prefetchThreshold`. */
  prefetchThreshold?: number
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
  onNearEnd,
  prefetchThreshold = 10,
}: DataTableVirtualizedDndColumnBodyProps<TData>) {
  const { table, columns } = useDataTable()
  const { rows } = table.getRowModel()

  // Hoist expand-column lookup above the virtualizer loop. See `DataTableVirtualizedBody`.
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

  // No `columnsLocked` gate — DnD bodies use flex layout (no auto-layout
  // pass to mismeasure during), so `ResizeObserver` can attach immediately.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    enabled: !!scrollElement,
    measureElement,
  })

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

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const row = resolveRowFromClick(event.target as HTMLElement, table)
      if (!row) return
      onRowClick(row.original as TData, event)
    },
    [onRowClick, table],
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

  const isClickable = !!onRowClick

  // Stable wrapper for the virtualizer's measure ref so it doesn't
  // invalidate the memoized row on every parent render. See
  // `DataTableVirtualizedBody` for the full latest-ref-pattern rationale.
  const measureElementRef = React.useRef(rowVirtualizer.measureElement)
  measureElementRef.current = rowVirtualizer.measureElement
  const stableMeasureElement = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      measureElementRef.current(node)
    },
    [],
  )

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
        if (!row) return null

        return (
          <VirtualizedDndColumnBodyRow
            key={row.id}
            row={row as Row<TData>}
            virtualIndex={virtualRow.index}
            expandColumnId={expandColumnId}
            isExpanded={row.getIsExpanded()}
            isSelected={row.getIsSelected()}
            isClickable={isClickable}
            estimateSize={estimateSize}
            measureRef={stableMeasureElement}
            columnLayoutSignature={columnLayoutSignature}
          />
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
