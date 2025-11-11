"use client"

import { useDataTable } from "../core"
import {
  TableSliderFilter,
  type TableSliderFilterProps,
} from "../filters/table-slider-filter"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"

type DataTableSliderFilterProps<TData> = Omit<
  TableSliderFilterProps<TData>,
  "column" | "title"
> & {
  /**
   * The accessor key of the column to filter (matches column definition)
   */
  accessorKey: keyof TData & string
  /**
   * Optional title override (if not provided, will use column.meta.label)
   */
  title?: string
}

/**
 * A slider filter component that automatically connects to the DataTable context
 * and derives the title from column metadata.
 *
 * @example -  Auto-detect everything from column metadata and data
 * const columns: DataTableColumnDef[] = [{ accessorKey: "price",..., meta: { label: "Price", unit: "$", range: [0, 1000] } },...]
 * <DataTableSliderFilter accessorKey="price" />
 *
 * @example - Custom range shorthand with unit
 * <DataTableSliderFilter
 *   accessorKey="price"
 *   range={[0, 1000]}
 *   unit="$"
 * />
 *
 * @example - Individual min/max control
 * <DataTableSliderFilter
 *   accessorKey="rating"
 *   min={1}
 *   max={5}
 *   step={0.5}
 * />
 *
 * @example - Full manual control with custom title
 * <DataTableSliderFilter
 *   accessorKey="distance"
 *   title="Distance Range"
 *   range={[0, 100]}
 *   step={5}
 *   unit="km"
 * />
 */

export function DataTableSliderFilter<TData>({
  accessorKey,
  title,
  ...props
}: DataTableSliderFilterProps<TData>) {
  const { table } = useDataTable<TData>()
  const column = table.getColumn(accessorKey as string)

  const derivedTitle = useDerivedColumnTitle(column, String(accessorKey), title)

  // Early return if column not found
  if (!column) {
    console.warn(
      `Column with accessorKey "${accessorKey}" not found in table columns`,
    )
    return null
  }

  return <TableSliderFilter column={column} title={derivedTitle} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableSliderFilter.displayName = "DataTableSliderFilter"
