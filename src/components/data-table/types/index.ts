import * as React from "react"
import {
  type Table,
  type ColumnDef,
  type Row,
  type RowData,
} from "@tanstack/react-table"
import {
  JOIN_OPERATORS,
  FILTER_OPERATORS,
  FILTER_VARIANTS,
} from "../lib/constants"

// ============================================================================
// TANSTACK REACT-TABLE MODULE AUGMENTATION
// ============================================================================
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // Display
    label?: string
    placeholder?: string

    // Filtering
    variant?: FilterVariant
    options?: Option[]
    range?: [number, number]
    /**
     * Automatically generate options for select/multiSelect columns if not provided.
     * When true and no static `options` exist, generation logic (wrappers / hooks) may supply them.
     */
    autoOptions?: boolean
    /** Whether to automatically rename option labels using formatLabel. When false, uses raw value as label. */
    autoOptionsFormat?: boolean
    /** Per-column override for showing counts (falls back to wrapper prop). */
    showCounts?: boolean
    /** Per-column override for using filtered rows for counts (falls back to wrapper prop). */
    dynamicCounts?: boolean
    /** Merge strategy override: preserve | augment | replace (falls back to wrapper prop). */
    mergeStrategy?: "preserve" | "augment" | "replace"

    // Formatting
    unit?: string
    icon?: React.ComponentType<{ className?: string }>

    // Row Expansion
    expandedContent?: (row: TData) => React.ReactNode
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    joinOperator?: JoinOperator
    hasIndividualJoinOperators?: boolean
  }
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Option {
  label: string
  value: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filter variants supported by the data table
 */
export type FilterVariant =
  (typeof FILTER_VARIANTS)[keyof typeof FILTER_VARIANTS]

/**
 * Filter operators supported by the data table
 */
export type FilterOperator =
  (typeof FILTER_OPERATORS)[keyof typeof FILTER_OPERATORS]

/**
 * Join operators for combining multiple filters
 */
export type JoinOperator = (typeof JOIN_OPERATORS)[keyof typeof JOIN_OPERATORS]

/**
 * Extended column filter with additional metadata
 */
export interface ExtendedColumnFilter<TData> {
  id: Extract<keyof TData, string>
  value: string | string[]
  variant: FilterVariant
  operator: FilterOperator
  filterId: string
  joinOperator?: JoinOperator // Individual join operator for each filter
  // You can extend with additional properties if needed
}

/** Global filter type */
export type GlobalFilter = string | Record<string, unknown>

/**
 * Extended column sort (for URL state management)
 */
export interface ExtendedColumnSort<TData> {
  id: Extract<keyof TData, string>
  desc: boolean
  // You can extend with additional properties if needed
}

/**
 * Query keys for URL state management
 */
export interface QueryKeys {
  page?: string
  perPage?: string
  sort?: string
  filters?: string
  joinOperator?: string
  // Additional keys can be added as needed
}

// ============================================================================
// COLUMN DEFINITION
// ============================================================================

/**
 * Extended column definition for data table
 * Inherits all TanStack Table ColumnDef properties
 */
export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  // You can extend with additional properties if needed
}

// ============================================================================
// ROW TYPES
// ============================================================================

/**
 * Data table row type
 * Alias for TanStack Table Row
 */
export type DataTableRow<TData> = Row<TData> & {
  // You can extend with additional properties if needed
}

export type DataTable<TData> = Table<TData> & {
  // You can extend with additional properties if needed
}

// ============================================================================
// CONVENIENCE TYPE HELPERS
// ============================================================================

/**
 * Convenience type for accessing constant values with better type safety
 */
export type JoinOperatorValues = typeof JOIN_OPERATORS
export type FilterOperatorValues = typeof FILTER_OPERATORS
export type FilterVariantValues = typeof FILTER_VARIANTS

/**
 * Utility type to get the literal values from constant objects
 */
export type ValueOf<T> = T[keyof T]
