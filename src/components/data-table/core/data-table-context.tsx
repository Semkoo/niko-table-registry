"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react"
import type { DataTable, DataTableColumnDef } from "../types"

export type DataTableContextState<TData> = {
  table: DataTable<TData>
  columns: DataTableColumnDef<TData>[]
  isLoading: boolean
}

type DataTableContextProps<TData> = DataTableContextState<TData> & {
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

type DataTableAction<TData> =
  | {
      type: DataTableActions.SET
      value: Partial<DataTableContextState<TData>>
    }
  | {
      type: DataTableActions.SET_IS_LOADING
      value: boolean
    }

function dataTableReducer<TData>(
  state: DataTableContextState<TData>,
  action: DataTableAction<TData>,
): DataTableContextState<TData> {
  switch (action.type) {
    case DataTableActions.SET:
      return { ...state, ...action.value }
    case DataTableActions.SET_IS_LOADING:
      return { ...state, isLoading: action.value }
    default:
      return state
  }
}

function deriveInitialState<TData>(
  table: DataTable<TData>,
  columns?: DataTableColumnDef<TData>[],
  isLoading?: boolean,
): DataTableContextState<TData> {
  return {
    table,
    columns: columns || (table.options.columns as DataTableColumnDef<TData>[]),
    isLoading: isLoading ?? false,
  }
}

interface DataTableProviderProps<TData> {
  children: React.ReactNode
  table: DataTable<TData>
  columns?: DataTableColumnDef<TData>[]
  isLoading?: boolean
}

export function DataTableProvider<TData>({
  children,
  table,
  columns,
  isLoading: externalIsLoading,
}: DataTableProviderProps<TData>) {
  const initialState = deriveInitialState(table, columns, externalIsLoading)

  const [state, dispatch] = useReducer(dataTableReducer<TData>, initialState)

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

  const value = {
    table: state.table,
    columns: state.columns,
    isLoading: state.isLoading,
    setIsLoading,
  } as DataTableContextProps<TData>

  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  )
}

export { DataTableContext }
