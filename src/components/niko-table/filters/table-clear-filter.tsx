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
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

import type { DataTableInstance } from "../types"
import type { RowData } from "@tanstack/react-table"

/** Stable empty default — `excludeColumnIds` is a `useCallback` dependency. */
const EMPTY_EXCLUDED_COLUMN_IDS: readonly string[] = []

export interface TableClearFilterProps<TData extends RowData> {
  table: DataTableInstance<TData>
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
  /**
   * Column ids that are NOT user filters, even though they live in
   * `columnFilters` — a navigational tab or scope selector the table stores
   * there so it round-trips through the URL like everything else.
   *
   * They neither make the button appear nor get cleared by it. Without this,
   * selecting such a tab pops a "Reset" the user never asked for, and pressing
   * it silently navigates them back to the default tab.
   *
   * @default [] — every column filter is treated as a user filter
   */
  excludeColumnIds?: readonly string[]
}

/**
 * Core clear filter button component that accepts a table prop directly.
 * Use this when you want to manage the table instance yourself.
 *
 * Automatically hides when there are no active filters to clear.
 *
 * @example
 * ```tsx
 * const table = useTable({ features, ... })
 * <TableClearFilter table={table} />
 * ```
 */
export function TableClearFilter<TData extends RowData>({
  table,
  className,
  variant = "outline",
  size = "sm",
  showIcon = true,
  children,
  enableResetColumnFilters = true,
  enableResetGlobalFilter = true,
  enableResetSorting = true,
  excludeColumnIds = EMPTY_EXCLUDED_COLUMN_IDS,
}: TableClearFilterProps<TData>) {
  // Read state directly - should be reactive via table re-renders
  const state = table.state
  const hasActiveFilters = state.columnFilters.some(
    filter => !excludeColumnIds.includes(filter.id),
  )
  // A whitespace-only search is invisible in the input, so counting it as
  // active pops a Reset the reader cannot account for — they see a button
  // offering to clear something, and nothing on screen that needs clearing.
  // Objects (the advanced OR/MIXED filter payload) always count.
  const hasGlobalFilter =
    typeof state.globalFilter === "string"
      ? state.globalFilter.trim().length > 0
      : Boolean(state.globalFilter)
  const hasSorting = state.sorting.length > 0

  // Only check for states that are meant to be reset
  const hasAnythingToReset =
    (enableResetColumnFilters && hasActiveFilters) ||
    (enableResetGlobalFilter && hasGlobalFilter) ||
    (enableResetSorting && hasSorting)

  const handleClearAll = React.useCallback(() => {
    if (enableResetColumnFilters) {
      if (excludeColumnIds.length > 0) {
        // Keep the excluded entries exactly as they are — resetColumnFilters()
        // would drop the tab the user is standing on along with their filters.
        table.setColumnFilters(prev =>
          prev.filter(filter => excludeColumnIds.includes(filter.id)),
        )
      } else {
        table.resetColumnFilters()
      }
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
    excludeColumnIds,
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
