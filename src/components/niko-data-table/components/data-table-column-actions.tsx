"use client"

import React from "react"

import { TableColumnActions } from "../filters/table-column-actions"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Composable container for column actions.
 *
 * Uses column context to automatically detect active states (pinned, sorted, etc.).
 *
 * @example
 * ```tsx
 * <DataTableColumnActions>
 *   <DataTableColumnSortOptions />
 *   <DataTableColumnPinOptions />
 *   <DataTableColumnHideOptions />
 * </DataTableColumnActions>
 * ```
 */
export function DataTableColumnActions<TData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnActions>, "isActive"> & {
    /** Override to manually set active state */
    isActive?: boolean
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)

  // Auto-detect active state from column context
  const autoIsActive = context?.column
    ? !!(
        context.column.getIsSorted() ||
        context.column.getIsPinned() ||
        context.column.getIsFiltered()
      )
    : false

  const isActive = props.isActive ?? autoIsActive

  return <TableColumnActions {...props} isActive={isActive} />
}

DataTableColumnActions.displayName = "DataTableColumnActions"
