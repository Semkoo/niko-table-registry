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
 *
 * Two opt-in extensions:
 *   - `lockedColumnIds`: include columns marked `enableHiding: false` in the
 *     list, but render them disabled (always-on, can't toggle).
 *   - `onReset` + `resetLabel`: render a Reset button below a separator.
 *
 * Tuned for large column counts (200+): rows are a memoized component, the
 * search filter runs at this layer (so non-matching rows skip rendering
 * entirely), and `lockedColumnIds` is consulted via a `Set` for O(1) lookups.
 *
 * For drag-to-reorder, see `TableViewDndMenu` — it lives in a separate file
 * so consumers who don't need DnD don't pay the `@dnd-kit/*` bundle cost.
 */

import type { Column, Table } from "@tanstack/react-table"
import { Check, ChevronsUpDown, RotateCcw, Settings2 } from "lucide-react"
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
   * When provided, renders a Reset button at the bottom of the menu.
   * Useful when paired with persisted column preferences so users can
   * revert to defaults.
   */
  onReset?: () => void
  /** Label for the reset button. Defaults to "Reset to defaults". */
  resetLabel?: string
}

interface MenuRowProps<TData> {
  column: Column<TData, unknown>
  isLocked: boolean
  isVisible: boolean
  onToggle: (columnId: string) => void
}

const MenuRow = React.memo(function MenuRow<TData>({
  column,
  isLocked,
  isVisible,
  onToggle,
}: MenuRowProps<TData>) {
  return (
    <CommandItem
      data-disabled={isLocked ? "" : undefined}
      onSelect={() => {
        if (isLocked) return
        onToggle(column.id)
      }}
    >
      <span className={cn("truncate", isLocked && "text-muted-foreground")}>
        {getColumnTitle(column)}
      </span>
      <Check
        className={cn(
          "ml-auto size-4 shrink-0",
          isLocked ? "opacity-50" : isVisible ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  )
}) as <TData>(props: MenuRowProps<TData>) => React.ReactElement

export function TableViewMenu<TData>({
  table,
  onColumnVisibilityChange,
  lockedColumnIds,
  onReset,
  resetLabel,
}: TableViewMenuProps<TData>) {
  // Controlled search. cmdk's built-in filter hides non-matching `CommandItem`s
  // but still renders all of them — at 200+ columns that's the bottleneck.
  // Filtering at this layer means non-matching rows skip rendering entirely.
  const [search, setSearch] = React.useState("")

  // O(1) lookups instead of O(m) `.includes()` per row.
  const lockedSet = React.useMemo(
    () => new Set(lockedColumnIds ?? []),
    [lockedColumnIds],
  )

  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          column =>
            typeof column.accessorFn !== "undefined" &&
            (column.getCanHide() || lockedSet.has(column.id)),
        ),
    // Depend on the column set, not just the (stable) table ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, table.options.columns, lockedSet],
  )

  const visibleColumns = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return columns
    return columns.filter(c => getColumnTitle(c).toLowerCase().includes(q))
  }, [columns, search])

  // Stable callback so memoized rows skip re-render on keystrokes.
  const onToggle = React.useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      if (!column) return
      const newVisibility = !column.getIsVisible()
      column.toggleVisibility(newVisibility)
      onColumnVisibilityChange?.(columnId, newVisibility)
    },
    [table, onColumnVisibilityChange],
  )

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
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search columns..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {visibleColumns.map(column => (
                <MenuRow
                  key={column.id}
                  column={column}
                  isLocked={lockedSet.has(column.id)}
                  isVisible={column.getIsVisible()}
                  onToggle={onToggle}
                />
              ))}
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
