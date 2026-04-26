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
/**
 * Table range filter component
 * @description A range filter component for DataTable that allows users to filter data based on numerical ranges.
 */

import type { Column } from "@tanstack/react-table"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ExtendedColumnFilter } from "../types"

interface TableRangeFilterProps<TData> extends React.ComponentProps<"div"> {
  filter: ExtendedColumnFilter<TData>
  column: Column<TData>
  inputId: string
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
}

export function TableRangeFilter<TData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  className,
  ...props
}: TableRangeFilterProps<TData>) {
  const meta = column.columnDef.meta

  // Capture faceted min/max as scalars so the memo refreshes on data change
  // (column ref alone is stable across faceted-row updates).
  const metaRange = column.columnDef.meta?.range
  const facetedValues = column.getFacetedMinMaxValues()
  const facetedMin = facetedValues?.[0]
  const facetedMax = facetedValues?.[1]
  const [min, max] = React.useMemo<[number, number]>(() => {
    if (Array.isArray(metaRange) && metaRange.length === 2) {
      const [a, b] = metaRange as [number, number]
      return [a, b]
    }
    if (facetedMin != null && facetedMax != null) {
      return [Number(facetedMin), Number(facetedMax)]
    }
    return [0, 100]
  }, [metaRange, facetedMin, facetedMax])

  // Plain-string formatter — `<input type="number">` requires a parsable
  // value, so locale-formatted output (commas, NBSPs) breaks the input.
  const formatValue = React.useCallback(
    (value: string | number | undefined) => {
      if (value === undefined || value === "") return ""
      const numValue = Number(value)
      return Number.isNaN(numValue) ? "" : String(numValue)
    },
    [],
  )

  const value = React.useMemo(() => {
    if (Array.isArray(filter.value)) return filter.value.map(formatValue)
    return [formatValue(filter.value), ""]
  }, [filter.value, formatValue])

  const onRangeValueChange = React.useCallback(
    (value: string | number, isMin?: boolean) => {
      const numValue = Number(value)
      const currentValues = Array.isArray(filter.value)
        ? filter.value
        : ["", ""]
      const otherValue = isMin
        ? (currentValues[1] ?? "")
        : (currentValues[0] ?? "")

      if (
        value === "" ||
        (!Number.isNaN(numValue) &&
          (isMin
            ? numValue >= min && numValue <= (Number(otherValue) || max)
            : numValue <= max && numValue >= (Number(otherValue) || min)))
      ) {
        onFilterUpdate(filter.filterId, {
          value: isMin
            ? [String(value), String(otherValue)]
            : [String(otherValue), String(value)],
        })
      }
    },
    [filter.filterId, filter.value, min, max, onFilterUpdate],
  )

  return (
    <div
      data-slot="range"
      className={cn("flex w-full items-center gap-2", className)}
      {...props}
    >
      <Input
        id={`${inputId}-min`}
        type="number"
        aria-label={`${meta?.label} minimum value`}
        aria-valuemin={min}
        aria-valuemax={max}
        data-slot="range-min"
        inputMode="numeric"
        placeholder={min.toString()}
        min={min}
        max={max}
        className="h-8 w-full rounded"
        defaultValue={value[0]}
        onChange={event => onRangeValueChange(String(event.target.value), true)}
      />
      <span className="sr-only shrink-0 text-muted-foreground">to</span>
      <Input
        id={`${inputId}-max`}
        type="number"
        aria-label={`${meta?.label} maximum value`}
        aria-valuemin={min}
        aria-valuemax={max}
        data-slot="range-max"
        inputMode="numeric"
        placeholder={max.toString()}
        min={min}
        max={max}
        className="h-8 w-full rounded"
        defaultValue={value[1]}
        onChange={event => onRangeValueChange(String(event.target.value))}
      />
    </div>
  )
}
