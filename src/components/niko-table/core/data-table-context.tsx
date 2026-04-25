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
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react"
import type { DataTableInstance, DataTableColumnDef } from "../types"

export type DataTableContextState = {
  isLoading: boolean
}

type DataTableContextProps<TData> = DataTableContextState & {
  table: DataTableInstance<TData>
  columns: DataTableColumnDef<TData>[]
  setIsLoading: (isLoading: boolean) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTableContext = createContext<DataTableContextProps<any> | undefined>(
  undefined,
)

export function useDataTable<TData>(): DataTableContextProps<TData> {
  const context = useContext(DataTableContext)
  if (context === undefined) {
    throw new Error("useDataTable must be used within DataTableRoot")
  }
  return context as DataTableContextProps<TData>
}

export enum DataTableActions {
  SET,
  SET_IS_LOADING,
}

type DataTableAction = {
  type: DataTableActions.SET_IS_LOADING
  value: boolean
}

function dataTableReducer(
  state: DataTableContextState,
  action: DataTableAction,
): DataTableContextState {
  switch (action.type) {
    case DataTableActions.SET_IS_LOADING:
      return { ...state, isLoading: action.value }
    default:
      return state
  }
}

function deriveInitialState(isLoading?: boolean): DataTableContextState {
  return {
    isLoading: isLoading ?? false,
  }
}

interface DataTableProviderProps<TData> {
  children: React.ReactNode
  table: DataTableInstance<TData>
  columns?: DataTableColumnDef<TData>[]
  isLoading?: boolean
}

export function DataTableProvider<TData>({
  children,
  table,
  columns,
  isLoading: externalIsLoading,
}: DataTableProviderProps<TData>) {
  const initialState = deriveInitialState(externalIsLoading)

  const [state, dispatch] = useReducer(dataTableReducer, initialState)

  const setIsLoading = useCallback((value: boolean) => {
    dispatch({
      type: DataTableActions.SET_IS_LOADING,
      value,
    })
  }, [])

  // Sync external isLoading prop with internal state
  useEffect(() => {
    if (
      externalIsLoading !== undefined &&
      externalIsLoading !== state.isLoading
    ) {
      setIsLoading(externalIsLoading)
    }
  }, [externalIsLoading, state.isLoading, setIsLoading])

  // Table instance ref is stable across state changes — extract individual
  // state slices so context consumers re-render on filter/sort/select.
  const tableState = table.getState()

  const globalFilter = tableState.globalFilter
  const sorting = tableState.sorting
  const columnFilters = tableState.columnFilters
  const columnVisibility = tableState.columnVisibility
  const expanded = tableState.expanded
  const rowSelection = tableState.rowSelection
  const pagination = tableState.pagination
  const columnPinning = tableState.columnPinning
  const columnOrder = tableState.columnOrder

  // Lightweight state hash beats JSON.stringify for large selections
  // (~0.1ms vs 20-50ms at 1k rows) while still triggering consumer updates.
  const tableStateKey = React.useMemo(() => {
    // Full sorted-keys hash — a "first 3 keys" signature collided on
    // sequential row IDs (`r1,r2,r3` vs `r1,r2,r4`).
    const getObjectHash = (
      obj: Record<string, unknown> | undefined,
    ): string => {
      if (!obj) return "0"
      const keys = Object.keys(obj)
      if (keys.length === 0) return "0"
      return keys.sort().join(",")
    }

    const paginationKey = `${pagination.pageIndex ?? 0}:${pagination.pageSize ?? 0}`

    // Handle globalFilter - can be string or object (for complex filters)
    const globalFilterHash =
      typeof globalFilter === "string"
        ? globalFilter
        : globalFilter && typeof globalFilter === "object"
          ? getObjectHash(globalFilter)
          : ""

    return {
      globalFilter: globalFilterHash,
      sortingHash: JSON.stringify(sorting),
      columnFiltersHash: JSON.stringify(columnFilters),
      columnVisibilityHash: getObjectHash(
        columnVisibility as Record<string, unknown> | undefined,
      ),
      expandedHash: getObjectHash(
        expanded as Record<string, unknown> | undefined,
      ),
      rowSelectionHash: getObjectHash(
        rowSelection as Record<string, unknown> | undefined,
      ),
      paginationKey,
      columnPinningHash: JSON.stringify(columnPinning),
      columnOrderHash: JSON.stringify(columnOrder),
    }
  }, [
    globalFilter,
    sorting,
    columnFilters,
    columnVisibility,
    expanded,
    rowSelection,
    pagination,
    columnPinning,
    columnOrder,
  ])

  // Memoize so context consumers (10+ filter/action components) only re-render
  // when table, columns, loading, or actual table state changes.
  const value = React.useMemo(
    () =>
      ({
        table,
        columns:
          columns || (table.options.columns as DataTableColumnDef<TData>[]),
        isLoading: state.isLoading,
        setIsLoading,
      }) as DataTableContextProps<TData>,
    [table, columns, state.isLoading, setIsLoading, tableStateKey],
  )

  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  )
}

export { DataTableContext }
