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
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { flexRender, type Row } from "@tanstack/react-table"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
import { DataTableColumnResizeHandle } from "../lib/column-resize-handle"
import { DataTableRowContextMenu } from "../components/data-table-row-context-menu"
import { useResolvedRowContextMenuRenderer } from "../components/data-table-row-context-menu-slot"
import { resolveRowFromClick } from "../lib/row-click"
import {
  TableDraggableHeader,
  TableDragAlongCell,
} from "../filters/table-column-dnd"

// ============================================================================
// DndColumnBodyRow — memoized row
// ============================================================================

/**
 * Per-row component for `DataTableDndColumnBody` (column-DnD). Memoized
 * to avoid cascading reconciliation across all visible rows on selection
 * or expansion changes. `TableDragAlongCell` handles per-cell drag state
 * internally, so cell-level memoization isn't required here.
 */
interface DndColumnBodyRowProps {
  row: Row<unknown>
  expandColumnId: string | undefined
  isClickable: boolean
  isExpanded: boolean
  isSelected: boolean
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
   * Right-click menu items for this row. Must be a stable callback (wrap in
   * `useCallback`) so `React.memo` keeps holding. Return `null` to opt a
   * specific row out of having a menu.
   */
  renderRowContextMenu?: (row: unknown) => React.ReactNode
}

const DndColumnBodyRow = React.memo(function DndColumnBodyRow({
  row,
  expandColumnId,
  isClickable,
  isExpanded,
  isSelected,
  columnSizingEnabled,
  renderRowContextMenu,
}: DndColumnBodyRowProps) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  const rowElement = (
    <TableRow
      data-row-id={row.id}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        isClickable && "cursor-pointer",
        "group data-[context-menu-open]:bg-muted/50",
      )}
    >
      {visibleCells.map(cell => {
        const size = cell.column.columnDef.size
        const cellStyle = {
          // Resizing: width tracks `getSize()`; off: unchanged.
          width: columnSizingEnabled
            ? cell.column.getSize()
            : size
              ? `${size}px`
              : undefined,
        }

        return (
          <TableDragAlongCell
            key={cell.id}
            cell={cell}
            style={cellStyle}
            className={cn(
              "truncate",
              cell.column.getIsPinned() &&
                "bg-background group-hover:bg-muted/50 group-data-[context-menu-open]:bg-muted/50 group-data-[state=selected]:bg-muted",
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableDragAlongCell>
        )
      })}
    </TableRow>
  )

  // Only stand up the context-menu shell when the consumer supplies items
  // for this row — a `null` return keeps the plain row.
  const menuItems = renderRowContextMenu?.(row.original)

  return (
    <>
      {menuItems ? (
        <DataTableRowContextMenu row={row.original} trigger={rowElement}>
          {menuItems}
        </DataTableRowContextMenu>
      ) : (
        rowElement
      )}

      {expandCell && (
        <TableRow>
          <TableCell colSpan={visibleCells.length} className="p-0">
            {expandCell.column.columnDef.meta?.expandedContent?.(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
})

DndColumnBodyRow.displayName = "DndColumnBodyRow"

// ============================================================================
// DataTableDndHeader (Column DnD)
// ============================================================================

export interface DataTableDndHeaderProps {
  className?: string
  /**
   * Makes the header sticky at the top when scrolling.
   * @default true
   */
  sticky?: boolean
}

/**
 * DnD-aware table header that renders column headers as draggable items.
 * Drop-in replacement for DataTableHeader when using column drag-and-drop.
 *
 * Must be wrapped in a DataTableColumnDndProvider (or TableColumnDndProvider).
 *
 * @example
 * <DataTableColumnDndProvider columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}>
 *   <DataTable>
 *     <DataTableDndHeader />
 *     <DataTableDndColumnBody />
 *   </DataTable>
 * </DataTableColumnDndProvider>
 */
export const DataTableDndHeader = React.memo(function DataTableDndHeader({
  className,
  sticky = true,
}: DataTableDndHeaderProps) {
  const { table } = useDataTable()
  const resizing = table?.options.enableColumnResizing ?? false

  const headerGroups = table?.getHeaderGroups() ?? []

  if (headerGroups.length === 0) {
    return null
  }

  return (
    <TableHeader
      className={cn(
        sticky && "sticky top-0 z-30 bg-background",
        sticky &&
          "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-border",
        className,
      )}
    >
      {headerGroups.map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const size = header.column.columnDef.size
            return (
              <TableDraggableHeader
                key={header.id}
                header={header}
                style={{
                  width: resizing
                    ? header.getSize()
                    : size
                      ? `${size}px`
                      : undefined,
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
                {resizing && header.column.getCanResize() && (
                  <DataTableColumnResizeHandle header={header} />
                )}
              </TableDraggableHeader>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
})

DataTableDndHeader.displayName = "DataTableDndHeader"

// ============================================================================
// DataTableDndColumnBody (Column DnD)
// ============================================================================

export interface DataTableDndColumnBodyProps<TData> {
  children?: React.ReactNode
  className?: string
  /**
   * Click is delegated on `<tbody>`. The event's `currentTarget`
   * is therefore the `<tbody>` — typed as `HTMLElement` to stay
   * consistent with the virtualized variants. Consumers needing
   * the row element can `event.target.closest("tr[data-row-id]")`.
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
 * DnD-aware table body for column drag-and-drop.
 * Each cell is wrapped with useSortable to follow column drag position.
 *
 * Must be wrapped in a DataTableColumnDndProvider (or TableColumnDndProvider).
 *
 * @example
 * <DataTableColumnDndProvider columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}>
 *   <DataTable>
 *     <DataTableDndHeader />
 *     <DataTableDndColumnBody />
 *   </DataTable>
 * </DataTableColumnDndProvider>
 */
export function DataTableDndColumnBody<TData>({
  children,
  className,
  onRowClick,
  getRowMemoKey,
  renderRowContextMenu,
}: DataTableDndColumnBodyProps<TData>) {
  const { table, columns, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()
  const containerRef = React.useRef<HTMLTableSectionElement>(null)

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const row = resolveRowFromClick(event.target as HTMLElement, table)
      if (!row) return
      onRowClick(row.original, event)
    },
    [onRowClick, table],
  )

  // Resolve the expand column once at the table level (see comment
  // on the equivalent memo in `DataTableDndBody` above).
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    // `columns` keeps the memo in sync when consumers swap column sets —
    // `table` alone is too stable (TanStack reuses the same instance).
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

  const isClickable = !!onRowClick

  // Composable path: the per-row menu may come from the `renderRowContextMenu`
  // prop OR a nested `<DataTableRowContextMenuSlot>` child (prop wins).
  const resolvedRenderRowContextMenu = useResolvedRowContextMenuRenderer(
    renderRowContextMenu,
    children,
  )

  // Capture / restore table inline sizing when resize turns on (same as
  // `DataTableDndBody`) so `w-full` cannot compress columns while dragging.
  const tableStyleSnapshotRef = React.useRef<{
    tableLayout: string
    width: string
    minWidth: string
  } | null>(null)

  React.useLayoutEffect(() => {
    const tableEl = containerRef.current?.closest<HTMLTableElement>(
      '[data-slot="table"]',
    )
    if (!tableEl) return

    const restore = () => {
      const snap = tableStyleSnapshotRef.current
      if (!snap) return
      tableEl.style.tableLayout = snap.tableLayout
      tableEl.style.width = snap.width
      tableEl.style.minWidth = snap.minWidth
      tableStyleSnapshotRef.current = null
    }

    if (!resizing) {
      restore()
      return
    }

    if (!tableStyleSnapshotRef.current) {
      tableStyleSnapshotRef.current = {
        tableLayout: tableEl.style.tableLayout,
        width: tableEl.style.width,
        minWidth: tableEl.style.minWidth,
      }
    }
    const totalDesiredWidth = table
      .getVisibleLeafColumns()
      .reduce((sum, col) => sum + col.getSize(), 0)
    tableEl.style.tableLayout = "fixed"
    tableEl.style.width = `${totalDesiredWidth}px`
    tableEl.style.minWidth = `${totalDesiredWidth}px`
    return restore
  }, [
    resizing,
    table,
    columnSizing,
    columnVisibility,
    columnOrder,
    columnPinning,
  ])

  return (
    <TableBody
      ref={containerRef}
      className={className}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {!isLoading && rows?.length
        ? rows.map(row => (
            <DndColumnBodyRow
              key={row.id}
              row={row as Row<unknown>}
              expandColumnId={expandColumnId}
              isClickable={isClickable}
              isExpanded={row.getIsExpanded()}
              isSelected={row.getIsSelected()}
              columnSizingEnabled={resizing}
              columnLayoutSignature={columnLayoutSignature}
              rowMemoKey={
                getRowMemoKey ? getRowMemoKey(row.original as TData) : ""
              }
              renderRowContextMenu={
                resolvedRenderRowContextMenu as
                  ((row: unknown) => React.ReactNode) | undefined
              }
            />
          ))
        : null}

      {children}
    </TableBody>
  )
}

DataTableDndColumnBody.displayName = "DataTableDndColumnBody"
