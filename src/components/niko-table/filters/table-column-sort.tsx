"use client"

import React from "react"
import type { Column, Table } from "@tanstack/react-table"
import { Check, CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDataTable } from "../core/data-table-context"

import { SORT_ICONS, SORT_LABELS } from "../config/data-table"
import type { SortIconVariant } from "../config/data-table"
import { FILTER_VARIANTS } from "../lib/constants"

/**
 * Sort options menu items for composition inside TableColumnActions.
 *
 * @example
 * ```tsx
 * <TableColumnActions>
 *   <TableColumnSortOptions column={column} />
 * </TableColumnActions>
 * ```
 */
export function TableColumnSortOptions<TData, TValue>({
  column,
  table: propTable,
  variant: propVariant,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
  table?: Table<TData>
  variant?: SortIconVariant
  /** Whether to render a separator before the options. @default true */
  withSeparator?: boolean
}) {
  const context = useDataTable<TData>()
  const table = propTable || context.table
  const sortState = column.getIsSorted()

  const variant =
    propVariant || column.columnDef.meta?.variant || FILTER_VARIANTS.TEXT

  const icons = SORT_ICONS[variant] || SORT_ICONS[FILTER_VARIANTS.TEXT]
  const labels = SORT_LABELS[variant] || SORT_LABELS[FILTER_VARIANTS.TEXT]

  const sortIndex = column.getSortIndex()
  const isMultiSort = table && table.getState().sorting.length > 1
  const showSortBadge = isMultiSort && sortIndex !== -1

  /**
   * Use a ref for immediate synchronous access to shift key state.
   * React state updates are batched and async, which can cause race conditions
   * when the dropdown closes - the keyup event might reset state before
   * handleSort reads it. A ref provides synchronous access.
   */
  const isShiftPressedRef = React.useRef(false)
  const [isShiftPressed, setIsShiftPressed] = React.useState(false)

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        const isDown = e.type === "keydown"
        isShiftPressedRef.current = isDown
        setIsShiftPressed(isDown)
      }
    }
    window.addEventListener("keydown", handleKey, { capture: true })
    window.addEventListener("keyup", handleKey, { capture: true })
    return () => {
      window.removeEventListener("keydown", handleKey, { capture: true })
      window.removeEventListener("keyup", handleKey, { capture: true })
    }
  }, [])

  const handleSort = (
    direction: "asc" | "desc" | false,
    e:
      | React.MouseEvent
      | React.KeyboardEvent
      | Event
      | {
          detail?: { originalEvent?: { shiftKey?: boolean } }
          shiftKey?: boolean
          nativeEvent?: { shiftKey?: boolean }
        },
  ) => {
    // Detect multi-sort (Shift key)
    // We check multiple sources in order of reliability:
    // 1. Ref from global listener (most reliable - synchronous access, no batching issues)
    // 2. State from global listener (backup, may have timing issues)
    // 3. Direct event property (for native mouse/keyboard events)
    // 4. Radix CustomEvent detail (specifically for DropdownMenuItem selection)
    const isMulti =
      isShiftPressedRef.current ||
      isShiftPressed ||
      ("shiftKey" in e && !!e.shiftKey) ||
      (e as { detail?: { originalEvent?: { shiftKey?: boolean } } }).detail
        ?.originalEvent?.shiftKey ||
      (e as { nativeEvent?: { shiftKey?: boolean } }).nativeEvent?.shiftKey

    if (direction === false) {
      column.clearSorting()
    } else {
      const isDesc = direction === "desc"
      const canMultiSort = column.getCanMultiSort()

      /**
       * @see https://tanstack.com/table/v8/docs/guide/sorting#multi-sorting
       * When using toggleSorting explicitly, we must manually pass the multi-sort flag.
       */
      column.toggleSorting(isDesc, canMultiSort ? isMulti : false)
    }
  }

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Column Sort</span>
          {showSortBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex size-4 cursor-help items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {sortIndex + 1}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                Sort priority (order in which columns are sorted)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            TIP: Hold &apos;shift&apos; key to enable multi sort
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      <DropdownMenuItem
        onSelect={e => handleSort("asc", e)}
        className={cn(
          "flex items-center",
          sortState === "asc" && "bg-accent text-accent-foreground",
        )}
      >
        <icons.asc className="mr-2 size-4 text-muted-foreground/70" />
        <span className="flex-1">{labels.asc}</span>
        {sortState === "asc" && <Check className="ml-2 size-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={e => handleSort("desc", e)}
        className={cn(
          "flex items-center",
          sortState === "desc" && "bg-accent text-accent-foreground",
        )}
      >
        <icons.desc className="mr-2 size-4 text-muted-foreground/70" />
        <span className="flex-1">{labels.desc}</span>
        {sortState === "desc" && <Check className="ml-2 size-4" />}
      </DropdownMenuItem>
      {sortState && (
        <DropdownMenuItem onSelect={() => column.clearSorting()}>
          <icons.unsorted className="mr-2 size-4 text-muted-foreground/70" />
          Clear Sort
        </DropdownMenuItem>
      )}
    </>
  )
}

/**
 * Standalone dropdown menu for sorting.
 *
 * For composition inside TableColumnActions, use TableColumnSortOptions instead.
 *
 * @example
 * ```tsx
 * // Standalone
 * <TableColumnSortMenu column={column} table={table} />
 *
 * // Composed
 * <TableColumnActions>
 *   <TableColumnSortOptions column={column} />
 * </TableColumnActions>
 * ```
 */
export function TableColumnSortMenu<TData, TValue>({
  column,
  table: propTable,
  variant: propVariant,
  className,
}: {
  column: Column<TData, TValue>
  table?: Table<TData>
  variant?: SortIconVariant
  className?: string
}) {
  const context = useDataTable<TData>()
  const table = propTable || context.table
  const canSort = column.getCanSort()
  const sortState = column.getIsSorted()

  const variant =
    propVariant || column.columnDef.meta?.variant || FILTER_VARIANTS.TEXT

  const icons = SORT_ICONS[variant] || SORT_ICONS[FILTER_VARIANTS.TEXT]

  if (!canSort) return null

  const SortIcon =
    sortState === "asc"
      ? icons.asc
      : sortState === "desc"
        ? icons.desc
        : icons.unsorted

  const sortIndex = column.getSortIndex()
  const isMultiSort = table && table.getState().sorting.length > 1
  const showSortBadge = isMultiSort && sortIndex !== -1

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity dark:text-muted-foreground",
            sortState && "text-primary",
            className,
          )}
        >
          <div className="relative flex items-center justify-center">
            <SortIcon className="size-4" />
            {showSortBadge && (
              <span className="absolute -top-1 -right-2 flex size-3 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                {sortIndex + 1}
              </span>
            )}
          </div>
          <span className="sr-only">Sort column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <TableColumnSortOptions
          column={column}
          table={table}
          variant={variant}
          withSeparator={false}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnSortOptions.displayName = "TableColumnSortOptions"
TableColumnSortMenu.displayName = "TableColumnSortMenu"
