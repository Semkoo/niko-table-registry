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
import React from "react"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"

// ============================================================================
// CONTEXT
// ============================================================================

interface TableColumnHeaderContextValue<TData, TValue> {
  column: Column<TData, TValue>
}

const TableColumnHeaderContext = React.createContext<
  TableColumnHeaderContextValue<unknown, unknown> | undefined
>(undefined)

export function useColumnHeaderContext<TData, TValue>(
  required: true,
): TableColumnHeaderContextValue<TData, TValue>
export function useColumnHeaderContext<TData, TValue>(
  required: false,
): TableColumnHeaderContextValue<TData, TValue> | undefined
export function useColumnHeaderContext<TData, TValue>(required = true) {
  const context = React.useContext(TableColumnHeaderContext) as
    | TableColumnHeaderContextValue<TData, TValue>
    | undefined

  if (required && !context) {
    throw new Error(
      "useColumnHeaderContext must be used within DataTableColumnHeaderRoot",
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
export function DataTableColumnHeaderRoot<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>
  children: React.ReactNode
}) {
  // Memoize so context subscribers only re-render when `column` identity changes.
  const contextValue = React.useMemo(
    () => ({ column }) as TableColumnHeaderContextValue<unknown, unknown>,
    [column],
  )
  return (
    <TableColumnHeaderContext.Provider value={contextValue}>
      {children}
    </TableColumnHeaderContext.Provider>
  )
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export type DataTableColumnHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Composable Column Header container.
 */
export function DataTableColumnHeader({
  className,
  children,
  ...props
}: DataTableColumnHeaderProps) {
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

DataTableColumnHeaderRoot.displayName = "DataTableColumnHeaderRoot"
DataTableColumnHeader.displayName = "DataTableColumnHeader"
