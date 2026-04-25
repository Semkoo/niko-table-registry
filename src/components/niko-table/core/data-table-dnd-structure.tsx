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
import { resolveRowFromClick } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import {
  TableDraggableRow,
  SortableContext,
  verticalListSortingStrategy,
  type UniqueIdentifier,
} from "../filters/table-row-dnd"
import {
  TableDraggableHeader,
  TableDragAlongCell,
} from "../filters/table-column-dnd"

// ============================================================================
// DndBodyRow / DndColumnBodyRow — memoized rows
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
  expandColumnId: string | undefined
  isClickable: boolean
  isExpanded: boolean
  /** Selection state — read by `TableDraggableRow` internally; prop exists to invalidate React.memo. */
  isSelected: boolean
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
}

const DndBodyRow = React.memo(function DndBodyRow({
  row,
  expandColumnId,
  isClickable,
  isExpanded,
}: DndBodyRowProps) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  return (
    <>
      <TableDraggableRow row={row}>
        {visibleCells.map(cell => {
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
                isClickable && "cursor-pointer",
                cell.column.getIsPinned() &&
                  "bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </TableDraggableRow>

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
  /** Column layout signature — invalidates React.memo on visibility/order/pinning change. */
  columnLayoutSignature: string
}

const DndColumnBodyRow = React.memo(function DndColumnBodyRow({
  row,
  expandColumnId,
  isClickable,
  isExpanded,
  isSelected,
}: DndColumnBodyRowProps) {
  const expandCell =
    isExpanded && expandColumnId
      ? row.getAllCells().find(c => c.column.id === expandColumnId)
      : undefined

  const visibleCells = row.getVisibleCells()

  return (
    <>
      <TableRow
        data-row-id={row.id}
        data-state={isSelected ? "selected" : undefined}
        className={cn(isClickable && "cursor-pointer", "group")}
      >
        {visibleCells.map(cell => (
          <TableDragAlongCell key={cell.id} cell={cell}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableDragAlongCell>
        ))}
      </TableRow>

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
}: DataTableDndBodyProps<TData>) {
  const { table, columns, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()

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
    [table, columns],
  )

  const isClickable = !!onRowClick

  return (
    <TableBody
      className={className}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {!isLoading && rows?.length ? (
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {rows.map(row => (
            <DndBodyRow
              key={row.id}
              row={row as Row<unknown>}
              expandColumnId={expandColumnId}
              isClickable={isClickable}
              isExpanded={row.getIsExpanded()}
              isSelected={row.getIsSelected()}
              columnLayoutSignature={columnLayoutSignature}
            />
          ))}
        </SortableContext>
      ) : null}

      {children}
    </TableBody>
  )
}

DataTableDndBody.displayName = "DataTableDndBody"

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
          {headerGroup.headers.map(header => (
            <TableDraggableHeader key={header.id} header={header}>
              {header.isPlaceholder ? null : (
                <DataTableColumnHeaderRoot column={header.column}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </DataTableColumnHeaderRoot>
              )}
            </TableDraggableHeader>
          ))}
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
}: DataTableDndColumnBodyProps<TData>) {
  const { table, columns, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()

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
    [table, columns],
  )

  const isClickable = !!onRowClick

  return (
    <TableBody
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
              columnLayoutSignature={columnLayoutSignature}
            />
          ))
        : null}

      {children}
    </TableBody>
  )
}

DataTableDndColumnBody.displayName = "DataTableDndColumnBody"
