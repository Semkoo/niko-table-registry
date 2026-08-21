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

/**
 * Canonical TanStack Table v9 feature registration for DataTable.
 *
 * In Table v8, every behavior was bundled into `useReactTable`. In Table v9 you
 * import only what you need — the same principle as this registry: Composable —
 * mix and match components (install only the registry pieces you need).
 * `DataTable*` components are the UI layer of that idea; this file is the
 * engine layer.
 *
 * `DataTableRoot` passes this object to `useTable`. Feature detection /
 * `enable*` flags still decide *when* behavior runs; registration decides
 * *whether the API exists at all*. Delete features, row models, and built-in
 * `sortFns` / `aggregationFns` your tables never use — you own this file after
 * install, just like every other copied component.
 *
 * Pass `DataTableFeatures` as the first generic to `ColumnDef`, `Column`,
 * `Row`, and `ReactTable` so feature-gated APIs typecheck. For column defs,
 * `createDataTableColumnHelper<TData>()` is the runtime counterpart — it
 * pre-binds that generic the same way `DataTableColumnDef<TData>` does.
 */

import {
  aggregationFn_count,
  aggregationFn_extent,
  aggregationFn_first,
  aggregationFn_last,
  aggregationFn_max,
  aggregationFn_mean,
  aggregationFn_median,
  aggregationFn_min,
  aggregationFn_sum,
  aggregationFn_unique,
  aggregationFn_uniqueCount,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
  tableFeatures,
  type RowData,
} from "@tanstack/react-table"

import {
  dateRangeFilter,
  extendedFilter,
  numberRangeFilter,
} from "./filter-functions"

export const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  filterFns: {
    extended: extendedFilter,
    numberRange: numberRangeFilter,
    dateRange: dateRangeFilter,
  },
  // Registered individually rather than via the bulk `sortFns` / `aggregationFns`
  // exports (deprecated in v9): the keys below are the names columns may use in
  // `sortFn` / `aggregationFn`, and `'auto'` resolves only what is registered.
  // Delete any your tables never reference to shrink the bundle.
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
    textCaseSensitive: sortFn_textCaseSensitive,
  },
  aggregationFns: {
    count: aggregationFn_count,
    extent: aggregationFn_extent,
    first: aggregationFn_first,
    last: aggregationFn_last,
    max: aggregationFn_max,
    mean: aggregationFn_mean,
    median: aggregationFn_median,
    min: aggregationFn_min,
    sum: aggregationFn_sum,
    unique: aggregationFn_unique,
    uniqueCount: aggregationFn_uniqueCount,
  },
})

export type DataTableFeatures = typeof features

/**
 * Pre-bound column helper for DataTable. TanStack v9's `createColumnHelper`
 * needs the features generic first (`createColumnHelper<DataTableFeatures, TData>()`);
 * this wraps that the same way `DataTableColumnDef<TData>` pre-binds features.
 *
 * Prefer the helper when you want typed `getValue()` in cells. Prefer a plain
 * `DataTableColumnDef<TData>[]` array for dynamic columns and copy-paste examples.
 */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}
