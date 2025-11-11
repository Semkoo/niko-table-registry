"use client"

import { useDataTable } from "../core"
import {
  TableSearchFilter,
  type TableSearchFilterProps,
} from "../filters/table-search-filter"

type DataTableSearchFilterProps<TData> = Omit<
  TableSearchFilterProps<TData>,
  "table"
>

/**
 * A search filter component for DataTable.
 * Can be used in controlled or uncontrolled mode.
 *
 * @example
 * // Uncontrolled (manages its own state)
 * <DataTableSearchFilter placeholder="Search products..." />
 *
 * @example
 * // Controlled (you manage the state)
 * const [search, setSearch] = useState("")
 * <DataTableSearchFilter
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search..."
 * />
 *
 * @example
 * // With nuqs for URL state
 * const [search, setSearch] = useQueryState('search')
 * <DataTableSearchFilter
 *   value={search ?? ""}
 *   onChange={setSearch}
 * />
 */
export function DataTableSearchFilter<TData>(
  props: DataTableSearchFilterProps<TData>,
) {
  const { table } = useDataTable<TData>()
  return <TableSearchFilter table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */
DataTableSearchFilter.displayName = "DataTableSearchFilter"
