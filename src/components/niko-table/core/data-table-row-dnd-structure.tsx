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
import { TableRow, TableBody, TableCell } from "@/components/ui/table"
import { flexRender, type Row } from "@tanstack/react-table"
import { DataTableRowContextMenu } from "../components/data-table-row-context-menu"
import { useResolvedRowContextMenuRenderer } from "../components/data-table-row-context-menu-slot"
import { resolveRowFromClick } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import {
  TableDraggableRow,
  SortableContext,
  verticalListSortingStrategy,
  type UniqueIdentifier,
} from "../filters/table-row-dnd"

// ============================================================================
// DndBodyRow — memoized row
// ============================================================================

/**
 * Per-row component for `DataTableDndBody` (row-DnD). Memoized to keep a
 * single-row state change (selection toggle, expansion) from reconciling
 * every visible row.
 *
 * `TableDraggableRow` already manages its own `useSortable` state, so the
 * memoization here only guards against extrinsic re-renders triggered by
 * the parent body.
 */
interface DndBodyRowProps {
  row: Row<unknown>
  /** Position in the current display model (post sort/filter). */
  displayIndex: number
  expandColumnId: string | undefined
  isClickable: boolean
  isExpanded: boolean
  /** Selection state — read by `TableDraggableRow` internally; prop exists to invalidate React.memo. */
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

const DndBodyRow = React.memo(function DndBodyRow({
  row,
  displayIndex,
  expandColumnId,
  isClickable,
  isExpanded,
  columnSizingEnabled,
  renderRowContextMenu,
}: DndBodyRowProps) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  const rowElement = (
    <TableDraggableRow
      row={row}
      displayIndex={displayIndex}
      className="group data-[context-menu-open]:bg-muted/50"
    >
      {visibleCells.map(cell => {
        const size = cell.column.columnDef.size
        // Flex column: no explicit width so it fills the leftover row width.
        const isFlex = cell.column.columnDef.meta?.flex === true
        const cellStyle = {
          // Resizing: width tracks `getSize()`; off: unchanged.
          // Flex: no width — fills the leftover space.
          width: isFlex
            ? undefined
            : columnSizingEnabled
              ? cell.column.getSize()
              : size
                ? `${size}px`
                : undefined,
          ...getCommonPinningStyles(cell.column, false),
        }

        return (
          <TableCell
            key={cell.id}
            data-col-id={cell.column.id}
            style={cellStyle}
            className={cn(
              "truncate",
              isClickable && "cursor-pointer",
              cell.column.getIsPinned() &&
                "bg-background group-hover:bg-muted/50 group-data-[context-menu-open]:bg-muted/50 group-data-[state=selected]:bg-muted",
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableDraggableRow>
  )

  // Only stand up the context-menu shell when the consumer supplies items
  // for this row — a `null` return keeps the plain draggable row.
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

DndBodyRow.displayName = "DndBodyRow"

// ============================================================================
// DataTableDndBody (Row DnD)
// ============================================================================

export interface DataTableDndBodyProps<TData> {
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
 * DnD-aware table body that renders rows as draggable items.
 * Drop-in replacement for DataTableBody when using row drag-and-drop.
 *
 * Must be wrapped in a DataTableRowDndProvider (or TableRowDndProvider).
 *
 * @example
 * <DataTableRowDndProvider data={data} onReorder={setData}>
 *   <DataTable>
 *     <DataTableHeader />
 *     <DataTableDndBody />
 *   </DataTable>
 * </DataTableRowDndProvider>
 */
export function DataTableDndBody<TData>({
  children,
  className,
  onRowClick,
  getRowMemoKey,
  renderRowContextMenu,
}: DataTableDndBodyProps<TData>) {
  const { table, columns, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()
  const containerRef = React.useRef<HTMLTableSectionElement>(null)

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.id),
    [rows],
  )

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

  // Hoisted: per-row find was O(rows × cols) per render despite stable column set.
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
  // `DataTableBody`) so `w-full` cannot compress columns while dragging.
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
    const leafColumns = table.getVisibleLeafColumns()
    const totalDesiredWidth = leafColumns.reduce(
      (sum, col) => sum + col.getSize(),
      0,
    )
    // A flex column has no fixed width, so the table must stretch to the
    // container (width 100%) and let that column soak up the surplus; the sized
    // columns still can't compress below their sum (minWidth).
    const hasFlex = leafColumns.some(c => c.columnDef.meta?.flex === true)
    tableEl.style.tableLayout = "fixed"
    tableEl.style.width = hasFlex ? "100%" : `${totalDesiredWidth}px`
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
      {!isLoading && rows?.length ? (
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {rows.map((row, displayIndex) => (
            <DndBodyRow
              key={row.id}
              row={row as Row<unknown>}
              displayIndex={displayIndex}
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
          ))}
        </SortableContext>
      ) : null}

      {children}
    </TableBody>
  )
}

DataTableDndBody.displayName = "DataTableDndBody"
