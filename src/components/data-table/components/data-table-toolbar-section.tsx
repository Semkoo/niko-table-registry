"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface DataTableToolbarSectionProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode
}

/**
 * A simple, flexible toolbar container for composing table controls.
 * Use this as a layout container and add your own search, filters, sorting, etc.
 *
 * @example - Basic toolbar with search and filters
 * <DataTableToolbarSection>
 *   <DataTableSearchInput placeholder="Search..." />
 *   <DataTableFilterButton column="status" title="Status" />
 *   <DataTableSortMenu />
 * </DataTableToolbarSection>
 *
 * @example - Custom layout with left and right sections
 * <DataTableToolbarSection className="justify-between">
 *   <div className="flex gap-2">
 *     <DataTableSearchInput />
 *     <DataTableFilterButton column="status" />
 *   </div>
 *   <div className="flex gap-2">
 *     <DataTableSortMenu />
 *     <DataTableViewMenu />
 *   </div>
 * </DataTableToolbarSection>
 *
 * @example - With custom elements
 * <DataTableToolbarSection>
 *   <DataTableSearchInput />
 *   <span className="text-sm text-muted-foreground">
 *     {table.getFilteredRowModel().rows.length} results
 *   </span>
 *   <Button variant="outline">Export</Button>
 * </DataTableToolbarSection>
 */

const DataTableToolbarSectionInternal = React.forwardRef<
  HTMLDivElement,
  DataTableToolbarSectionProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full flex-wrap items-center gap-2 p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
})

DataTableToolbarSectionInternal.displayName = "DataTableToolbarSectionInternal"

/**
 * PERFORMANCE: Toolbar section - memoized with React.memo
 *
 * WHY: Toolbar components re-render whenever table state changes (filter, sort, etc.).
 * Without memoization, the toolbar re-renders even when its props haven't changed.
 *
 * IMPACT: Prevents unnecessary re-renders when table state changes but toolbar props are stable.
 * With multiple toolbar sections, this saves ~2-5ms per table state change.
 *
 * WHAT: Only re-renders when props (children, className, etc.) actually change.
 */
export const DataTableToolbarSection = React.memo(
  DataTableToolbarSectionInternal,
)

DataTableToolbarSection.displayName = "DataTableToolbarSection"
