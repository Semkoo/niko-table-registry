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
 * A dropdown menu component that allows users to toggle the visibility of table columns.
 * It uses a popover to display a list of columns with checkboxes.
 * Users can search for columns and toggle their visibility.
 *
 * Three opt-in extensions:
 *   - `lockedColumnIds`: include columns marked `enableHiding: false` in the
 *     list, but render them disabled (always-on, can't toggle).
 *   - `enableReorder` + `columnOrder` + `onColumnOrderChange`: each row gets a
 *     drag handle and the list becomes vertically sortable via dnd-kit.
 *   - `onReset` + `resetLabel`: render a Reset button below a separator.
 */

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Column, Table } from "@tanstack/react-table"
import {
  Check,
  ChevronsUpDown,
  GripVertical,
  RotateCcw,
  Settings2,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatLabel } from "../lib/format"

/**
 * Derives the display title for a column.
 * Priority: column.meta.label > formatted column.id
 */
function getColumnTitle<TData>(column: Column<TData, unknown>): string {
  return column.columnDef.meta?.label ?? formatLabel(column.id)
}

export interface TableViewMenuProps<TData> {
  table: Table<TData>
  className?: string
  onColumnVisibilityChange?: (columnId: string, isVisible: boolean) => void
  /**
   * Column ids that should appear in the menu but cannot be toggled off.
   * Useful for columns the table marks `enableHiding: false` but the
   * consumer still wants visible in the column list (typically with a
   * Reset to Defaults affordance below).
   */
  lockedColumnIds?: string[]
  /**
   * When true, each row gets a drag handle and the list becomes sortable
   * via dnd-kit. Requires `columnOrder` and `onColumnOrderChange` to
   * control the underlying table state.
   */
  enableReorder?: boolean
  /** Controlled column order. The menu displays rows in this order. */
  columnOrder?: string[]
  /** Called when the user drops a row in a new position. */
  onColumnOrderChange?: (next: string[]) => void
  /**
   * When provided, renders a Reset button at the bottom of the menu.
   * Useful when paired with persisted column preferences so users can
   * revert to defaults.
   */
  onReset?: () => void
  /** Label for the reset button. Defaults to "Reset to defaults". */
  resetLabel?: string
}

function SortableMenuRow({
  id,
  disabled = false,
  children,
}: {
  id: string
  disabled?: boolean
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : 0,
  }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        type="button"
        disabled={disabled}
        aria-label="Reorder column"
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center rounded-sm px-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function TableViewMenu<TData>({
  table,
  onColumnVisibilityChange,
  lockedColumnIds,
  enableReorder = false,
  columnOrder,
  onColumnOrderChange,
  onReset,
  resetLabel,
}: TableViewMenuProps<TData>) {
  /**
   * PERFORMANCE: Memoize filtered columns to avoid recalculating on every render
   *
   * WHY: `getAllColumns().filter()` iterates through all columns and checks properties.
   * Without memoization, this runs on every render, even when columns haven't changed.
   *
   * Locked columns (passed via `lockedColumnIds`) are included even when
   * `column.getCanHide()` is false — they appear with a disabled toggle so
   * the consumer can surface required columns in the list without making
   * them togglable.
   */
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          column =>
            typeof column.accessorFn !== "undefined" &&
            (column.getCanHide() ||
              lockedColumnIds?.includes(column.id) === true),
        ),
    // Depend on the column set, not just the (stable) table ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, table.options.columns, lockedColumnIds],
  )

  /**
   * When `enableReorder` is active with a controlled `columnOrder`, sort
   * the menu rows by that order so drag end yields visually-consistent
   * positions. Fall back to the table's natural column order otherwise.
   */
  const orderedColumns = React.useMemo(() => {
    if (!enableReorder || !columnOrder) return columns
    const orderIndex = new Map(columnOrder.map((id, i) => [id, i]))
    return [...columns].sort(
      (a, b) =>
        (orderIndex.get(a.id) ?? Infinity) - (orderIndex.get(b.id) ?? Infinity),
    )
  }, [columns, columnOrder, enableReorder])

  /**
   * Partial `columnOrder` lists are common — consumers may control sort
   * for only a subset of columns. Restrict drag affordances to ids that
   * actually appear in `columnOrder`; rows omitted from it stay visible
   * but render without a handle so users aren't offered a no-op drag.
   */
  const draggableIds = React.useMemo(() => {
    if (!enableReorder || !columnOrder) return undefined
    const visibleIds = new Set(columns.map(c => c.id))
    return columnOrder.filter(id => visibleIds.has(id))
  }, [columns, columnOrder, enableReorder])

  // 8px drag threshold so clicks on the row chrome land as clicks, not
  // drag starts. Matches the column-header DnD primitive convention.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (
        !over ||
        active.id === over.id ||
        !columnOrder ||
        !onColumnOrderChange
      ) {
        return
      }
      const oldIndex = columnOrder.indexOf(String(active.id))
      const newIndex = columnOrder.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
    },
    [columnOrder, onColumnOrderChange],
  )

  const renderItem = (column: Column<TData, unknown>) => {
    const isLocked = lockedColumnIds?.includes(column.id) === true
    return (
      <CommandItem
        key={column.id}
        data-disabled={isLocked ? "" : undefined}
        onSelect={() => {
          if (isLocked) return
          const newVisibility = !column.getIsVisible()
          column.toggleVisibility(newVisibility)
          onColumnVisibilityChange?.(column.id, newVisibility)
        }}
      >
        <span className={cn("truncate", isLocked && "text-muted-foreground")}>
          {getColumnTitle(column)}
        </span>
        <Check
          className={cn(
            "ml-auto size-4 shrink-0",
            isLocked
              ? "opacity-50"
              : column.getIsVisible()
                ? "opacity-100"
                : "opacity-0",
          )}
        />
      </CommandItem>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
          View
          <ChevronsUpDown className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {enableReorder && draggableIds && onColumnOrderChange ? (
                <DndContext
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={draggableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedColumns.map(column =>
                      draggableIds.includes(column.id) ? (
                        <SortableMenuRow key={column.id} id={column.id}>
                          {renderItem(column)}
                        </SortableMenuRow>
                      ) : (
                        <React.Fragment key={column.id}>
                          {renderItem(column)}
                        </React.Fragment>
                      ),
                    )}
                  </SortableContext>
                </DndContext>
              ) : (
                orderedColumns.map(renderItem)
              )}
            </CommandGroup>
          </CommandList>
          {onReset ? (
            <>
              <div className="border-t" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-none text-muted-foreground"
                onClick={onReset}
              >
                <RotateCcw className="size-4" />
                {resetLabel ?? "Reset to defaults"}
              </Button>
            </>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableViewMenu.displayName = "TableViewMenu"
