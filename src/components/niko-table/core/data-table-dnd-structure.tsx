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
import { flexRender } from "@tanstack/react-table"
import { DataTableColumnHeaderRoot } from "../components/data-table-column-header"
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
  const { table, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.id),
    [rows],
  )

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      const rowElement = target.closest("tr[data-row-id]")
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

      // Resolve via stable `row.id` rather than a positional index —
      // sort/filter/reorder leave indices unstable but ids are
      // canonical. `table.getRow` is a Map lookup internally so this
      // stays O(1).
      const rowId = rowElement.getAttribute("data-row-id")
      if (rowId === null) return
      const row = table.getRow(rowId)
      if (!row) return
      onRowClick(row.original, event)
    },
    [onRowClick, table],
  )

  /**
   * Resolve the expand column once at the table level. Previously
   * `getAllCells().find(...)` ran inside the row map — O(rows × cols)
   * per render even though the expand column is stable for the
   * lifetime of the column set.
   */
  const expandColumnId = React.useMemo(
    () =>
      table.getAllColumns().find(col => col.columnDef.meta?.expandedContent)
        ?.id,
    [table],
  )

  return (
    <TableBody
      className={className}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {!isLoading && rows?.length ? (
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {rows.map(row => {
            const isClickable = !!onRowClick
            const isExpanded = row.getIsExpanded()

            // Resolve the expand cell only when expanded, using the
            // memoized `expandColumnId` (computed once at the table
            // level above this map).
            const expandCell =
              isExpanded && expandColumnId
                ? row.getAllCells().find(c => c.column.id === expandColumnId)
                : undefined

            return (
              <React.Fragment key={row.id}>
                <TableDraggableRow row={row}>
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
                          isClickable && "cursor-pointer",
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
                </TableDraggableRow>

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
          })}
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
  const { table, isLoading } = useDataTable<TData>()
  const { rows } = table.getRowModel()

  /** Single row-click handler with event delegation (useCallback). */
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableSectionElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      const rowElement = target.closest("tr[data-row-id]")
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

      // Resolve via stable `row.id` rather than a positional index —
      // sort/filter/reorder leave indices unstable but ids are
      // canonical. `table.getRow` is a Map lookup internally so this
      // stays O(1).
      const rowId = rowElement.getAttribute("data-row-id")
      if (rowId === null) return
      const row = table.getRow(rowId)
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
    [table],
  )

  return (
    <TableBody
      className={className}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {!isLoading && rows?.length
        ? rows.map(row => {
            const isClickable = !!onRowClick
            const isExpanded = row.getIsExpanded()

            const expandCell =
              isExpanded && expandColumnId
                ? row.getAllCells().find(c => c.column.id === expandColumnId)
                : undefined

            return (
              <React.Fragment key={row.id}>
                <TableRow
                  data-row-id={row?.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(isClickable && "cursor-pointer", "group")}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableDragAlongCell key={cell.id} cell={cell}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableDragAlongCell>
                  ))}
                </TableRow>

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

DataTableDndColumnBody.displayName = "DataTableDndColumnBody"
