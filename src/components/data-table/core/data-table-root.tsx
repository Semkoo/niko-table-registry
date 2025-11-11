"use client"

import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table,
  type TableOptions,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type VisibilityState,
  type ExpandedState,
  type Updater,
  type FilterFn,
} from "@tanstack/react-table"
import { DataTableProvider } from "./data-table-context"
import { cn } from "@/lib/utils"
import { type DataTableColumnDef } from "../types"
import { detectFeaturesFromChildren } from "../config/feature-detection"
import {
  extendedFilter,
  globalFilter as globalFilterFn,
} from "../lib/filter-functions"

export interface DataTableConfig {
  // Feature toggles
  enablePagination?: boolean
  enableFilters?: boolean
  enableSorting?: boolean
  enableRowSelection?: boolean
  enableMultiSort?: boolean
  enableGrouping?: boolean
  enableExpanding?: boolean

  // Manual modes (for server-side)
  manualSorting?: boolean
  manualPagination?: boolean
  manualFiltering?: boolean
  pageCount?: number

  // Initial state
  initialPageSize?: number
  initialPageIndex?: number

  // Auto-reset behaviors
  autoResetPageIndex?: boolean
  autoResetExpanded?: boolean
}

interface TableRootProps<TData, TValue> extends Partial<TableOptions<TData>> {
  // Option 1: Pass a pre-configured table instance
  table?: Table<TData>

  // Option 2: Let DataTableRoot create its own table
  columns?: DataTableColumnDef<TData, TValue>[]
  data?: TData[]

  children: React.ReactNode
  className?: string

  // Configuration object
  config?: DataTableConfig
  getRowId?: (originalRow: TData, index: number) => string

  // Loading state
  isLoading?: boolean

  // Event handlers
  onGlobalFilterChange?: (value: string | object) => void
  onPaginationChange?: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void
  onExpandedChange?: (updater: Updater<ExpandedState>) => void
  onRowSelection?: (selectedRows: TData[]) => void
}

// Internal component that handles hooks for direct props mode
function DataTableRootInternal<TData, TValue>({
  columns,
  data,
  children,
  className,
  config,
  getRowId,
  isLoading,
  onGlobalFilterChange,
  onPaginationChange,
  onSortingChange,
  onColumnVisibilityChange,
  onColumnFiltersChange,
  onRowSelectionChange,
  onExpandedChange,
  onRowSelection,
  ...rest
}: Omit<TableRootProps<TData, TValue>, "table"> & {
  columns: DataTableColumnDef<TData, TValue>[]
  data: TData[]
}) {
  // Auto-detect row selection from "select" column
  const hasSelectColumn = React.useMemo(
    () => columns?.some(col => col.id === "select") ?? false,
    [columns],
  )

  // Auto-detect row expansion from "expand" column or expandedContent meta
  const hasExpandColumn = React.useMemo(
    () =>
      columns?.some(
        col =>
          col.id === "expand" ||
          (col.meta &&
            "expandedContent" in col.meta &&
            col.meta.expandedContent),
      ) ?? false,
    [columns],
  )

  // Merge config with auto-detection
  const finalConfig: DataTableConfig = {
    enablePagination: config?.enablePagination,
    enableFilters: config?.enableFilters,
    enableSorting: config?.enableSorting,
    enableRowSelection: config?.enableRowSelection ?? hasSelectColumn,
    enableMultiSort: config?.enableMultiSort,
    enableGrouping: config?.enableGrouping,
    enableExpanding: config?.enableExpanding ?? hasExpandColumn,
    manualSorting: config?.manualSorting,
    manualPagination: config?.manualPagination,
    manualFiltering: config?.manualFiltering,
    pageCount: config?.pageCount,
    initialPageSize: config?.initialPageSize,
    initialPageIndex: config?.initialPageIndex,
  }

  // Auto-detect features based on children components and column definitions
  // Note: children is intentionally NOT in deps to avoid constant re-detection
  const detectFeatures = React.useMemo(() => {
    const detectedFeatures = detectFeaturesFromChildren(children, columns)

    return {
      // Use config first, then explicit props, then detected features, then defaults
      enablePagination:
        finalConfig.enablePagination ??
        detectedFeatures.enablePagination ??
        false,
      enableFilters:
        finalConfig.enableFilters ?? detectedFeatures.enableFilters ?? false,
      enableRowSelection:
        finalConfig.enableRowSelection ??
        detectedFeatures.enableRowSelection ??
        false,
      enableSorting:
        finalConfig.enableSorting ?? detectedFeatures.enableSorting ?? true,
      enableMultiSort:
        finalConfig.enableMultiSort ?? detectedFeatures.enableMultiSort ?? true,
      enableGrouping:
        finalConfig.enableGrouping ?? detectedFeatures.enableGrouping ?? true,
      enableExpanding:
        finalConfig.enableExpanding ??
        detectedFeatures.enableExpanding ??
        false,
      manualSorting:
        finalConfig.manualSorting ?? detectedFeatures.manualSorting ?? false,
      manualPagination:
        finalConfig.manualPagination ??
        detectedFeatures.manualPagination ??
        false,
      manualFiltering:
        finalConfig.manualFiltering ??
        detectedFeatures.manualFiltering ??
        false,
      pageCount: finalConfig.pageCount ?? detectedFeatures.pageCount,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, finalConfig])

  // State management
  const [globalFilter, setGlobalFilter] = React.useState<string>(
    rest.initialState?.globalFilter ?? "",
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    rest.initialState?.rowSelection ?? {},
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(rest.initialState?.columnVisibility ?? {})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    rest.initialState?.columnFilters ?? [],
  )
  const [sorting, setSorting] = React.useState<SortingState>(
    rest.initialState?.sorting ?? [],
  )
  const [expanded, setExpanded] = React.useState<ExpandedState>(
    rest.initialState?.expanded ?? {},
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex:
      finalConfig.initialPageIndex ??
      rest.initialState?.pagination?.pageIndex ??
      0,
    pageSize:
      finalConfig.initialPageSize ??
      rest.initialState?.pagination?.pageSize ??
      10,
  })

  const handleGlobalFilterChange = React.useCallback(
    (value: string | object) => {
      if (onGlobalFilterChange) {
        onGlobalFilterChange(value)
      } else {
        setGlobalFilter(value as string)
      }
    },
    [onGlobalFilterChange],
  )

  const handleRowSelectionChange = React.useCallback(
    (valueFn: Updater<RowSelectionState>) => {
      if (typeof valueFn === "function") {
        const updatedRowSelection = valueFn(rowSelection)
        setRowSelection(updatedRowSelection)

        // Use getRowId to safely get selected rows
        const selectedRows = Object.keys(updatedRowSelection)
          .filter(key => updatedRowSelection[key])
          .map(key => {
            // Try to find the row by the key
            // Key could be either an index or a custom ID
            const index = parseInt(key, 10)

            // If key is a valid index number, use it directly
            if (!isNaN(index) && index >= 0 && index < (data?.length ?? 0)) {
              return data?.[index]
            }

            // Otherwise, find by comparing with getRowId result
            return data?.find((row, idx) => {
              const rowId =
                getRowId?.(row, idx) ??
                // Fallback to checking for 'id' property
                (row as { id?: string | number }).id?.toString() ??
                String(idx)
              return rowId === key
            })
          })
          .filter((row): row is TData => row !== undefined)

        onRowSelection?.(selectedRows)
      }
    },
    [data, onRowSelection, rowSelection, getRowId],
  )

  // Memoize processed columns to avoid recreating on every render
  const processedColumns = React.useMemo(
    () =>
      columns.map(col => {
        const dataTableCol = col as DataTableColumnDef<TData, TValue>
        return {
          ...col,
          // Enable sorting by default unless explicitly disabled
          enableSorting: dataTableCol.enableSorting ?? true,
          // Enable column visibility toggle by default unless explicitly disabled
          enableHiding: dataTableCol.enableHiding ?? true,
          // Use our custom filter function by default
          filterFn: dataTableCol.filterFn || "extended",
        }
      }) as DataTableColumnDef<TData, TValue>[],
    [columns],
  )

  const table = useReactTable<TData>({
    ...rest,
    data,
    columns: processedColumns,
    state: {
      ...rest.state,
      sorting: rest.state?.sorting ?? sorting,
      columnVisibility: rest.state?.columnVisibility ?? columnVisibility,
      rowSelection: rest.state?.rowSelection ?? rowSelection,
      columnFilters: rest.state?.columnFilters ?? columnFilters,
      globalFilter: rest.state?.globalFilter ?? globalFilter,
      expanded: rest.state?.expanded ?? expanded,
      pagination: rest.state?.pagination ?? pagination,
    },
    enableRowSelection: detectFeatures.enableRowSelection,
    enableFilters: detectFeatures.enableFilters,
    enableSorting: detectFeatures.enableSorting,
    enableMultiSort: detectFeatures.enableMultiSort,
    enableGrouping: detectFeatures.enableGrouping,
    enableExpanding: detectFeatures.enableExpanding,
    manualSorting: detectFeatures.manualSorting,
    manualPagination: detectFeatures.manualPagination,
    manualFiltering: detectFeatures.manualFiltering,
    // Disable auto-reset behaviors by default to prevent state updates during render
    // Can be overridden via config
    autoResetPageIndex: config?.autoResetPageIndex ?? false,
    autoResetExpanded: config?.autoResetExpanded ?? false,
    onGlobalFilterChange: value => {
      handleGlobalFilterChange(value as string | object)
    },
    onRowSelectionChange: onRowSelectionChange ?? handleRowSelectionChange,
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    onExpandedChange: onExpandedChange ?? setExpanded,
    onPaginationChange: onPaginationChange ?? setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: detectFeatures.enableFilters
      ? getFacetedRowModel()
      : undefined,
    getFacetedUniqueValues: detectFeatures.enableFilters
      ? getFacetedUniqueValues()
      : undefined,
    getFacetedMinMaxValues: detectFeatures.enableFilters
      ? getFacetedMinMaxValues()
      : undefined,
    getFilteredRowModel: detectFeatures.enableFilters
      ? getFilteredRowModel()
      : undefined,
    getSortedRowModel: detectFeatures.enableSorting
      ? getSortedRowModel()
      : undefined,
    getPaginationRowModel: detectFeatures.enablePagination
      ? getPaginationRowModel()
      : undefined,
    getExpandedRowModel: detectFeatures.enableExpanding
      ? getExpandedRowModel()
      : undefined,
    filterFns: {
      extended: extendedFilter,
    },
    // Allow globalFilterFn to be overridden via rest props, otherwise use default
    globalFilterFn:
      (rest.globalFilterFn as FilterFn<TData>) ??
      (globalFilterFn as unknown as FilterFn<TData>),
    // Use provided getRowId or fallback to checking for 'id' property, then index
    getRowId:
      getRowId ??
      ((originalRow, index) => {
        // Try to use 'id' property if it exists
        const rowWithId = originalRow as { id?: string | number }
        if (rowWithId.id !== undefined && rowWithId.id !== null) {
          return String(rowWithId.id)
        }
        // Fallback to index
        return String(index)
      }),
    pageCount: detectFeatures.manualPagination
      ? (detectFeatures.pageCount ?? -1)
      : undefined,
  })

  return (
    <DataTableProvider
      table={table}
      columns={columns as DataTableColumnDef<TData>[]}
      isLoading={isLoading}
    >
      <div className={cn("w-full space-y-4", className)}>{children}</div>
    </DataTableProvider>
  )
}

// Main wrapper component
export function DataTableRoot<TData, TValue>({
  table: externalTable,
  columns,
  data,
  children,
  className,
  isLoading,
  ...rest
}: TableRootProps<TData, TValue>) {
  // If a table instance is provided, use it directly (no hooks needed)
  if (externalTable) {
    return (
      <DataTableProvider
        table={externalTable}
        columns={columns as DataTableColumnDef<TData>[]}
        isLoading={isLoading}
      >
        <div className={cn("w-full space-y-4", className)}>{children}</div>
      </DataTableProvider>
    )
  }

  // Validate required props for internal table creation
  if (!columns || !data) {
    throw new Error(
      "DataTableRoot: Either provide a 'table' prop or both 'columns' and 'data' props",
    )
  }

  // Otherwise, delegate to the internal component that handles hooks
  return (
    <DataTableRootInternal
      columns={columns}
      data={data}
      className={className}
      isLoading={isLoading}
      {...rest}
    >
      {children}
    </DataTableRootInternal>
  )
}

DataTableRoot.displayName = "DataTableRoot"
