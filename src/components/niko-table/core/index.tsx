// Core table components
export { DataTableRoot } from "./data-table-root"
export type { DataTableConfig } from "./data-table-root"
export {
  DataTableProvider,
  useDataTable,
  DataTableContext,
} from "./data-table-context"
export { DataTable } from "./data-table"
export { DataTableErrorBoundary } from "./data-table-error-boundary"
export type { DataTableErrorBoundaryProps } from "./data-table-error-boundary"

// Regular table structure (Header, Body, EmptyBody, Skeleton, Loading) - consolidated for easy copy/paste
export {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
  DataTableSkeleton,
  DataTableLoading,
} from "./data-table-structure"
export type {
  ScrollEvent,
  DataTableHeaderProps,
  DataTableBodyProps,
  DataTableEmptyBodyProps,
  DataTableSkeletonProps,
  DataTableLoadingProps,
} from "./data-table-structure"

// Virtualized table structure (VirtualizedHeader, VirtualizedBody, VirtualizedEmptyBody, VirtualizedSkeleton, VirtualizedLoading) - consolidated for easy copy/paste
export {
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTableVirtualizedSkeleton,
  DataTableVirtualizedLoading,
} from "./data-table-virtualized-structure"
export type {
  DataTableVirtualizedHeaderProps,
  DataTableVirtualizedBodyProps,
  DataTableVirtualizedEmptyBodyProps,
  DataTableVirtualizedSkeletonProps,
  DataTableVirtualizedLoadingProps,
} from "./data-table-virtualized-structure"
// Note: ScrollEvent is exported from data-table-structure above to avoid duplicate exports

// Types
export type { DataTableContextState } from "./data-table-context"
export type { DataTableContainerProps } from "./data-table"
