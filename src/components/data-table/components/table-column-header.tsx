"use client"

import type { Column } from "@tanstack/react-table"
import { EyeOff, X } from "lucide-react"
import { SORT_ICONS, SORT_LABELS } from "../config/data-table"
import type { SortIconVariant } from "../config/data-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface TableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<TData, TValue>
  title?: string
  variant?: SortIconVariant
  onSort?: (columnId: string, direction: "asc" | "desc" | false) => void
  onVisibilityChange?: (columnId: string, isVisible: boolean) => void
}

export function TableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  variant,
  onSort,
  onVisibilityChange,
  ...props
}: TableColumnHeaderProps<TData, TValue>) {
  const columnTitle = title ?? column.columnDef.meta?.label ?? column.id
  const canSort = column.getCanSort()
  const canHide = column.getCanHide()

  // If column cannot be sorted or hidden, render static title
  if (!canSort && !canHide) {
    return <div className={cn(className)}>{columnTitle}</div>
  }

  // Determine variant: prefer prop, then column meta, then deprecated sortIconVariant, then fallback to 'text'
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

  const sortState = column.getIsSorted()
  const icons = SORT_ICONS[resolvedVariant]
  const labels = SORT_LABELS[resolvedVariant]
  const SortIcon =
    sortState === "asc"
      ? icons.asc
      : sortState === "desc"
        ? icons.desc
        : icons.unsorted

  const handleSort = (direction: "asc" | "desc") => {
    const isDescending = direction === "desc"
    column.toggleSorting(isDescending)
    onSort?.(column.id, direction)
  }

  const handleReset = () => {
    column.clearSorting()
    onSort?.(column.id, false)
  }

  const handleHide = () => {
    column.toggleVisibility(false)
    onVisibilityChange?.(column.id, false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:ring-1 focus:ring-ring focus:outline-none data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {columnTitle}
        {canSort && <SortIcon />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {canSort && (
          <>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={sortState === "asc"}
              onSelect={() => {
                handleSort("asc")
              }}
            >
              {icons.asc && <icons.asc className="mr-2 size-4" />}
              {labels.asc}
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={sortState === "desc"}
              onSelect={() => {
                handleSort("desc")
              }}
            >
              {icons.desc && <icons.desc className="mr-2 size-4" />}
              {labels.desc}
            </DropdownMenuCheckboxItem>

            {sortState && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground"
                onSelect={() => {
                  handleReset()
                }}
              >
                <X className="size-4" />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}

        {canHide && (
          <DropdownMenuCheckboxItem
            className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
            checked={!column.getIsVisible()}
            onSelect={() => {
              handleHide()
            }}
          >
            <EyeOff className="mr-2 size-4" />
            Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * TableColumnHeader component
 * @required displayName is required for auto feature detection
 * @source src/components/data-table/config/feature-detection.ts
 */

TableColumnHeader.displayName = "TableColumnHeader"
