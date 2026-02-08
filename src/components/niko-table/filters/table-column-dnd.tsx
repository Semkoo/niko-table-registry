"use client"

import React, { type CSSProperties } from "react"
import type { Header, Cell } from "@tanstack/react-table"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type Modifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { TableHead, TableCell as TableCellUI } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ============================================================================
// TableColumnDndProvider
// ============================================================================

export interface TableColumnDndProviderProps {
  children: React.ReactNode
  /** The current column order (array of column IDs) */
  columnOrder: string[]
  /** Callback when columns are reordered. Receives the new column order. */
  onColumnOrderChange: (columnOrder: string[]) => void
  /** DnD modifiers. Defaults to [restrictToHorizontalAxis]. */
  modifiers?: Modifier[]
}

export function TableColumnDndProvider({
  children,
  columnOrder,
  onColumnOrderChange,
  modifiers = [restrictToHorizontalAxis],
}: TableColumnDndProviderProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (active && over && active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
      }
    },
    [columnOrder, onColumnOrderChange],
  )

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}

TableColumnDndProvider.displayName = "TableColumnDndProvider"

// ============================================================================
// TableDraggableHeader
// ============================================================================

export interface TableDraggableHeaderProps<TData, TValue> {
  /** The header instance from TanStack Table */
  header: Header<TData, TValue>
  children: React.ReactNode
  className?: string
}

export function TableDraggableHeader<TData, TValue>({
  header,
  children,
  className,
}: TableDraggableHeaderProps<TData, TValue>) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    cursor: "grab",
  }

  return (
    <TableHead
      colSpan={header.colSpan}
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "bg-muted/50", className)}
      {...attributes}
      {...listeners}
    >
      {children}
    </TableHead>
  )
}

TableDraggableHeader.displayName = "TableDraggableHeader"

// ============================================================================
// TableDragAlongCell
// ============================================================================

export interface TableDragAlongCellProps<TData, TValue> {
  /** The cell instance from TanStack Table */
  cell: Cell<TData, TValue>
  children: React.ReactNode
  className?: string
}

export function TableDragAlongCell<TData, TValue>({
  cell,
  children,
  className,
}: TableDragAlongCellProps<TData, TValue>) {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <TableCellUI style={style} ref={setNodeRef} className={className}>
      {children}
    </TableCellUI>
  )
}

TableDragAlongCell.displayName = "TableDragAlongCell"
