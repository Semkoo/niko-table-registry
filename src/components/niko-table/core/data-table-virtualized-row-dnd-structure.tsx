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
import { TableRow, TableBody, TableCell } from "@/components/ui/table"
import { DataTableRowContextMenu } from "../components/data-table-row-context-menu"
import { useResolvedRowContextMenuRenderer } from "../components/data-table-row-context-menu-slot"
import { createScrollHandler } from "../lib/create-scroll-handler"
import { resolveRowFromClick } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import {
  SortableContext,
  verticalListSortingStrategy,
  type UniqueIdentifier,
} from "../filters/table-row-dnd"
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
// VirtualizedDraggableRow — internal row component for virtualized row DnD
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
  columnLayoutSignature?: string
  rowMemoKey?: string
}

function VirtualizedDraggableRow({
  children,
  rowId,
  virtualIndex,
  isSelected,
  isExpanded,
  className,
  measureRef,
  columnLayoutSignature,
  rowMemoKey,
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
  }, [isExpanded, columnLayoutSignature, rowMemoKey, measureRef])

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
// VirtualizedDndBodyRow — memoized row
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
  /** Column resizing is on — cells size from `column.getSize()` instead of `columnDef.size`. */
  columnSizingEnabled: boolean
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
  /**
   * Per-row memo key. Change this string to force React.memo to re-render a
   * specific row when row-level state changes outside of TanStack Table's
   * tracked props (e.g. inline edit mode, optimistic state).
   */
  rowMemoKey: string
  /**
   * Right-click menu items for this row. Must be a stable callback so
   * `React.memo` keeps holding. Return `null` to opt a specific row out.
   */
  renderRowContextMenu?: (row: TData) => React.ReactNode
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
  columnSizingEnabled,
  columnLayoutSignature,
  rowMemoKey,
  renderRowContextMenu,
}: VirtualizedDndBodyRowProps<TData>) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  const rowElement = (
    <VirtualizedDraggableRow
      rowId={row.id}
      virtualIndex={virtualIndex}
      isSelected={isSelected}
      isExpanded={isExpanded}
      measureRef={measureRef}
      columnLayoutSignature={columnLayoutSignature}
      rowMemoKey={rowMemoKey}
      className="data-[context-menu-open]:bg-muted/50"
    >
      {visibleCells.map(cell => {
        const size = cell.column.columnDef.size
        const fixedWidth = columnSizingEnabled
          ? cell.column.getSize()
          : size
            ? `${size}px`
            : undefined
        const cellStyle = {
          width: fixedWidth,
          minHeight: `${estimateSize}px`,
          ...getCommonPinningStyles(cell.column, false),
        }

        return (
          <TableCell
            key={cell.id}
            data-col-id={cell.column.id}
            className={cn(
              fixedWidth != null ? "shrink-0" : "min-w-0 flex-1",
              "flex items-center truncate",
              isClickable && "cursor-pointer",
              cell.column.getIsPinned() &&
                "bg-background group-hover:bg-muted/50 group-data-[context-menu-open]:bg-muted/50 group-data-[state=selected]:bg-muted",
            )}
            style={cellStyle}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </VirtualizedDraggableRow>
  )

  // Only stand up the context-menu shell when the consumer returns items
  // for this row. `useSortable`'s ref merges through the trigger the same
  // as any other className/prop pass-through, so row measurement/drag is
  // unaffected by the extra wrapper.
  const menuItems = renderRowContextMenu?.(row.original as TData)

  return (
    <>
      {menuItems ? (
        <DataTableRowContextMenu
          row={row.original as TData}
          trigger={rowElement}
        >
          {menuItems}
        </DataTableRowContextMenu>
      ) : (
        rowElement
      )}

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
  /**
   * Attach a native right-click context menu to each row. Return the menu
   * items (`ContextMenuItem`, `ContextMenuSeparator`, `ContextMenuSub`, …)
   * for the given row, or `null` to give that row no menu. The popup shell
   * and portalling are handled internally.
   *
   * Wrap the callback in `useCallback` so memoized rows don't re-render.
   */
  renderRowContextMenu?: (row: TData) => React.ReactNode
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
  getRowMemoKey,
  renderRowContextMenu,
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

  // String signature of the visible column layout. Memoized rows compare it
  // to invalidate on column toggle / reorder / pin / resize. For external row
  // state (inline edits, optimistic overlays), pass `getRowMemoKey`.
  const { columnVisibility, columnOrder, columnPinning, columnSizing } =
    table.getState()
  const resizing = table.options.enableColumnResizing ?? false
  const columnLayoutSignature = React.useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .map(c => {
          const pinned = c.getIsPinned()
          const base = pinned ? `${c.id}:${pinned}` : c.id
          return resizing ? `${base}:${c.getSize()}` : base
        })
        .join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      table,
      columns,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      resizing,
    ],
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

  // Composable path: the per-row menu may come from the `renderRowContextMenu`
  // prop OR a nested `<DataTableRowContextMenuSlot>` child (prop wins).
  const resolvedRenderRowContextMenu = useResolvedRowContextMenuRenderer(
    renderRowContextMenu,
    children,
  )

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
              columnSizingEnabled={resizing}
              columnLayoutSignature={columnLayoutSignature}
              rowMemoKey={
                getRowMemoKey ? getRowMemoKey(row.original as TData) : ""
              }
              renderRowContextMenu={resolvedRenderRowContextMenu}
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
