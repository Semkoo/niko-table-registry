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
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"
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
  limitToFilteredRows,
  dynamicCounts = true,
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
   * @default !multiple (true for single-select, false for multi-select)
   */
  limitToFilteredRows?: boolean
  /**
   * Whether to update counts based on other active filters.
   * @default true
   */
  dynamicCounts?: boolean
}) {
  // Default: multi-select shows all options, single-select filters to visible rows
  limitToFilteredRows ??= !multiple

  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  // Auto-generate options from column meta (works for select/multi_select variants)
  const generatedOptions = useGeneratedOptionsForColumn(
    table as Table<TData>,
    column.id,
    { limitToFilteredRows, dynamicCounts },
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

    // optionRows used for the list of options
    const optionRows = limitToFilteredRows ? filteredRows : coreRows

    // countRows used for the counts
    const countRows = dynamicCounts ? filteredRows : coreRows

    if (!optionRows || !countRows) return []

    const valueCounts = new Map<string, number>()

    // Determine the set of available options
    const availableOptions = new Set<string>()
    optionRows.forEach(row => {
      const raw = row.getValue(column.id) as unknown
      const values: unknown[] = Array.isArray(raw) ? raw : [raw]
      values.forEach(v => {
        if (v != null) {
          const s = String(v)
          if (s) availableOptions.add(s)
        }
      })
    })

    // Calculate counts for available options
    countRows.forEach(row => {
      const raw = row.getValue(column.id) as unknown
      const values: unknown[] = Array.isArray(raw) ? raw : [raw]
      values.forEach(v => {
        if (v != null) {
          const s = String(v)
          if (availableOptions.has(s)) {
            valueCounts.set(s, (valueCounts.get(s) || 0) + 1)
          }
        }
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
      return metaOptions
        .filter(opt => !limitToFilteredRows || availableOptions.has(opt.value))
        .map(opt => ({
          ...opt,
          count: showCounts ? (valueCounts.get(opt.value) ?? 0) : undefined,
        }))
    }

    if (metaOptions && metaOptions.length > 0) {
      return limitToFilteredRows
        ? metaOptions.filter(opt => availableOptions.has(opt.value))
        : metaOptions
    }

    return Array.from(availableOptions)
      .map(value => ({
        label: autoOptionsFormat ? formatLabel(value) : value,
        value,
        count: showCounts ? valueCounts.get(value) || 0 : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [
    table,
    column,
    limitToFilteredRows,
    dynamicCounts,
    coreRows,
    filteredRows,
  ])

  /**
   * Enrich caller-supplied `options` with live counts and (optionally) narrow
   * them to values that exist in the current row set. Mirrors the row-set
   * split used by `fallbackOptions` so explicit and generated paths stay
   * consistent — without this, `dynamicCounts` was silently ignored whenever
   * a caller passed their own options.
   */
  const enrichedCallerOptions = React.useMemo(() => {
    if (!options) return null
    // Preserve the original `options ?? ...` semantics: an explicit empty
    // array still wins over generated/fallback options.
    if (options.length === 0 || !table || !column) return options

    const showCounts =
      (column.columnDef.meta as Record<string, unknown>)?.showCounts ?? true

    // Fast path: no narrowing needed and no counts to compute — normalize
    // `count` to undefined so output shape is consistent with the fallback
    // path, which also strips counts when `showCounts` is false.
    if (!limitToFilteredRows && !showCounts) {
      return options.map(opt => ({ ...opt, count: undefined }))
    }

    const optionRows = limitToFilteredRows ? filteredRows : coreRows
    const countRows = dynamicCounts ? filteredRows : coreRows

    if (!optionRows || !countRows) return options

    const availableOptions = limitToFilteredRows ? new Set<string>() : null
    if (availableOptions) {
      optionRows.forEach(row => {
        const raw = row.getValue(column.id) as unknown
        const values: unknown[] = Array.isArray(raw) ? raw : [raw]
        values.forEach(v => {
          if (v != null) {
            const s = String(v)
            if (s) availableOptions.add(s)
          }
        })
      })
    }

    const valueCounts = showCounts ? new Map<string, number>() : null
    if (valueCounts) {
      countRows.forEach(row => {
        const raw = row.getValue(column.id) as unknown
        const values: unknown[] = Array.isArray(raw) ? raw : [raw]
        values.forEach(v => {
          if (v != null) {
            const s = String(v)
            valueCounts.set(s, (valueCounts.get(s) || 0) + 1)
          }
        })
      })
    }

    const filtered = availableOptions
      ? options.filter(opt => availableOptions.has(opt.value))
      : options

    return filtered.map(opt => ({
      ...opt,
      count: valueCounts ? (valueCounts.get(opt.value) ?? 0) : undefined,
    }))
  }, [
    options,
    table,
    column,
    limitToFilteredRows,
    dynamicCounts,
    coreRows,
    filteredRows,
  ])

  const resolvedOptions =
    enrichedCallerOptions ??
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
