"use client"

import React from "react"
import { useDataTable } from "../core"
import { TableFilterMenu } from "../filters/table-filter-menu"
import { useGeneratedOptions } from "../hooks/use-generated-options"
import { FILTER_VARIANTS } from "../lib/constants"
import type { Option } from "../types"

type BaseTableFilterMenuProps<TData> = Omit<
  React.ComponentProps<typeof TableFilterMenu<TData>>,
  "table"
>

interface AutoOptionProps {
  /**
   * Automatically generate select/multiSelect options for columns lacking static options
   * @default true
   */
  autoOptions?: boolean
  /** Show counts beside each option (computed from rows) */
  showCounts?: boolean
  /** Recompute counts based on currently filtered rows */
  dynamicCounts?: boolean
  /** Only generate options for these column ids */
  includeColumns?: string[]
  /** Exclude these column ids from generation */
  excludeColumns?: string[]
  /** Limit number of generated options per column */
  limitPerColumn?: number
  /**
   * Merge strategy when static options already exist:
   * - "preserve" keeps user options untouched (default)
   * - "augment" adds counts to matching values
   * - "replace" overrides with generated options
   */
  mergeStrategy?: "preserve" | "augment" | "replace"
}

type DataTableFilterMenuProps<TData> = BaseTableFilterMenuProps<TData> &
  AutoOptionProps

/**
 * A filter menu component that automatically connects to the DataTable context.
 * Filters are managed directly by the table state - no internal state needed.
 *
 * @example - Basic usage
 * <DataTableFilterMenu />
 *
 * @example - Custom alignment and positioning
 * <DataTableFilterMenu align="end" side="bottom" />
 *
 * @example - Custom styling
 * <DataTableFilterMenu className="w-[400px]" />
 */
export function DataTableFilterMenu<TData>({
  autoOptions = true,
  showCounts = true,
  dynamicCounts = true,
  includeColumns,
  excludeColumns,
  limitPerColumn,
  mergeStrategy = "preserve",
  ...props
}: DataTableFilterMenuProps<TData>) {
  const { table } = useDataTable<TData>()

  // Generate options map (only includes select/multiSelect columns)
  const generatedOptions = useGeneratedOptions(table, {
    showCounts,
    dynamicCounts,
    includeColumns,
    excludeColumns,
    limitPerColumn,
  })

  // Apply generated options according to mergeStrategy.
  // We mutate columnDef.meta.options safely inside memo to avoid extra renders.
  React.useMemo(() => {
    if (!autoOptions) return
    table.getAllColumns().forEach(column => {
      const meta = (column.columnDef.meta ||= {})
      const variant = meta.variant ?? FILTER_VARIANTS.TEXT
      if (
        variant !== FILTER_VARIANTS.SELECT &&
        variant !== FILTER_VARIANTS.MULTI_SELECT
      )
        return
      const gen = generatedOptions[column.id]
      if (!gen || gen.length === 0) return

      if (!meta.options) {
        meta.options = gen
        return
      }

      if (mergeStrategy === "replace") {
        meta.options = gen
        return
      }

      if (mergeStrategy === "augment") {
        const countMap = new Map(gen.map(o => [o.value, o.count]))
        meta.options = meta.options.map((opt: Option) => ({
          ...opt,
          count: showCounts
            ? (countMap.get(opt.value) ?? opt.count)
            : undefined,
        }))
      }
      // preserve: do nothing
    })
  }, [autoOptions, generatedOptions, mergeStrategy, showCounts, table])

  return <TableFilterMenu<TData> table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */
DataTableFilterMenu.displayName = "DataTableFilterMenu"
