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
import { TableFilterMenu } from "../filters/table-filter-menu"
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
  /**
   * If true, only generate options from filtered rows. If false, generate from all rows.
   * This controls which rows are used to generate the option list itself.
   * Note: This is separate from dynamicCounts which controls count calculation.
   * @default true
   */
  limitToFilteredRows?: boolean
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
  limitToFilteredRows = true,
  includeColumns,
  excludeColumns,
  limitPerColumn,
  mergeStrategy = "preserve",
  ...props
}: DataTableFilterMenuProps<TData>) {
  const { table, generatedOptionsMap } = useDataTable<TData>()

  // Batch options are computed upstream in DataTableProvider.
  // Keep local shaping props (include/exclude/limit/showCounts) for API parity.
  const generatedOptions = React.useMemo(() => {
    const includeSet = includeColumns ? new Set(includeColumns) : null
    const excludeSet = excludeColumns ? new Set(excludeColumns) : null

    const entries = Object.entries(generatedOptionsMap)
      .filter(([columnId]) => {
        if (includeSet && !includeSet.has(columnId)) return false
        if (excludeSet && excludeSet.has(columnId)) return false
        return true
      })
      .map(([columnId, options]) => {
        const limited =
          typeof limitPerColumn === "number" && limitPerColumn > 0
            ? options.slice(0, limitPerColumn)
            : options
        const normalized = showCounts
          ? limited
          : limited.map(opt => ({ ...opt, count: undefined }))
        return [columnId, normalized]
      })

    return Object.fromEntries(entries) as Record<string, Option[]>
  }, [
    generatedOptionsMap,
    includeColumns,
    excludeColumns,
    limitPerColumn,
    showCounts,
  ])

  // Data source selection (dynamicCounts/limitToFilteredRows) now lives in the
  // provider-level batch computation, so these props are intentionally read-only.
  void dynamicCounts
  void limitToFilteredRows

  /**
   * BUG: stale counts on filter changes
   *
   * WHY: We mutate `column.columnDef.meta.options` to inject counts. After
   * the first augment pass, every option already carries `count`. On the
   * next render we'd read those (now-stale) counts back, so a `count: 5`
   * pinned at first render would survive even after a filter narrowed the
   * matching rows to 0.
   *
   * IMPACT: Cross-filter narrowing (count-0 hide rule) couldn't fire because
   * counts were frozen at their first-render value.
   *
   * WHAT: Capture each column's caller-supplied options ONCE in a ref and
   * rebuild `meta.options` from that pristine source on every augment pass.
   * Counts always come from the fresh `countMap`, with `0` filled in for
   * values absent from the cross-filtered row set so the count-0 hide rule
   * has something to act on.
   */
  React.useMemo(() => {
    if (!autoOptions) return
    table.getAllColumns().forEach(column => {
      const meta = (column.columnDef.meta ||= {})
      const variant = String(meta.variant ?? FILTER_VARIANTS.TEXT)
      const isSelectVariant = variant === FILTER_VARIANTS.SELECT
      const isMultiSelectVariant = variant === FILTER_VARIANTS.MULTI_SELECT

      if (!isSelectVariant && !isMultiSelectVariant) return
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
        // Stash the caller's pristine options on the meta object itself
        // (private prop) the first time we see this column — subsequent
        // augments rebuild from this stash so counts can refresh instead
        // of being pinned at first-render values.
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
      // preserve: do nothing
    })
  }, [autoOptions, generatedOptions, mergeStrategy, showCounts, table])

  return (
    <TableFilterMenu<TData>
      table={table}
      precomputedOptions={generatedOptions}
      {...props}
    />
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */
DataTableFilterMenu.displayName = "DataTableFilterMenu"
