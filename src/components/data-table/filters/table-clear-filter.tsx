"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface TableClearFilterProps<TData> {
  table: Table<TData>
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  children?: React.ReactNode
  /**
   * Enable resetting column filters
   * @default true
   */
  enableResetColumnFilters?: boolean
  /**
   * Enable resetting global filter (search)
   * @default true
   */
  enableResetGlobalFilter?: boolean
  /**
   * Enable resetting sorting
   * @default true
   */
  enableResetSorting?: boolean
}

/**
 * Core clear filter button component that accepts a table prop directly.
 * Use this when you want to manage the table instance yourself.
 *
 * Automatically hides when there are no active filters to clear.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ ... })
 * <TableClearFilter table={table} />
 * ```
 */
export function TableClearFilter<TData>({
  table,
  className,
  variant = "outline",
  size = "sm",
  showIcon = true,
  children,
  enableResetColumnFilters = true,
  enableResetGlobalFilter = true,
  enableResetSorting = true,
}: TableClearFilterProps<TData>) {
  // Read state directly - should be reactive via table re-renders
  const state = table.getState()
  const hasActiveFilters = state.columnFilters.length > 0
  const hasGlobalFilter = Boolean(state.globalFilter)
  const hasSorting = state.sorting.length > 0

  // Only check for states that are meant to be reset
  const hasAnythingToReset =
    (enableResetColumnFilters && hasActiveFilters) ||
    (enableResetGlobalFilter && hasGlobalFilter) ||
    (enableResetSorting && hasSorting)

  const handleClearAll = React.useCallback(() => {
    if (enableResetColumnFilters) {
      table.resetColumnFilters()
    }
    if (enableResetGlobalFilter) {
      table.setGlobalFilter("")
    }
    if (enableResetSorting) {
      table.resetSorting()
    }
  }, [
    table,
    enableResetColumnFilters,
    enableResetGlobalFilter,
    enableResetSorting,
  ])

  if (!hasAnythingToReset) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearAll}
      className={cn("h-8", className)}
    >
      {showIcon && <X className="mr-2 h-4 w-4" />}
      {children || "Reset"}
    </Button>
  )
}

TableClearFilter.displayName = "TableClearFilter"

