"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import {
  EyeOff,
  Filter,
  HelpCircle,
  MoreVertical,
  Pin,
  PinOff,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SORT_ICONS, SORT_LABELS } from "../config/data-table"
import type { SortIconVariant } from "../config/data-table"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { useDerivedColumnTitle } from "../hooks"

// ============================================================================
// CONTEXT
// ============================================================================

interface TableColumnHeaderContextValue<TData, TValue> {
  column: Column<TData, TValue>
}

const TableColumnHeaderContext = React.createContext<
  TableColumnHeaderContextValue<unknown, unknown> | undefined
>(undefined)

function useColumnHeaderContext<TData, TValue>() {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined

  if (!context) {
    throw new Error(
      "useColumnHeaderContext must be used within a TableColumnHeaderRoot",
    )
  }
  return context
}

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

/**
 * Provider for column header context.
 * Used internally by DataTableHeader to provide context to composable header components.
 */
export function TableColumnHeaderRoot<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>
  children: React.ReactNode
}) {
  return (
    <TableColumnHeaderContext.Provider
      value={{ column } as TableColumnHeaderContextValue<unknown, unknown>}
    >
      {children}
    </TableColumnHeaderContext.Provider>
  )
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export type TableColumnHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Composable Column Header container.
 */
export function TableColumnHeader({
  className,
  children,
  ...props
}: TableColumnHeaderProps) {
  return (
    <div
      className={cn(
        "group flex w-full items-center justify-between gap-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Renders the column title.
 */
export function TableColumnTitle<TData, TValue>({
  title,
  className,
  children,
}: {
  title?: string
  className?: string
  children?: React.ReactNode
}) {
  const { column } = useColumnHeaderContext<TData, TValue>()

  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  return (
    <div
      className={cn(
        "truncate py-0.5 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {children ?? derivedTitle}
    </div>
  )
}

/**
 * Wrapper for grouping action icons (filter, menu) on the right side of the header.
 */
export function TableColumnActions({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-shrink-0 items-center justify-end", className)}
    >
      {children}
    </div>
  )
}

/**
 * Context-aware faceted filter menu for column headers.
 */
export function TableColumnFacetedFilterMenu<TData, TValue>({
  column: propColumn,
  title,
  options,
  ...props
}: Omit<
  React.ComponentProps<typeof DataTableFacetedFilter>,
  "accessorKey" | "trigger"
> & {
  column?: Column<TData, TValue>
  title?: string
  options?: React.ComponentProps<typeof DataTableFacetedFilter>["options"]
}) {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined
  const column = propColumn || context?.column

  if (!column) {
    console.warn(
      "TableColumnFacetedFilterMenu must be used within TableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  return (
    <DataTableFacetedFilter
      accessorKey={column.id as keyof TData & string}
      title={title}
      options={options}
      trigger={<TableColumnFilterTrigger />}
      {...(props as Omit<
        React.ComponentProps<typeof DataTableFacetedFilter>,
        "accessorKey" | "trigger"
      >)}
    />
  )
}

/**
 * Wrapper for groups of column filters.
 */
export function TableColumnFilter({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  if (children) {
    return <div className={cn("flex items-center", className)}>{children}</div>
  }
  return null
}

/**
 * A standard filter trigger button (Funnel icon).
 */
export function TableColumnFilterTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { column } = useColumnHeaderContext()
  const isFiltered = column.getIsFiltered()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 transition-opacity",
        isFiltered && "text-primary",
        className,
      )}
      {...props}
    >
      <Filter className="size-3.5" />
      <span className="sr-only">Filter column</span>
    </Button>
  )
}

/**
 * Dropdown menu for sorting options only.
 */
export function TableColumnSortMenu<TData, TValue>({
  column: propColumn,
  variant: propVariant,
  className,
}: {
  column?: Column<TData, TValue>
  variant?: SortIconVariant
  className?: string
}) {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined
  const column = propColumn || context?.column

  // Track shift key state for multi-sort
  const shiftKeyRef = React.useRef(false)

  if (!column) {
    console.warn(
      "TableColumnSortMenu must be used within TableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  const canSort = column.getCanSort()
  const sortState = column.getIsSorted()
  // Access table options via runtime property (TanStack Table exposes this at runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enableMultiSort = ((column as any)._table?.options?.enableMultiSort ??
    true) as boolean

  const resolvedVariant: SortIconVariant =
    propVariant ||
    (column.columnDef.meta?.variant === "number"
      ? "number"
      : column.columnDef.meta?.variant === "date"
        ? "date"
        : column.columnDef.meta?.variant === "boolean"
          ? "boolean"
          : undefined) ||
    "text"

  const icons = SORT_ICONS[resolvedVariant]
  const labels = SORT_LABELS[resolvedVariant]

  if (!canSort) return null

  const SortIcon =
    sortState === "asc"
      ? icons.asc
      : sortState === "desc"
        ? icons.desc
        : icons.unsorted

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
          <SortIcon className="size-4" />
          <span className="sr-only">Sort column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          Sort Options
          {enableMultiSort && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                Hold Shift to multi-sort
              </TooltipContent>
            </Tooltip>
          )}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onPointerDown={e => {
            shiftKeyRef.current = e.shiftKey
          }}
          onSelect={() => {
            column.toggleSorting(false, enableMultiSort && shiftKeyRef.current)
            shiftKeyRef.current = false
          }}
          className={cn(sortState === "asc" && "bg-accent font-medium")}
        >
          <icons.asc className="mr-2 size-4 text-muted-foreground/70" />
          {labels.asc}
        </DropdownMenuItem>
        <DropdownMenuItem
          onPointerDown={e => {
            shiftKeyRef.current = e.shiftKey
          }}
          onSelect={() => {
            column.toggleSorting(true, enableMultiSort && shiftKeyRef.current)
            shiftKeyRef.current = false
          }}
          className={cn(sortState === "desc" && "bg-accent font-medium")}
        >
          <icons.desc className="mr-2 size-4 text-muted-foreground/70" />
          {labels.desc}
        </DropdownMenuItem>
        {sortState && (
          <DropdownMenuItem onSelect={() => column.clearSorting()}>
            <X className="mr-2 size-4 text-muted-foreground/70" />
            Reset Sorting
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Dropdown menu for hiding options only.
 */
export function TableColumnHide<TData, TValue>({
  className,
}: {
  className?: string
}) {
  const { column } = useColumnHeaderContext<TData, TValue>()
  const canHide = column.getCanHide()

  if (!canHide) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            !column.getIsVisible() ? "text-primary opacity-100" : "opacity-0",
            className,
          )}
        >
          <EyeOff className="size-4" />
          <span className="sr-only">Hide column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
          <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
          Hide Column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Dropdown menu for pinning options only.
 */
export function TableColumnPin<TData, TValue>({
  className,
}: {
  className?: string
}) {
  const { column } = useColumnHeaderContext<TData, TValue>()
  const canPin = column.getCanPin()
  const isPinned = column.getIsPinned()

  if (!canPin) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            isPinned ? "text-primary opacity-100" : "opacity-0",
            className,
          )}
        >
          <Pin className="size-4" />
          <span className="sr-only">Pin column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Pin Options
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => column.pin("left")}>
          <Pin className="mr-2 size-4 rotate-[-45deg]" />
          Pin to Left
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.pin("right")}>
          <Pin className="mr-2 size-4 rotate-[45deg]" />
          Pin to Right
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.pin(false)}>
          <PinOff className="mr-2 size-4" />
          Unpin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Dropdown menu for column settings (pinning and hiding).
 */
export function TableColumnSettingFilterMenu<TData, TValue>({
  column: propColumn,
  className,
}: {
  column?: Column<TData, TValue>
  className?: string
}) {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined
  const column = propColumn || context?.column

  if (!column) {
    console.warn(
      "TableColumnSettingFilterMenu must be used within TableColumnHeaderRoot or provided with a column prop",
    )
    return null
  }

  const canHide = column.getCanHide()
  const canPin = column.getCanPin()

  if (!canHide && !canPin) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            column.getIsPinned() || !column.getIsVisible()
              ? "text-primary opacity-100"
              : "opacity-0",
            className,
          )}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Column settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Column Settings
        </DropdownMenuLabel>

        {canPin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Pin className="mr-2 size-4 text-muted-foreground/70" />
                Pin Column
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => column.pin("left")}>
                  <Pin className="mr-2 size-4 rotate-[-45deg]" />
                  Pin to Left
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => column.pin("right")}>
                  <Pin className="mr-2 size-4 rotate-[45deg]" />
                  Pin to Right
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => column.pin(false)}>
                  <PinOff className="mr-2 size-4" />
                  Unpin
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {canHide && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
              Hide Column
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TableColumnMenu<TData, TValue>({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { column } = useColumnHeaderContext<TData, TValue>()

  // Track shift key state for multi-sort
  const shiftKeyRef = React.useRef(false)

  const canSort = column.getCanSort()
  const canHide = column.getCanHide()
  const canPin = column.getCanPin()

  const sortState = column.getIsSorted()
  // Access table options via runtime property (TanStack Table exposes this at runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enableMultiSort = ((column as any)._table?.options?.enableMultiSort ??
    true) as boolean

  const resolvedVariant: SortIconVariant =
    (column.columnDef.meta?.variant === "number"
      ? "number"
      : column.columnDef.meta?.variant === "date"
        ? "date"
        : column.columnDef.meta?.variant === "boolean"
          ? "boolean"
          : undefined) || "text"

  const icons = SORT_ICONS[resolvedVariant]
  const labels = SORT_LABELS[resolvedVariant]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity dark:text-muted-foreground",
            (sortState || column.getIsPinned()) && "text-primary",
            className,
          )}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Column menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Column Actions
        </DropdownMenuLabel>

        {/* Custom content (e.g. Filters) */}
        {children}
        {canSort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={e => {
                shiftKeyRef.current = e.shiftKey
              }}
              onSelect={() => {
                column.toggleSorting(
                  false,
                  enableMultiSort && shiftKeyRef.current,
                )
                shiftKeyRef.current = false
              }}
              className={cn(sortState === "asc" && "bg-accent font-medium")}
            >
              <icons.asc className="mr-2 size-4 text-muted-foreground/70" />
              {labels.asc}
              {enableMultiSort && (
                <DropdownMenuShortcut className="text-xs">
                  ⇧
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={e => {
                shiftKeyRef.current = e.shiftKey
              }}
              onSelect={() => {
                column.toggleSorting(
                  true,
                  enableMultiSort && shiftKeyRef.current,
                )
                shiftKeyRef.current = false
              }}
              className={cn(sortState === "desc" && "bg-accent font-medium")}
            >
              <icons.desc className="mr-2 size-4 text-muted-foreground/70" />
              {labels.desc}
              {enableMultiSort && (
                <DropdownMenuShortcut className="text-xs">
                  ⇧
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
            {sortState && (
              <DropdownMenuItem onSelect={() => column.clearSorting()}>
                <X className="mr-2 size-4 text-muted-foreground/70" />
                Reset Sorting
              </DropdownMenuItem>
            )}
          </>
        )}

        {canPin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Pin className="mr-2 size-4 text-muted-foreground/70" />
                Pin Column
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => column.pin("left")}>
                  <Pin className="mr-2 size-4 rotate-[-45deg]" />
                  Pin to Left
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => column.pin("right")}>
                  <Pin className="mr-2 size-4 rotate-[45deg]" />
                  Pin to Right
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => column.pin(false)}>
                  <PinOff className="mr-2 size-4" />
                  Unpin
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {canHide && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
              Hide Column
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnHeaderRoot.displayName = "TableColumnHeaderRoot"
TableColumnHeader.displayName = "TableColumnHeader"
TableColumnTitle.displayName = "TableColumnTitle"
TableColumnActions.displayName = "TableColumnActions"
TableColumnFilter.displayName = "TableColumnFilter"
TableColumnFilterTrigger.displayName = "TableColumnFilterTrigger"
TableColumnSortMenu.displayName = "TableColumnSortMenu"
TableColumnHide.displayName = "TableColumnHide"
TableColumnPin.displayName = "TableColumnPin"
TableColumnMenu.displayName = "TableColumnMenu"
TableColumnFacetedFilterMenu.displayName = "TableColumnFacetedFilterMenu"
TableColumnSettingFilterMenu.displayName = "TableColumnSettingFilterMenu"
