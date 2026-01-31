"use client"

import React from "react"
import type { Column, Table } from "@tanstack/react-table"
import { CircleHelp, Filter } from "lucide-react"

import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TableFacetedFilter,
  TableFacetedFilterContent,
  useTableFacetedFilter,
} from "./table-faceted-filter"
import { useDerivedColumnTitle } from "../hooks"
import type { Option } from "../types"

/**
 * A standard filter trigger button (Funnel icon).
 */
export function TableColumnFilterTrigger<TData, TValue>({
  column,
  ...props
}: {
  column: Column<TData, TValue>
} & React.ComponentProps<"button">) {
  const isFiltered = column.getIsFiltered()

  return (
    <button
      className={`size-7 transition-opacity ${
        isFiltered ? "text-primary" : ""
      }`}
      {...props}
    >
      <Filter className="size-3.5" />
      <span className="sr-only">Filter column</span>
    </button>
  )
}

/**
 * Faceted filter options for composing inside TableColumnActions.
 * Renders as inline searchable menu with checkboxes.
 *
 * @example
 * ```tsx
 * // Inside TableColumnActions
 * <TableColumnActions column={column}>
 *   <TableColumnFacetedFilterOptions
 *     column={column}
 *     options={[{ label: "Active", value: "active" }]}
 *     multiple
 *   />
 * </TableColumnActions>
 * ```
 */
export function TableColumnFacetedFilterOptions<TData, TValue>({
  column,
  title,
  options = [],
  onValueChange,
  multiple = true,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
  title?: string
  options?: Option[]
  onValueChange?: (value: string[] | undefined) => void
  /** Whether to allow multiple selections. Defaults to true. */
  multiple?: boolean
  /** Whether to render a separator before the options. Defaults to true. */
  withSeparator?: boolean
}) {
  const { selectedValues, onItemSelect, onReset } = useTableFacetedFilter({
    column: column as Column<TData, unknown>,
    onValueChange,
    multiple,
  })

  const derivedTitle = useDerivedColumnTitle(column, column.id, title)
  const labelText = multiple ? "Column Multi Select" : "Column Select"
  const tooltipText = multiple
    ? "Select multiple options to filter"
    : "Select a single option to filter"

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <span>{labelText}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            {tooltipText}
            {derivedTitle && ` - ${derivedTitle}`}
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      <TableFacetedFilterContent
        title={derivedTitle}
        options={options}
        selectedValues={selectedValues}
        onItemSelect={onItemSelect}
        onReset={onReset}
      />
    </>
  )
}

/**
 * Standalone faceted filter menu for column headers.
 * Shows a filter button that opens a popover with filter options.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <TableColumnFacetedFilterMenu
 *   column={column}
 *   options={[{ label: "Active", value: "active" }]}
 * />
 * ```
 */
export function TableColumnFacetedFilterMenu<TData, TValue>({
  column,
  title,
  options,
  onValueChange,
  multiple,
  ...props
}: Omit<
  React.ComponentProps<typeof TableFacetedFilter>,
  "column" | "trigger"
> & {
  column: Column<TData, TValue>
  table?: Table<TData>
  title?: string
  options?: React.ComponentProps<typeof TableFacetedFilter>["options"]
}) {
  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  return (
    <TableFacetedFilter
      column={column}
      title={derivedTitle}
      options={options || []}
      multiple={multiple}
      onValueChange={onValueChange}
      trigger={<TableColumnFilterTrigger column={column} />}
      {...props}
    />
  )
}

TableColumnFacetedFilterOptions.displayName = "TableColumnFacetedFilterOptions"
TableColumnFacetedFilterMenu.displayName = "TableColumnFacetedFilterMenu"
