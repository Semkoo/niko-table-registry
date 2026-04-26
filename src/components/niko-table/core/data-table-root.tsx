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
  type ColumnOrderState,
  type ColumnPinningState,
  type Updater,
  type FilterFn,
  type FilterFnOption,
} from "@tanstack/react-table"
import { DataTableProvider } from "./data-table-context"
import { cn } from "@/lib/utils"
import { type DataTableColumnDef, type GlobalFilter } from "../types"
import { detectFeaturesFromChildren } from "../config/feature-detection"
import {
  extendedFilter,
  globalFilter as globalFilterFn,
  numberRangeFilter,
  dateRangeFilter,
} from "../lib/filter-functions"
import {
  FILTER_VARIANTS,
  SYSTEM_COLUMN_IDS,
  SYSTEM_COLUMN_ID_LIST,
} from "../lib/constants"

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
  onGlobalFilterChange?: (value: GlobalFilter) => void
  onPaginationChange?: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void
  onExpandedChange?: (updater: Updater<ExpandedState>) => void
  onColumnOrderChange?: (updater: Updater<ColumnOrderState>) => void
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
  onColumnOrderChange,
  onColumnPinningChange,
  onRowSelection,
  // Destructured by name so the `tableOptions` memo depends on stable values
  // — depending on the whole `rest` bag invalidated the memo every render
  // and triggered the "state update on a component that hasn't mounted yet"
  // warning under React 19 + Strict Mode + Turbopack HMR.
  state: restState,
  initialState: restInitialState,
  globalFilterFn: restGlobalFilterFn,
  // Spread into `tableOptions` but NOT in the memo deps. Lift any passthrough
  // option that needs to invalidate the memo into the destructure list above.
  ...passthroughTableOptions
}: Omit<TableRootProps<TData, TValue>, "table"> & {
  columns: DataTableColumnDef<TData, TValue>[]
  data: TData[]
}) {
  // Memoize so `columns.some()` only runs when the columns array changes.
  const hasSelectColumn = React.useMemo(
    () => columns?.some(col => col.id === SYSTEM_COLUMN_IDS.SELECT) ?? false,
    [columns],
  )

  const hasExpandColumn = React.useMemo(
    () =>
      columns?.some(
        col =>
          col.id === SYSTEM_COLUMN_IDS.EXPAND ||
          (col.meta &&
            "expandedContent" in col.meta &&
            col.meta.expandedContent),
      ) ?? false,
    [columns],
  )

  // Stable identity prevents downstream memo cascades (detectFeatures,
  // processedColumns, tableOptions) from invalidating each render.
  const finalConfig: DataTableConfig = React.useMemo(
    () => ({
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
      // Default `false` — preserves pagination cursor across filter changes
      // (better UX for server-side / infinite scroll) and avoids the async
      // `onPaginationChange` race that fires "state update on unmounted
      // component" warnings. Opt in via `config={{ autoResetPageIndex: true }}`.
      autoResetPageIndex: config?.autoResetPageIndex ?? false,
      autoResetExpanded: config?.autoResetExpanded ?? false,
    }),
    [
      config?.enablePagination,
      config?.enableFilters,
      config?.enableSorting,
      config?.enableRowSelection,
      hasSelectColumn,
      config?.enableMultiSort,
      config?.enableGrouping,
      config?.enableExpanding,
      hasExpandColumn,
      config?.manualSorting,
      config?.manualPagination,
      config?.manualFiltering,
      config?.pageCount,
      config?.initialPageSize,
      config?.initialPageIndex,
      config?.autoResetPageIndex,
      config?.autoResetExpanded,
    ],
  )

  // Cache once: `detectFeaturesFromChildren` recursively walks the React tree
  // (50-150ms on deep trees). Children structure is stable post-mount.
  const detectedFeaturesRef = React.useRef<ReturnType<
    typeof detectFeaturesFromChildren
  > | null>(null)

  // Only detect features once on mount (children structure is stable)
  if (detectedFeaturesRef.current === null) {
    detectedFeaturesRef.current = detectFeaturesFromChildren(children, columns)
  }

  // Memoize merged feature object so tableOptions stays stable.
  const detectFeatures = React.useMemo(() => {
    const detectedFeatures = detectedFeaturesRef.current ?? {}

    const features = {
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

    return features
  }, [finalConfig])

  // State management
  const [globalFilter, setGlobalFilter] = React.useState<GlobalFilter>(
    restInitialState?.globalFilter ?? "",
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    restInitialState?.rowSelection ?? {},
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(restInitialState?.columnVisibility ?? {})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    restInitialState?.columnFilters ?? [],
  )
  const [sorting, setSorting] = React.useState<SortingState>(
    restInitialState?.sorting ?? [],
  )
  const [expanded, setExpanded] = React.useState<ExpandedState>(
    restInitialState?.expanded ?? {},
  )
  const [columnPinning, setColumnPinning] = React.useState<{
    left: string[]
    right: string[]
  }>({
    left: restInitialState?.columnPinning?.left ?? [],
    right: restInitialState?.columnPinning?.right ?? [],
  })
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    restInitialState?.columnOrder ?? [],
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex:
      finalConfig.initialPageIndex ??
      restInitialState?.pagination?.pageIndex ??
      0,
    pageSize:
      finalConfig.initialPageSize ??
      restInitialState?.pagination?.pageSize ??
      10,
  })

  // Mount-ref guards prevent React-19 + StrictMode "state update on unmounted
  // component" warnings when TanStack's async dispatches land on a torn-down fiber.
  const isMountedRef = React.useRef(true)
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Stable identity keeps tableOptions memo from invalidating each render.
  const handleGlobalFilterChange = React.useCallback(
    (value: GlobalFilter) => {
      // Mount-guard local writes; external handler is caller's responsibility.
      if (isMountedRef.current) {
        setGlobalFilter(value)
      }
      onGlobalFilterChange?.(value)
    },
    [onGlobalFilterChange],
  )

  // O(1) row-by-id lookup; Array.find()-per-selection is O(n × m) — ~500ms lag
  // at 10k rows × 100 selected.
  const rowIdMap = React.useMemo(() => {
    const map = new Map<string, TData>()
    data?.forEach((row, idx) => {
      const rowId =
        getRowId?.(row, idx) ??
        (row as { id?: string | number }).id?.toString() ??
        String(idx)
      map.set(rowId, row)
    })
    return map
  }, [data, getRowId])

  // Stable identity prevents table re-init. Pure setter — `onRowSelection`
  // fires from the effect below so concurrent-mode double-invokes don't double-fire.
  // Honors the full TanStack `Updater<T> = T | ((old: T) => T)` contract.
  const handleRowSelectionChange = React.useCallback(
    (valueFn: Updater<RowSelectionState>) => {
      if (!isMountedRef.current) return
      if (typeof valueFn === "function") {
        setRowSelection(prev => valueFn(prev))
      } else {
        setRowSelection(valueFn)
      }
    },
    [],
  )

  // Fire `onRowSelection` only on user-driven changes — skip the initial mount.
  const skipInitialRowSelectionRef = React.useRef(true)
  React.useEffect(() => {
    if (!isMountedRef.current) return
    if (skipInitialRowSelectionRef.current) {
      skipInitialRowSelectionRef.current = false
      return
    }
    if (!onRowSelection) return
    const selectedRows = Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(key => rowIdMap.get(key))
      .filter((row): row is TData => row !== undefined)
    onRowSelection(selectedRows)
  }, [rowSelection, rowIdMap, onRowSelection])

  /**
   * PERFORMANCE: Stable mount-guarded fallback setters
   *
   * WHY: Inline `(u) => isMounted && setX(u)` closures inside `tableOptions` get
   * recreated on every memo invalidation, and the 6 setX refs added noise to the
   * dep array (state setters are already stable by React contract).
   *
   * IMPACT: tableOptions memo no longer depends on 6 setters; fallback handlers
   * keep referential identity across renders.
   *
   * WHAT: Hoists each fallback to a `useCallback([])`. Mount-guard preserved so
   * StrictMode-unmounted fibers don't receive setState calls.
   */
  const handleSortingChange = React.useCallback((u: Updater<SortingState>) => {
    if (isMountedRef.current) setSorting(u)
  }, [])

  const handleColumnFiltersChange = React.useCallback(
    (u: Updater<ColumnFiltersState>) => {
      if (isMountedRef.current) setColumnFilters(u)
    },
    [],
  )

  const handleColumnVisibilityChange = React.useCallback(
    (u: Updater<VisibilityState>) => {
      if (isMountedRef.current) setColumnVisibility(u)
    },
    [],
  )

  const handleColumnPinningChange = React.useCallback(
    (updater: Updater<ColumnPinningState>) => {
      if (!isMountedRef.current) return
      setColumnPinning(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater
        return {
          left: next.left ?? [],
          right: next.right ?? [],
        }
      })
    },
    [],
  )

  const handleColumnOrderChange = React.useCallback(
    (u: Updater<ColumnOrderState>) => {
      if (isMountedRef.current) setColumnOrder(u)
    },
    [],
  )

  const handleExpandedChange = React.useCallback(
    (u: Updater<ExpandedState>) => {
      if (isMountedRef.current) setExpanded(u)
    },
    [],
  )

  const handlePaginationChange = React.useCallback(
    (u: Updater<PaginationState>) => {
      if (isMountedRef.current) setPagination(u)
    },
    [],
  )

  /**
   * Auto-apply filterFn based on meta.variant if not explicitly provided
   * This allows developers to set variant in meta and get the right filterFn automatically
   */
  const processedColumns = React.useMemo(() => {
    return columns.map(col => {
      // If filterFn is already defined, use it (manual override)
      if (col.filterFn) return col

      const meta = col.meta ?? {}
      const variant = meta.variant

      // Auto-apply filterFn based on variant
      let autoFilterFn: FilterFnOption<TData> | undefined
      if (
        variant === FILTER_VARIANTS.RANGE ||
        variant === FILTER_VARIANTS.NUMBER
      ) {
        // For number/range variants, use numberRangeFilter if no explicit filterFn
        autoFilterFn = "numberRange" as FilterFnOption<TData>
      } else if (
        variant === FILTER_VARIANTS.DATE ||
        variant === FILTER_VARIANTS.DATE_RANGE
      ) {
        // For date variants, use dateRangeFilter if no explicit filterFn
        autoFilterFn = "dateRange" as FilterFnOption<TData>
      }

      // Only override if we have an auto filterFn and no explicit one
      if (autoFilterFn) {
        return {
          ...col,
          filterFn: autoFilterFn,
        }
      }

      return col
    })
  }, [columns])

  // TanStack's `defaultColumn` is per-render-cheaper than mapping columns ourselves.
  const defaultColumn = React.useMemo<Partial<DataTableColumnDef<TData>>>(
    () => ({
      enableSorting: true,
      enableHiding: true,
      filterFn: "extended" as FilterFnOption<TData>,
      // Override TanStack's internal default (150) so unset `size` stays undefined
      // — virtualized flex layout uses this to distinguish fixed vs flexible cols.
      // `column.getSize()` still falls back to 150 internally.
      size: undefined,
    }),
    [],
  )

  // Extract controlled-state slices for the tableOptions dep array.
  const controlledSorting = restState?.sorting ?? sorting
  const controlledColumnVisibility =
    restState?.columnVisibility ?? columnVisibility
  const controlledRowSelection = restState?.rowSelection ?? rowSelection
  const controlledColumnFilters = restState?.columnFilters ?? columnFilters
  const controlledGlobalFilter =
    restState?.globalFilter !== undefined
      ? restState.globalFilter
      : globalFilter
  const controlledColumnPinning = restState?.columnPinning ?? columnPinning
  const controlledColumnOrder = restState?.columnOrder ?? columnOrder
  const controlledExpanded = restState?.expanded ?? expanded
  const controlledPagination = restState?.pagination ?? pagination

  // System columns (select, expand) follow the first data column's pinning so
  // they stay visually attached as the "row header".
  const finalColumnPinning = React.useMemo(() => {
    // Use centralized system column IDs from constants

    // Helper to safely extract column ID (handles both id and accessorKey)
    const getColumnId = (
      col: DataTableColumnDef<TData, TValue>,
    ): string | undefined => {
      if (col.id) return col.id
      // Type-safe check for accessorKey property
      if ("accessorKey" in col && typeof col.accessorKey === "string") {
        return col.accessorKey
      }
      return undefined
    }

    // 1. Identify the "First Data Column" (first non-system column)
    const firstDataCol = columns.find(col => {
      const id = getColumnId(col)
      return id && !SYSTEM_COLUMN_ID_LIST.includes(id)
    })

    if (!firstDataCol) return controlledColumnPinning

    const firstDataColId = getColumnId(firstDataCol)
    if (!firstDataColId) return controlledColumnPinning

    // 2. Check pinning state of the first data column
    const isPinnedLeft = controlledColumnPinning.left?.includes(firstDataColId)
    const isPinnedRight =
      controlledColumnPinning.right?.includes(firstDataColId)

    // If not fixed to either side, return default (system cols float naturally)
    if (!isPinnedLeft && !isPinnedRight) {
      return controlledColumnPinning
    }

    const left = [...(controlledColumnPinning.left ?? [])]
    const right = [...(controlledColumnPinning.right ?? [])]

    // 3. Prepare system columns list
    const systemColsPresent: string[] = []
    if (hasSelectColumn) systemColsPresent.push(SYSTEM_COLUMN_IDS.SELECT)
    if (hasExpandColumn) systemColsPresent.push(SYSTEM_COLUMN_IDS.EXPAND)

    // 4. Clean existing lists (remove system cols to avoid duplication)
    const cleanLeft = left.filter(id => !SYSTEM_COLUMN_ID_LIST.includes(id))
    const cleanRight = right.filter(id => !SYSTEM_COLUMN_ID_LIST.includes(id))

    // 5. Construct new pinning state
    if (isPinnedLeft) {
      // Pin Left: [System, ...Others]
      return {
        left: [...systemColsPresent, ...cleanLeft],
        right: cleanRight,
      }
    }

    if (isPinnedRight) {
      // Pin Right: [System, ...Others]
      // We place system cols *before* others in the Right group so they appear
      // to the immediate left of the right-pinned data columns.
      return {
        left: cleanLeft,
        right: [...systemColsPresent, ...cleanRight],
      }
    }

    return controlledColumnPinning
  }, [controlledColumnPinning, columns, hasSelectColumn, hasExpandColumn])

  // Critical: stable options reference. New object → useReactTable recreates
  // the instance → state resets and sorting/filter/expand break.
  const tableOptions = React.useMemo<TableOptions<TData>>(
    () => ({
      ...passthroughTableOptions,
      data,
      columns: processedColumns,
      defaultColumn,
      state: {
        ...restState,
        // Always use our local state as the source of truth
        // External state (restState) takes precedence only if explicitly provided
        sorting: controlledSorting,
        columnVisibility: controlledColumnVisibility,
        columnPinning: finalColumnPinning,
        columnOrder: controlledColumnOrder,
        rowSelection: controlledRowSelection,
        columnFilters: controlledColumnFilters,
        globalFilter: controlledGlobalFilter,
        expanded: controlledExpanded,
        pagination: controlledPagination,
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
      // Enable auto-reset behaviors by default (standard TanStack Table behavior)
      // Can be overridden via config
      autoResetPageIndex: finalConfig.autoResetPageIndex,
      autoResetExpanded: finalConfig.autoResetExpanded,
      onGlobalFilterChange: handleGlobalFilterChange,
      onRowSelectionChange: onRowSelectionChange ?? handleRowSelectionChange,
      // Default state setters are mount-ref guarded so TanStack's async
      // auto-reset dispatches don't land on a StrictMode-unmounted fiber.
      // Consumer-supplied handlers are NOT guarded — caller's responsibility.
      onSortingChange: onSortingChange ?? handleSortingChange,
      onColumnFiltersChange: onColumnFiltersChange ?? handleColumnFiltersChange,
      onColumnVisibilityChange:
        onColumnVisibilityChange ?? handleColumnVisibilityChange,
      onColumnPinningChange: onColumnPinningChange ?? handleColumnPinningChange,
      onColumnOrderChange: onColumnOrderChange ?? handleColumnOrderChange,
      onExpandedChange: onExpandedChange ?? handleExpandedChange,
      onPaginationChange: onPaginationChange ?? handlePaginationChange,
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
        numberRange: numberRangeFilter,
        dateRange: dateRangeFilter,
      },
      // Allow globalFilterFn to be overridden via rest props, otherwise use default
      globalFilterFn:
        (restGlobalFilterFn as FilterFn<TData>) ??
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
      pageCount: (() => {
        if (!detectFeatures.manualPagination) return undefined
        return finalConfig.pageCount !== undefined
          ? finalConfig.pageCount
          : detectFeatures.pageCount !== undefined
            ? detectFeatures.pageCount
            : -1
      })(),
    }),
    // Deps are the *destructured* rest props, NOT the whole rest bag — see
    // destructure-site comment. `passthroughTableOptions` is intentionally
    // NOT a dep (lift any option that needs to invalidate the memo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      restState,
      restGlobalFilterFn,
      data,
      processedColumns,
      defaultColumn,
      detectFeatures,
      finalConfig,
      handleGlobalFilterChange,
      onRowSelectionChange,
      handleRowSelectionChange,
      onSortingChange,
      handleSortingChange,
      onColumnFiltersChange,
      handleColumnFiltersChange,
      onColumnVisibilityChange,
      handleColumnVisibilityChange,
      onColumnPinningChange,
      handleColumnPinningChange,
      onColumnOrderChange,
      handleColumnOrderChange,
      onExpandedChange,
      handleExpandedChange,
      onPaginationChange,
      handlePaginationChange,
      getRowId,
      // Use controlled state values - these update when either external or local state changes
      controlledSorting,
      controlledColumnVisibility,
      controlledRowSelection,
      controlledColumnFilters,
      controlledGlobalFilter,
      controlledColumnOrder,
      controlledExpanded,
      controlledPagination,
      // Add column pinning state to dependencies so the table updates when it changes
      finalColumnPinning,
    ],
  )

  // Instance ref is stable across state changes; React Compiler warns about
  // incompatible-library here — TanStack manages its own memoization (expected).
  const table = useReactTable<TData>(tableOptions)

  return (
    <DataTableProvider
      table={table}
      columns={processedColumns as DataTableColumnDef<TData>[]}
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
