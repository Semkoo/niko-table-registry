"use client"

import React, { type CSSProperties } from "react"
import type { Table, Row } from "@tanstack/react-table"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================================
// TableRowDndProvider
// ============================================================================

export interface TableRowDndProviderProps<TData> {
  children: React.ReactNode
  /** The table instance */
  table: Table<TData>
  /** The data array (needed for arrayMove reordering) */
  data: TData[]
  /** Callback when rows are reordered. Receives the new data array. */
  onReorder: (data: TData[]) => void
  /** DnD modifiers. Defaults to [restrictToVerticalAxis]. */
  modifiers?: Modifier[]
}

export function TableRowDndProvider<TData>({
  children,
  table,
  data,
  onReorder,
  modifiers = [restrictToVerticalAxis],
}: TableRowDndProviderProps<TData>) {
  const rows = table.getRowModel().rows
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.id),
    [rows],
  )

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (active && over && active.id !== over.id) {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        onReorder(arrayMove(data, oldIndex, newIndex))
      }
    },
    [dataIds, data, onReorder],
  )

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      {children}
    </DndContext>
  )
}

TableRowDndProvider.displayName = "TableRowDndProvider"

// ============================================================================
// TableDraggableRow
// ============================================================================

export interface TableDraggableRowProps<TData> {
  /** The row instance from TanStack Table */
  row: Row<TData>
  children: React.ReactNode
  className?: string
}

export function TableDraggableRow<TData>({
  row,
  children,
  className,
}: TableDraggableRowProps<TData>) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className={cn(isDragging && "bg-muted/50", className)}
    >
      {children}
    </TableRow>
  )
}

TableDraggableRow.displayName = "TableDraggableRow"

// ============================================================================
// TableRowDragHandle
// ============================================================================

export interface TableRowDragHandleProps {
  /** The row ID used for sortable identification */
  rowId: string
  className?: string
}

export function TableRowDragHandle({
  rowId,
  className,
}: TableRowDragHandleProps) {
  const { attributes, listeners } = useSortable({
    id: rowId,
  })

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8 cursor-grab active:cursor-grabbing", className)}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

TableRowDragHandle.displayName = "TableRowDragHandle"

// Re-export for use in DataTableDndBody
export { SortableContext, verticalListSortingStrategy }
export type { UniqueIdentifier }
