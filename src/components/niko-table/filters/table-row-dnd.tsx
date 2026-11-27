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
import React, { type CSSProperties } from "react"
import type { RowData } from "@tanstack/react-table"
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

import type { DataTableInstance, DataTableRow } from "../types"
// ============================================================================
// TableRowDndProvider
// ============================================================================

export interface TableRowDndProviderProps<TData extends RowData> {
  children: React.ReactNode
  /** The table instance */
  table: DataTableInstance<TData>
  /** The data array (needed for arrayMove reordering) */
  data: TData[]
  /**
   * Callback when rows are reordered. Receives the new data array and which
   * row id moved onto which.
   */
  onReorder: (
    data: TData[],
    move: { activeId: UniqueIdentifier; overId: UniqueIdentifier },
  ) => void
  /** DnD modifiers. Defaults to [restrictToVerticalAxis]. */
  modifiers?: Modifier[]
}

export function TableRowDndProvider<TData extends RowData>({
  children,
  table,
  data,
  onReorder,
  modifiers = [restrictToVerticalAxis],
}: TableRowDndProviderProps<TData>) {
  // Stable across SSR + hydration — see TableColumnDndProvider.
  const dndContextId = React.useId()

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
        onReorder(arrayMove(data, oldIndex, newIndex), {
          activeId: active.id,
          overId: over.id,
        })
      }
    },
    [dataIds, data, onReorder],
  )

  return (
    <DndContext
      id={dndContextId}
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

export interface TableDraggableRowProps<TData extends RowData> extends Omit<
  React.ComponentProps<typeof TableRow>,
  "children" | "ref"
> {
  /** The row instance from TanStack Table */
  row: DataTableRow<TData>
  /**
   * Position in the current display model (post sort/filter). Used for
   * `scrollRowIntoView` / `flashRows`. Defaults to TanStack source `row.index`
   * only when the caller omits it — prefer passing the map index.
   */
  displayIndex?: number
  children: React.ReactNode
  className?: string
  /** Merged with the sortable ref (a context-menu trigger passes one). */
  ref?: React.Ref<HTMLTableRowElement>
}

export function TableDraggableRow<TData extends RowData>({
  row,
  displayIndex = row.index,
  children,
  className,
  ref,
  // Props a `ContextMenuTrigger asChild` hands down (onContextMenu, style, ...).
  style: styleProp,
  ...rest
}: TableDraggableRowProps<TData>) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

  const setRefs = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      setNodeRef(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [setNodeRef, ref],
  )

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <TableRow
      {...rest}
      ref={setRefs}
      style={{ ...styleProp, ...style }}
      data-row-index={displayIndex}
      data-row-id={row.id}
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
