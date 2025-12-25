"use client"

import React from "react"
import { useDataTable } from "../core"
import {
  TableInline,
  type TableInlineProps,
} from "../filters/table-inline-filter"
import { useGeneratedOptions } from "../hooks/use-generated-options"
import { FILTER_VARIANTS } from "../lib/constants"
import type { Option } from "../types"

type BaseInlineProps<TData> = Omit<TableInlineProps<TData>, "table">

interface AutoOptionProps {
  autoOptions?: boolean
  showCounts?: boolean
  dynamicCounts?: boolean
  /**
   * If true, only generate options from filtered rows. If false, generate from all rows.
   * This controls which rows are used to generate the option list itself.
   * Note: This is separate from dynamicCounts which controls count calculation.
   * @default true
   */
  limitToFilteredRows?: boolean
  includeColumns?: string[]
  excludeColumns?: string[]
  limitPerColumn?: number
  mergeStrategy?: "preserve" | "augment" | "replace"
}

type DataTableInlineFilterProps<TData> = BaseInlineProps<TData> &
  AutoOptionProps

export function DataTableInlineFilter<TData>({
  autoOptions = true,
  showCounts = true,
  dynamicCounts = true,
  limitToFilteredRows = true,
  includeColumns,
  excludeColumns,
  limitPerColumn,
  mergeStrategy = "preserve",
  ...props
}: DataTableInlineFilterProps<TData>) {
  const { table } = useDataTable<TData>()

  const generatedOptions = useGeneratedOptions(table, {
    showCounts,
    dynamicCounts,
    limitToFilteredRows,
    includeColumns,
    excludeColumns,
    limitPerColumn,
  })

  // Mutate meta.options for select/multi-select columns similar to menu wrapper
  // This keeps TableInline copy-paste friendly without extra props.
  // Memo to avoid repeated mutation on every render.
  React.useMemo(() => {
    if (!autoOptions) return null
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
    })
  }, [autoOptions, generatedOptions, mergeStrategy, showCounts, table])

  return <TableInline table={table} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTableInlineFilter.displayName = "DataTableInlineFilter"
