"use client"

import { useDataTable } from "../core"
import {
  TableRowDndProvider,
  type TableRowDndProviderProps,
  TableDraggableRow,
  type TableDraggableRowProps,
  TableRowDragHandle,
  type TableRowDragHandleProps,
} from "../filters/table-row-dnd"

// ============================================================================
// DataTableRowDndProvider
// ============================================================================

export type DataTableRowDndProviderProps<TData> = Omit<
  TableRowDndProviderProps<TData>,
  "table"
>

/**
 * Context-aware row DnD provider that automatically connects to the DataTable context.
 *
 * @example
 * <DataTableRoot data={data} columns={columns} getRowId={(row) => row.id}>
 *   <DataTableRowDndProvider data={data} onReorder={setData}>
 *     <DataTable>
 *       <DataTableHeader />
 *       <DataTableDndBody />
 *     </DataTable>
 *   </DataTableRowDndProvider>
 * </DataTableRoot>
 */
export function DataTableRowDndProvider<TData>(
  props: DataTableRowDndProviderProps<TData>,
) {
  const { table } = useDataTable<TData>()
  return <TableRowDndProvider<TData> table={table} {...props} />
}

DataTableRowDndProvider.displayName = "DataTableRowDndProvider"

// ============================================================================
// DataTableDraggableRow
// ============================================================================

export type DataTableDraggableRowProps<TData> = TableDraggableRowProps<TData>

/**
 * Context-aware draggable row component.
 *
 * @example
 * <DataTableDraggableRow row={row}>
 *   {row.getVisibleCells().map(cell => (
 *     <TableCell key={cell.id}>
 *       {flexRender(cell.column.columnDef.cell, cell.getContext())}
 *     </TableCell>
 *   ))}
 * </DataTableDraggableRow>
 */
export function DataTableDraggableRow<TData>(
  props: DataTableDraggableRowProps<TData>,
) {
  return <TableDraggableRow<TData> {...props} />
}

DataTableDraggableRow.displayName = "DataTableDraggableRow"

// ============================================================================
// DataTableRowDragHandle
// ============================================================================

export type DataTableRowDragHandleProps = TableRowDragHandleProps

/**
 * Context-aware row drag handle button.
 *
 * @example - In column definition
 * {
 *   id: "drag-handle",
 *   size: 40,
 *   header: () => null,
 *   cell: ({ row }) => <DataTableRowDragHandle rowId={row.id} />,
 * }
 */
export function DataTableRowDragHandle(props: DataTableRowDragHandleProps) {
  return <TableRowDragHandle {...props} />
}

DataTableRowDragHandle.displayName = "DataTableRowDragHandle"
