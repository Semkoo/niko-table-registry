import type { Table, Row } from "@tanstack/react-table"

/**
 * Get filtered rows excluding a specific column's filter.
 * This is useful when generating options for a column - we want to see
 * options that exist in the filtered dataset (from other filters) but
 * not be limited by the current column's own filter.
 */
export function getFilteredRowsExcludingColumn<TData>(
  table: Table<TData>,
  coreRows: Row<TData>[],
  excludeColumnId: string,
  columnFilters: Array<{ id: string; value: unknown }>,
  globalFilter: unknown,
): Row<TData>[] {
  // Filter out the current column's filter
  const otherFilters = columnFilters.filter(
    filter => filter.id !== excludeColumnId,
  )

  // If no filters to apply (excluding the current column), return core rows
  if (otherFilters.length === 0 && !globalFilter) {
    return coreRows
  }

  // Filter rows manually, excluding the current column's filter
  return coreRows.filter(row => {
    // Apply column filters (excluding the current column)
    for (const filter of otherFilters) {
      const column = table.getColumn(filter.id)
      if (!column) continue

      const filterValue = filter.value
      const filterFn = column.columnDef.filterFn || "extended"

      // Skip if filter function is a string (built-in) and we don't have access
      if (typeof filterFn === "string") {
        // Use the table's filterFns
        const fn = table.options.filterFns?.[filterFn]
        if (fn && typeof fn === "function") {
          if (!fn(row, filter.id, filterValue, () => {})) {
            return false
          }
        }
      } else if (typeof filterFn === "function") {
        if (!filterFn(row, filter.id, filterValue, () => {})) {
          return false
        }
      }
    }

    // Apply global filter if present
    if (globalFilter) {
      const globalFilterFn = table.options.globalFilterFn
      if (globalFilterFn && typeof globalFilterFn === "function") {
        if (!globalFilterFn(row, "global", globalFilter, () => {})) {
          return false
        }
      }
    }

    return true
  })
}
