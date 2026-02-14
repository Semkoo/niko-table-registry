"use client"

import React from "react"
import type { Column, Table } from "@tanstack/react-table"
import { CircleHelp, Filter, FilterX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  TableFacetedFilter,
  TableFacetedFilterContent,
  useTableFacetedFilter,
} from "./table-faceted-filter"
import { useDerivedColumnTitle } from "../hooks"
import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { formatLabel } from "../lib/format"
import type { Option } from "../types"

/**
 * A standard filter trigger button (Funnel icon).
 */
export function TableColumnFilterTrigger<TData, TValue>({
  column,
  className,
  ...props
}: {
  column: Column<TData, TValue>
} & React.ComponentProps<typeof Button>) {
  const isFiltered = column.getIsFiltered()

  const Icon = isFiltered ? FilterX : Filter

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 transition-opacity dark:text-muted-foreground",
        isFiltered && "text-primary",
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" />
      <span className="sr-only">Filter column</span>
    </Button>
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
  table,
  title,
  options,
  onValueChange,
  multiple,
  limitToFilteredRows = true,
  ...props
}: Omit<
  React.ComponentProps<typeof TableFacetedFilter>,
  "column" | "trigger" | "options"
> & {
  column: Column<TData, TValue>
  table?: Table<TData>
  title?: string
  options?: React.ComponentProps<typeof TableFacetedFilter>["options"]
  /**
   * If true, only show options that exist in the currently filtered rows.
   * If false, show all options from the entire dataset.
   * @default true
   */
  limitToFilteredRows?: boolean
}) {
  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  // Auto-generate options from column meta (works for select/multi_select variants)
  const generatedOptions = useGeneratedOptionsForColumn(
    table as Table<TData>,
    column.id,
    { limitToFilteredRows },
  )

  /**
   * REACTIVITY FIX: Extract row model references outside memos so that when
   * async data arrives, the new rows array reference triggers memo recomputation.
   * Without this, `table` reference is stable across data changes and memos
   * would return stale (empty) results after initial render with no data.
   */
  const coreRows = table?.getCoreRowModel().rows
  const filteredRows = table?.getFilteredRowModel().rows

  // Fallback: generate options from row data for any variant (text, boolean, etc.)
  const fallbackOptions = React.useMemo((): Option[] => {
    if (!table || !column) return []

    const meta = column.columnDef.meta
    const autoOptionsFormat =
      (meta as Record<string, unknown>)?.autoOptionsFormat ?? true
    const showCounts = (meta as Record<string, unknown>)?.showCounts ?? true

    const rows = limitToFilteredRows ? filteredRows : coreRows
    if (!rows) return []
    const valueCounts = new Map<string, number>()

    rows.forEach(row => {
      const raw = row.getValue(column.id) as unknown
      const values: unknown[] = Array.isArray(raw) ? raw : [raw]
      values.forEach(v => {
        if (v == null) return
        const s = String(v)
        if (!s) return
        valueCounts.set(s, (valueCounts.get(s) || 0) + 1)
      })
    })

    // If static options exist in meta with augment strategy, use them with counts
    const metaOptions = (meta as Record<string, unknown>)?.options as
      | Option[]
      | undefined
    const mergeStrategy = (meta as Record<string, unknown>)?.mergeStrategy as
      | string
      | undefined

    if (metaOptions && metaOptions.length > 0 && mergeStrategy === "augment") {
      return metaOptions.map(opt => ({
        ...opt,
        count: showCounts ? (valueCounts.get(opt.value) ?? 0) : undefined,
      }))
    }

    if (metaOptions && metaOptions.length > 0) {
      return metaOptions
    }

    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        label: autoOptionsFormat ? formatLabel(value) : value,
        value,
        count: showCounts ? count : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [table, column, limitToFilteredRows, coreRows, filteredRows])

  const resolvedOptions =
    options ??
    (generatedOptions.length > 0 ? generatedOptions : fallbackOptions)

  return (
    <TableFacetedFilter
      column={column}
      title={derivedTitle}
      options={resolvedOptions}
      multiple={multiple}
      onValueChange={onValueChange}
      trigger={<TableColumnFilterTrigger column={column} />}
      {...props}
    />
  )
}

TableColumnFacetedFilterOptions.displayName = "TableColumnFacetedFilterOptions"
TableColumnFacetedFilterMenu.displayName = "TableColumnFacetedFilterMenu"
