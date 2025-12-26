"use client"

import { useDataTable } from "../core"
import {
  TableClearFilter,
  type TableClearFilterProps,
} from "../filters/table-clear-filter"

type DataTableClearFilterProps<TData> = Omit<
  TableClearFilterProps<TData>,
  "table"
>

/**
 * Context-aware clear filter button component that automatically gets the table from DataTableRoot context.
 * Automatically hides when there are no active filters to clear.
 *
 * @example - Clear all filters (default)
 * <DataTableClearFilter />
 *
 * @example - Only reset column filters, keep search
 * <DataTableClearFilter enableResetGlobalFilter={false} />
 *
 * @example - Only reset search, keep column filters
 * <DataTableClearFilter enableResetColumnFilters={false} />
 *
 * @example - Only reset sorting
 * <DataTableClearFilter enableResetColumnFilters={false} enableResetGlobalFilter={false} />
 *
 * @example - Custom styling and text
 * <DataTableClearFilter
 *   variant="ghost"
 *   size="sm"
 *   className="text-red-500"
 * >
 *   Clear All
 * </DataTableClearFilter>
 *
 * @example - Without icon
 * <DataTableClearFilter showIcon={false}>
 *   Reset Filters
 * </DataTableClearFilter>
 */
export function DataTableClearFilter<TData>(
  props: DataTableClearFilterProps<TData>,
) {
  const { table } = useDataTable<TData>()
  return <TableClearFilter table={table} {...props} />
}

DataTableClearFilter.displayName = "DataTableClearFilter"
