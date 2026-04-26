"use client"

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
import React from "react"
import { useDataTable } from "../core/data-table-context"
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

  /**
   * BUG: stale counts on filter changes — see `data-table-filter-menu.tsx`
   * for full doc. We capture pristine caller options in a ref and rebuild
   * `meta.options` from that source on every augment so counts refresh
   * (and zeroes get filled in for the count-0 hide rule).
   */
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
        // See `data-table-filter-menu.tsx` for the staleness rationale.
        // We stash the pristine options on `meta` so the next augment can
        // rebuild from them instead of from the previous augment's output.
        const metaWithStash = meta as typeof meta & {
          __nikoOriginalOptions?: Option[]
        }
        if (!metaWithStash.__nikoOriginalOptions) {
          metaWithStash.__nikoOriginalOptions = meta.options
        }
        const original = metaWithStash.__nikoOriginalOptions
        const countMap = new Map(gen.map(o => [o.value, o.count]))
        meta.options = original.map((opt: Option) => ({
          ...opt,
          count: showCounts ? (countMap.get(opt.value) ?? 0) : undefined,
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
