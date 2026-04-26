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
import type { Table } from "@tanstack/react-table"
import {
  TableFacetedFilter,
  TableFacetedFilterContent,
  useTableFacetedFilter,
  type TableFacetedFilterProps,
} from "../filters/table-faceted-filter"
import { useDataTable } from "../core/data-table-context"
import type { Option } from "../types"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"
import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { buildFacetedOptions } from "../lib/build-faceted-options"

type DataTableFacetedFilterProps<TData, TValue> = Omit<
  TableFacetedFilterProps<TData, TValue>,
  "column" | "options"
> & {
  /**
   * The accessor key of the column to filter (matches column definition)
   */
  accessorKey: keyof TData & string
  /**
   * Optional title override (if not provided, will use column.meta.label)
   */
  title?: string
  /**
   * Static options (if provided, will be used instead of dynamic generation)
   */
  options?: Option[]
  /**
   * Whether to show counts for each option
   * @default true
   */
  showCounts?: boolean
  /**
   * Whether to update counts based on other active filters
   * @default true
   */
  dynamicCounts?: boolean
  /**
   * If true, only show options that exist in the currently filtered table rows.
   * If false, show all options from the entire dataset (useful for multi-select filters
   * where you want to see all possible options even if they're not in the current filtered results).
   * @default !multiple (true for single-select, false for multi-select)
   */
  limitToFilteredRows?: boolean
}

/**
 * A faceted filter component that automatically connects to the DataTable context
 * and dynamically generates options with counts based on the filtered data.
 *
 * @example - Auto-detect options from data with dynamic counts
 * const columns: DataTableColumnDef[] = [{ accessorKey: "category", ..., meta: { label: "Category" } }, ...]
 * <DataTableFacetedFilter accessorKey="category" />
 *
 * @example - With static options
 * const categoryOptions: Option[] = [
 *   { label: "Electronics", value: "electronics" },
 *   { label: "Clothing", value: "clothing" },
 * ]
 * <DataTableFacetedFilter
 *   accessorKey="category"
 *   title="Category"
 *   options={categoryOptions}
 * />
 *
 * @example - With dynamic option generation and multiple selection
 * <DataTableFacetedFilter
 *   accessorKey="brand"
 *   title="Brand"
 *   multiple
 *   dynamicCounts
 * />
 *
 * @example - Without counts
 * <DataTableFacetedFilter
 *   accessorKey="status"
 *   showCounts={false}
 * />
 */

interface UseFacetedOptionsArgs<TData> {
  table: Table<TData>
  accessorKey: string
  options?: Option[]
  showCounts: boolean
  dynamicCounts: boolean
  limitToFilteredRows: boolean
}

// Resolves option list in priority order: 1) caller `options`, 2) meta-aware
// generator (select/multi_select), 3) data-derived fallback. Memo gates it so
// we don't walk rows twice.
function useFacetedOptions<TData>({
  table,
  accessorKey,
  options,
  showCounts,
  dynamicCounts,
  limitToFilteredRows,
}: UseFacetedOptionsArgs<TData>): Option[] {
  const column = table.getColumn(accessorKey)

  // The meta-aware generator is authoritative for declared select variants —
  // it handles augment/preserve strategies and per-column meta overrides.
  // It returns `[]` for columns that don't match a select variant, which is
  // how we detect "fall back to data-derived options."
  const metaGenerated = useGeneratedOptionsForColumn(table, accessorKey, {
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
  })

  // Pull state slices for memo reactivity.
  const state = table.getState()
  const columnFilters = state.columnFilters
  const globalFilter = state.globalFilter

  // Extract `coreRows` so async-data row-array identity drives recompute;
  // `table` ref is stable and would hold stale (empty) results.
  const coreRows = table.getCoreRowModel().rows

  return React.useMemo((): Option[] => {
    if (!column) return []

    const meta = column.columnDef.meta
    const autoOptionsFormat = meta?.autoOptionsFormat ?? true

    // Priority 1: caller-supplied options — always wins over meta/data.
    if (options && options.length > 0) {
      return buildFacetedOptions(
        table,
        coreRows,
        accessorKey,
        columnFilters,
        globalFilter,
        {
          staticOptions: options,
          limitToFilteredRows,
          dynamicCounts,
          showCounts,
          autoOptionsFormat,
        },
      )
    }

    // Priority 2: trust the meta-aware generator when it produced anything.
    // (Preserved original "non-empty result wins" behavior so auto-generated
    // columns with valid data don't get clobbered by the fallback.)
    if (metaGenerated.length > 0) return metaGenerated

    // Priority 3: data-derived fallback for non-select variants (or select
    // variants that had no rows to work with — empty output either way).
    return buildFacetedOptions(
      table,
      coreRows,
      accessorKey,
      columnFilters,
      globalFilter,
      {
        limitToFilteredRows,
        dynamicCounts,
        showCounts,
        autoOptionsFormat,
      },
    )
  }, [
    column,
    options,
    metaGenerated,
    table,
    coreRows,
    accessorKey,
    columnFilters,
    globalFilter,
    limitToFilteredRows,
    dynamicCounts,
    showCounts,
  ])
}

/**
 * Shared setup for the two exported wrapper components. Keeps column lookup,
 * title derivation, and options resolution in one place so the wrappers stay
 * thin.
 */
function useFacetedFilterSetup<TData>({
  accessorKey,
  options,
  showCounts,
  dynamicCounts,
  limitToFilteredRows,
  title,
}: {
  accessorKey: string
  options?: Option[]
  showCounts: boolean
  dynamicCounts: boolean
  limitToFilteredRows: boolean
  title?: string
}) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey)

  const derivedTitle = useDerivedColumnTitle(column, accessorKey, title)

  const dynamicOptions = useFacetedOptions({
    table,
    accessorKey,
    options,
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
  })

  return { table, column, derivedTitle, dynamicOptions }
}

export function DataTableFacetedFilter<TData, TValue = unknown>({
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows,
  title,
  multiple,
  trigger,
  ...props
}: DataTableFacetedFilterProps<TData, TValue>) {
  // Default: multi-select shows all options, single-select filters to visible rows
  const resolvedLimitToFilteredRows = limitToFilteredRows ?? !multiple

  const { column, derivedTitle, dynamicOptions } = useFacetedFilterSetup<TData>(
    {
      accessorKey: accessorKey as string,
      options,
      showCounts,
      dynamicCounts,
      limitToFilteredRows: resolvedLimitToFilteredRows,
      title,
    },
  )

  // Early return if column not found
  if (!column) {
    console.warn(
      `Column with accessorKey "${accessorKey}" not found in table columns`,
    )
    return null
  }

  return (
    <TableFacetedFilter
      column={column}
      options={dynamicOptions}
      title={derivedTitle}
      multiple={multiple}
      trigger={trigger}
      {...props}
    />
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableFacetedFilter.displayName = "DataTableFacetedFilter"

export function DataTableFacetedFilterContent<TData, TValue = unknown>({
  accessorKey,
  options,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows,
  title,
  multiple,
  onValueChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  // Default: multi-select shows all options, single-select filters to visible rows
  const resolvedLimitToFilteredRows = limitToFilteredRows ?? !multiple

  const { column, derivedTitle, dynamicOptions } = useFacetedFilterSetup<TData>(
    {
      accessorKey: accessorKey as string,
      options,
      showCounts,
      dynamicCounts,
      limitToFilteredRows: resolvedLimitToFilteredRows,
      title,
    },
  )

  // Use the shared hook for filter logic
  const { selectedValues, onItemSelect, onReset } = useTableFacetedFilter({
    column,
    onValueChange,
    multiple,
  })

  if (!column) return null

  return (
    <TableFacetedFilterContent
      title={derivedTitle}
      options={dynamicOptions}
      selectedValues={selectedValues}
      onItemSelect={onItemSelect}
      onReset={onReset}
    />
  )
}

DataTableFacetedFilterContent.displayName = "DataTableFacetedFilterContent"
