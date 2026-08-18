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
 * Canonical TanStack Table v9 feature registration for Niko Table.
 *
 * Registers every feature Niko may enable (sorting, filtering, pagination,
 * selection, expanding, grouping/aggregation, faceting, column visibility /
 * order / pinning / sizing / resizing) plus the row models and custom filter
 * fns Root wires today. Detection / `enable*` flags still control behavior;
 * this object keeps APIs and types stable across tables.
 *
 * Pass `NikoTableFeatures` as the first generic to `ColumnDef`, `Column`,
 * `Row`, and `ReactTable` so feature-gated APIs typecheck.
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

export type NikoTableFeatures = typeof features
