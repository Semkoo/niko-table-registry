"use client"

/**
 * Table sort menu component
 * @description A sort menu component for DataTable that allows users to manage multiple sorting criteria. Users can add, remove, and reorder sorting fields, as well as select sort directions.
 * @inspiration Inspired by and adapted from sadmann7's work - https://github.com/sadmann7/tablecn/blob/main/src/components/data-table/data-table-sort-list.tsx
 */

import type { ColumnSort, SortDirection, Table } from "@tanstack/react-table"
import { ArrowDownUp, Trash2 } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable"
import { useKeyboardShortcut } from "../hooks"
import { cn } from "@/lib/utils"
import { ChevronsUpDown, Grip } from "lucide-react"

// Import sort labels from TableColumnHeader for consistency
import { SORT_LABELS, type SortIconVariant } from "../config/data-table"

interface TableSortItemProps {
  sort: ColumnSort
  sortItemId: string
  columns: { id: string; label: string }[]
  columnLabels: Map<string, string>
  onSortUpdate: (sortId: string, updates: Partial<ColumnSort>) => void
  onSortRemove: (sortId: string) => void
  className?: string
}

function TableSortItem({
  sort,
  sortItemId,
  columns,
  columnLabels,
  onSortUpdate,
  onSortRemove,
}: TableSortItemProps) {
  const fieldListboxId = `${sortItemId}-field-listbox`
  const fieldTriggerId = `${sortItemId}-field-trigger`
  const directionListboxId = `${sortItemId}-direction-listbox`

  const [showFieldSelector, setShowFieldSelector] = React.useState(false)
  const [showDirectionSelector, setShowDirectionSelector] =
    React.useState(false)

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (showFieldSelector || showDirectionSelector) {
        return
      }

      if (["backspace", "delete"].includes(event.key.toLowerCase())) {
        event.preventDefault()
        onSortRemove(sort.id)
      }
    },
    [sort.id, showFieldSelector, showDirectionSelector, onSortRemove],
  )

  // Try to get the column's variant for sort label
  // This assumes the table instance is available in closure (from parent TableSortMenu)
  let variant: SortIconVariant = "text"
  try {
    // @ts-expect-error: Accessing global window property for table instance variant detection
    const col = (window.__tableSortMenuTable || null)
      ?.getAllColumns?.()
      .find?.((c: { id: string }) => c.id === sort.id)
    if (col?.columnDef?.meta?.variant === "number") variant = "number"
    else if (col?.columnDef?.meta?.variant === "date") variant = "date"
    else if (col?.columnDef?.meta?.variant === "boolean") variant = "boolean"
  } catch {
    // ignore
  }

  const labels = SORT_LABELS[variant]

  return (
    <SortableItem value={sort.id} asChild>
      <li
        id={sortItemId}
        tabIndex={-1}
        className="flex items-center gap-2"
        onKeyDown={onItemKeyDown}
      >
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              id={fieldTriggerId}
              aria-controls={fieldListboxId}
              variant="outline"
              size="sm"
              className="w-44 justify-between rounded font-normal"
            >
              <span className="truncate">{columnLabels.get(sort.id)}</span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={fieldListboxId}
            className="w-(--radix-popover-trigger-width) origin-(--radix-popover-content-transform-origin) p-0"
          >
            <Command>
              <CommandInput placeholder="Search fields..." />
              <CommandList>
                <CommandEmpty>No fields found.</CommandEmpty>
                <CommandGroup>
                  {columns.map(column => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={value => onSortUpdate(sort.id, { id: value })}
                    >
                      <span className="truncate">{column.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showDirectionSelector}
          onOpenChange={setShowDirectionSelector}
          value={sort.desc ? "desc" : "asc"}
          onValueChange={(value: SortDirection) =>
            onSortUpdate(sort.id, { desc: value === "desc" })
          }
        >
          <SelectTrigger
            aria-controls={directionListboxId}
            className="h-8 w-24 rounded data-size:h-8"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            id={directionListboxId}
            className="min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin)"
          >
            <SelectItem value="asc">{labels.asc}</SelectItem>
            <SelectItem value="desc">{labels.desc}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          aria-controls={sortItemId}
          variant="outline"
          size="icon"
          className="size-8 shrink-0 rounded"
          onClick={() => onSortRemove(sort.id)}
        >
          <Trash2 />
        </Button>
        <SortableItemHandle asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded"
          >
            <Grip />
          </Button>
        </SortableItemHandle>
      </li>
    </SortableItem>
  )
}

export interface TableSortMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>
  debounceMs?: number
  throttleMs?: number
  shallow?: boolean
  className?: string
  /**
   * Callback fired when sorting state changes
   * Useful for server-side sorting or external state management
   */
  onSortingChange?: (sorting: ColumnSort[]) => void
}

export function TableSortMenu<TData>({
  table,
  onSortingChange: externalOnSortingChange,
  className,
  ...props
}: TableSortMenuProps<TData>) {
  // Expose table instance globally for TableSortItem variant detection
  // (This is a workaround for passing table to deeply nested TableSortItem)
  // @ts-expect-error: Assigning table instance to window for deep sort label access
  // eslint-disable-next-line react-hooks/immutability
  if (typeof window !== "undefined") window.__tableSortMenuTable = table
  // ============================================================================
  // State & Refs
  // ============================================================================
  const id = React.useId()
  const labelId = React.useId()
  const descriptionId = React.useId()
  const [open, setOpen] = React.useState(false)
  const addButtonRef = React.useRef<HTMLButtonElement>(null)

  const sorting = table.getState().sorting

  // ============================================================================
  // Sorting State Management
  // ============================================================================
  const onSortingChange = React.useCallback(
    (updater: React.SetStateAction<ColumnSort[]>) => {
      table.setSorting(updater)
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater
      externalOnSortingChange?.(newSorting)
    },
    [table, sorting, externalOnSortingChange],
  )

  // ============================================================================
  // Column Labels & Available Columns
  // ============================================================================
  const { columnLabels, columns } = React.useMemo(() => {
    const labels = new Map<string, string>()
    const sortingIds = new Set(sorting.map(s => s.id))
    const availableColumns: { id: string; label: string }[] = []

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue

      const label = column.columnDef.meta?.label ?? column.id
      labels.set(column.id, label)

      if (!sortingIds.has(column.id)) {
        availableColumns.push({ id: column.id, label })
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
    }
  }, [sorting, table])

  // ============================================================================
  // Sort Actions
  // ============================================================================
  const onSortAdd = React.useCallback(() => {
    const firstColumn = columns[0]
    if (!firstColumn) return

    onSortingChange(prevSorting => [
      ...prevSorting,
      { id: firstColumn.id, desc: false },
    ])
  }, [columns, onSortingChange])

  const onSortUpdate = React.useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      onSortingChange(prevSorting => {
        if (!prevSorting) return prevSorting
        return prevSorting.map(sort =>
          sort.id === sortId ? { ...sort, ...updates } : sort,
        )
      })
    },
    [onSortingChange],
  )

  const onSortRemove = React.useCallback(
    (sortId: string) => {
      onSortingChange(prevSorting =>
        prevSorting.filter(item => item.id !== sortId),
      )
    },
    [onSortingChange],
  )

  const onSortingReset = React.useCallback(
    () => onSortingChange(table.initialState.sorting),
    [onSortingChange, table.initialState.sorting],
  )

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================
  // Toggle sort menu with 'S' key
  useKeyboardShortcut({
    key: "s",
    onTrigger: () => setOpen(prev => !prev),
  })

  // Reset sorting with Shift+S
  useKeyboardShortcut({
    key: "s",
    requireShift: true,
    onTrigger: () => onSortingReset(),
    condition: () => sorting.length > 0,
  })

  // Trigger button keyboard shortcuts (Backspace/Delete to reset)
  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        ["backspace", "delete"].includes(event.key.toLowerCase()) &&
        sorting.length > 0
      ) {
        event.preventDefault()
        onSortingReset()
      }
    },
    [sorting.length, onSortingReset],
  )

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Sortable
      value={sorting}
      onValueChange={onSortingChange}
      getItemValue={item => item.id}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onKeyDown={onTriggerKeyDown}
            className={className}
          >
            <ArrowDownUp />
            Sort
            {sorting.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono text-[10.4px] font-normal"
              >
                {sorting.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          className="flex w-full max-w-(--radix-popover-content-available-width) origin-(--radix-popover-content-transform-origin) flex-col gap-3.5 p-4 sm:min-w-[380px]"
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h4 id={labelId} className="leading-none font-medium">
              {sorting.length > 0 ? "Sort by" : "No sorting applied"}
            </h4>
            <p
              id={descriptionId}
              className={cn(
                "text-sm text-muted-foreground",
                sorting.length > 0 && "sr-only",
              )}
            >
              {sorting.length > 0
                ? "Modify sorting to organize your rows."
                : "Add sorting to organize your rows."}
            </p>
          </div>
          {sorting.length > 0 && (
            <SortableContent asChild>
              <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1">
                {sorting.map(sort => (
                  <TableSortItem
                    key={sort.id}
                    sort={sort}
                    sortItemId={`${id}-sort-${sort.id}`}
                    columns={columns}
                    columnLabels={columnLabels}
                    onSortUpdate={onSortUpdate}
                    onSortRemove={onSortRemove}
                  />
                ))}
              </ul>
            </SortableContent>
          )}
          <div className="flex w-full items-center gap-2">
            <Button
              size="sm"
              className="rounded"
              ref={addButtonRef}
              onClick={onSortAdd}
              disabled={columns.length === 0}
            >
              Add sort
            </Button>
            {sorting.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded"
                onClick={onSortingReset}
              >
                Reset sorting
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[180px] rounded-sm bg-primary/10" />
          <div className="h-8 w-24 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */
TableSortMenu.displayName = "TableSortMenu"
