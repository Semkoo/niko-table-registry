"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import {
  ChevronsUpDown,
  EyeOff,
  Filter,
  MoreVertical,
  Pin,
  PinOff,
  Settings2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SORT_ICONS, SORT_LABELS } from "../config/data-table"
import type { SortIconVariant } from "../config/data-table"

// ============================================================================
// CONTEXT
// ============================================================================

interface TableColumnHeaderContextValue<TData, TValue> {
  column: Column<TData, TValue>
  title?: string
  variant?: SortIconVariant
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
      "useColumnHeaderContext must be used within a TableColumnHeader",
    )
  }
  return context
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export interface TableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title?: string
  variant?: SortIconVariant
}

/**
 * Composable Column Header container.
 */
export function TableColumnHeader<TData, TValue>({
  column,
  title,
  variant,
  className,
  children,
  ...props
}: TableColumnHeaderProps<TData, TValue>) {
  const columnTitle = title ?? column.columnDef.meta?.label ?? column.id

  if (!column.getCanSort() && !column.getCanHide() && !children) {
    return (
      <div className={cn("text-sm font-semibold", className)} {...props}>
        {columnTitle}
      </div>
    )
  }

  return (
    <TableColumnHeaderContext.Provider
      value={
        { column, title, variant } as TableColumnHeaderContextValue<
          unknown,
          unknown
        >
      }
    >
      <div
        className={cn(
          "group flex w-full items-center justify-between gap-1",
          className,
        )}
        {...props}
      >
        {children || (
          <>
            <TableColumnTitle />
            <TableColumnActions>
              <TableColumnFilter />
              <TableColumnMenu />
            </TableColumnActions>
          </>
        )}
      </div>
    </TableColumnHeaderContext.Provider>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Renders the column title and handles sorting toggle on click.
 */
export function TableColumnTitle<TData, TValue>({
  title,
  className,
  showSortIcon = true,
}: {
  title?: string
  className?: string
  showSortIcon?: boolean
}) {
  const {
    column,
    title: contextTitle,
    variant,
  } = useColumnHeaderContext<TData, TValue>()
  const displayTitle =
    title ?? contextTitle ?? column.columnDef.meta?.label ?? column.id

  const canSort = column.getCanSort()
  const sortState = column.getIsSorted()

  const resolvedVariant: SortIconVariant =
    variant ||
    (column.columnDef.meta?.variant === "number"
      ? "number"
      : column.columnDef.meta?.variant === "date"
        ? "date"
        : column.columnDef.meta?.variant === "boolean"
          ? "boolean"
          : undefined) ||
    "text"

  const icons = SORT_ICONS[resolvedVariant]

  const SortIndicator =
    sortState === "asc"
      ? icons.asc
      : sortState === "desc"
        ? icons.desc
        : ChevronsUpDown

  const handleToggleSort = () => {
    if (canSort) {
      column.toggleSorting(column.getIsSorted() === "asc")
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleSort}
      disabled={!canSort}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-sm font-semibold transition-colors hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent",
        className,
      )}
    >
      <span className="truncate">{displayTitle}</span>
      {canSort && showSortIcon && (
        <SortIndicator className="size-3.5 shrink-0 text-muted-foreground/70" />
      )}
    </button>
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
 * Wrapper for column filters.
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
        "size-7 transition-opacity group-hover:opacity-100",
        isFiltered ? "text-primary opacity-100" : "opacity-0",
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
 * Dropdown menu for column actions (sorting, pinning, hiding).
 */
export function TableColumnMenu<TData, TValue>({
  className,
}: {
  className?: string
}) {
  const { column, variant } = useColumnHeaderContext<TData, TValue>()

  const canSort = column.getCanSort()
  const canHide = column.getCanHide()
  const canPin = column.getCanPin()

  const sortState = column.getIsSorted()

  const resolvedVariant: SortIconVariant =
    variant ||
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            sortState || column.getIsPinned()
              ? "text-primary opacity-100"
              : "opacity-0",
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
        {canSort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => column.toggleSorting(false)}
              className={cn(sortState === "asc" && "bg-accent font-medium")}
            >
              <icons.asc className="mr-2 size-4 text-muted-foreground/70" />
              {labels.asc}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => column.toggleSorting(true)}
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

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => {}}>
          <Settings2 className="mr-2 size-4 text-muted-foreground/70" />
          Settings...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnHeader.displayName = "TableColumnHeader"
TableColumnTitle.displayName = "TableColumnTitle"
TableColumnActions.displayName = "TableColumnActions"
TableColumnFilter.displayName = "TableColumnFilter"
TableColumnFilterTrigger.displayName = "TableColumnFilterTrigger"
TableColumnMenu.displayName = "TableColumnMenu"
