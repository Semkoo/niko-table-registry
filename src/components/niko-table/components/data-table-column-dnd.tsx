"use client"

import {
  TableColumnDndProvider,
  type TableColumnDndProviderProps,
  TableDraggableHeader,
  type TableDraggableHeaderProps,
  TableDragAlongCell,
  type TableDragAlongCellProps,
} from "../filters/table-column-dnd"

// ============================================================================
// DataTableColumnDndProvider
// ============================================================================

export type DataTableColumnDndProviderProps = Omit<
  TableColumnDndProviderProps,
  never
>

/**
 * Context-aware column DnD provider that wraps children with drag-and-drop
 * column reordering capabilities.
 *
 * @example
 * <DataTableRoot
 *   data={data}
 *   columns={columns}
 *   state={{ columnOrder }}
 *   onColumnOrderChange={setColumnOrder}
 * >
 *   <DataTableColumnDndProvider
 *     columnOrder={columnOrder}
 *     onColumnOrderChange={setColumnOrder}
 *   >
 *     <DataTable>
 *       <DataTableDndHeader />
 *       <DataTableDndColumnBody />
 *     </DataTable>
 *   </DataTableColumnDndProvider>
 * </DataTableRoot>
 */
export function DataTableColumnDndProvider(
  props: DataTableColumnDndProviderProps,
) {
  return <TableColumnDndProvider {...props} />
}

DataTableColumnDndProvider.displayName = "DataTableColumnDndProvider"

// ============================================================================
// DataTableDraggableHeader
// ============================================================================

export type DataTableDraggableHeaderProps<TData, TValue> =
  TableDraggableHeaderProps<TData, TValue>

/**
 * Context-aware draggable header cell for column DnD.
 *
 * @example
 * <DataTableDraggableHeader header={header}>
 *   {flexRender(header.column.columnDef.header, header.getContext())}
 * </DataTableDraggableHeader>
 */
export function DataTableDraggableHeader<TData, TValue>(
  props: DataTableDraggableHeaderProps<TData, TValue>,
) {
  return <TableDraggableHeader<TData, TValue> {...props} />
}

DataTableDraggableHeader.displayName = "DataTableDraggableHeader"

// ============================================================================
// DataTableDragAlongCell
// ============================================================================

export type DataTableDragAlongCellProps<TData, TValue> =
  TableDragAlongCellProps<TData, TValue>

/**
 * Context-aware cell that follows column drag position.
 *
 * @example
 * <DataTableDragAlongCell cell={cell}>
 *   {flexRender(cell.column.columnDef.cell, cell.getContext())}
 * </DataTableDragAlongCell>
 */
export function DataTableDragAlongCell<TData, TValue>(
  props: DataTableDragAlongCellProps<TData, TValue>,
) {
  return <TableDragAlongCell<TData, TValue> {...props} />
}

DataTableDragAlongCell.displayName = "DataTableDragAlongCell"
