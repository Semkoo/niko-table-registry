"use client"

/**
 * Table slider filter component
 * @description A slider filter component for DataTable that allows users to filter numerical data within a specified range. It supports manual configuration of range, min/max values, step size, and unit labels.
 * @inspiration Inspired by and adapted from sadmann7's work - https://github.com/sadmann7/tablecn/blob/main/src/components/data-table/data-table-slider-filter.tsx
 */

import type { Column } from "@tanstack/react-table"
import { PlusCircle, XCircle } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface Range {
  min: number
  max: number
}

type RangeValue = [number, number]

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  )
}

function parseValuesAsNumbers(value: unknown): RangeValue | undefined {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      v => (typeof v === "string" || typeof v === "number") && !Number.isNaN(v),
    )
  ) {
    return [Number(value[0]), Number(value[1])]
  }

  return undefined
}

export interface TableSliderFilterProps<TData> {
  column: Column<TData, unknown>
  title?: string
  /**
   * Manual range [min, max] (overrides min/max props and column.meta.range)
   */
  range?: RangeValue
  /**
   * Manual minimum value (overrides column.meta.range and faceted values)
   */
  min?: number
  /**
   * Manual maximum value (overrides column.meta.range and faceted values)
   */
  max?: number
  /**
   * Manual step value for the slider
   */
  step?: number
  /**
   * Unit label to display (e.g., "$", "kg", "km")
   */
  unit?: string
  onValueChange?: (value: [number, number] | undefined) => void
}

export function TableSliderFilter<TData>({
  column,
  title,
  range: manualRange,
  min: manualMin,
  max: manualMax,
  step: manualStep,
  unit: manualUnit,
  onValueChange,
}: TableSliderFilterProps<TData>) {
  const id = React.useId()

  const columnFilterValue = parseValuesAsNumbers(column.getFilterValue())

  const defaultRange = column.columnDef.meta?.range
  const unit = manualUnit ?? column.columnDef.meta?.unit
  const label = title ?? column.columnDef.meta?.label ?? column.id

  // Compute range values - memoized to avoid recalculation
  // This is safe because we're not triggering state updates, just reading values
  const { min, max, step } = React.useMemo<Range & { step: number }>(() => {
    let minValue = 0
    let maxValue = 100

    // Priority 1: Manual range prop (highest priority)
    if (manualRange && getIsValidRange(manualRange)) {
      minValue = manualRange[0]
      maxValue = manualRange[1]
    }
    // Priority 2: Manual min/max props
    else if (manualMin != null && manualMax != null) {
      minValue = manualMin
      maxValue = manualMax
    }
    // Priority 3: Use explicit range from column metadata
    else if (defaultRange && getIsValidRange(defaultRange)) {
      minValue = defaultRange[0]
      maxValue = defaultRange[1]
    }
    // Priority 4: Get min/max from faceted values
    // This is safe in useMemo as long as we're not calling setFilterValue
    else {
      const facetedValues = column.getFacetedMinMaxValues()
      if (facetedValues?.[0] != null && facetedValues?.[1] != null) {
        minValue = Number(facetedValues[0])
        maxValue = Number(facetedValues[1])
      }
    }

    // Calculate appropriate step size based on range
    const rangeSize = maxValue - minValue
    const calculatedStep =
      rangeSize <= 20
        ? 1
        : rangeSize <= 100
          ? Math.ceil(rangeSize / 20)
          : Math.ceil(rangeSize / 50)

    return {
      min: minValue,
      max: maxValue,
      step: manualStep ?? calculatedStep,
    }
  }, [column, defaultRange, manualRange, manualMin, manualMax, manualStep])

  const range = React.useMemo((): RangeValue => {
    return columnFilterValue ?? [min, max]
  }, [columnFilterValue, min, max])

  const formatValue = React.useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [])

  const applyFilterValue = React.useCallback(
    (value: [number, number] | undefined) => {
      column.setFilterValue(value)
      onValueChange?.(value)
    },
    [column, onValueChange],
  )

  const onRangeValueChange = React.useCallback(
    (value: string | number, isMin?: boolean) => {
      const numValue = Number(value)
      const currentValues = range

      if (value === "") {
        // Allow empty value, don't update filter
        return
      }

      if (
        !Number.isNaN(numValue) &&
        (isMin
          ? numValue >= min && numValue <= currentValues[1]
          : numValue <= max && numValue >= currentValues[0])
      ) {
        applyFilterValue(
          isMin ? [numValue, currentValues[1]] : [currentValues[0], numValue],
        )
      }
    },
    [min, max, range, applyFilterValue],
  )

  const onSliderValueChange = React.useCallback(
    (value: RangeValue) => {
      if (Array.isArray(value) && value.length === 2) {
        applyFilterValue(value)
      }
    },
    [applyFilterValue],
  )

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.target instanceof HTMLDivElement) {
        event.stopPropagation()
      }
      applyFilterValue(undefined)
    },
    [applyFilterValue],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {columnFilterValue ? (
            <div
              role="button"
              aria-label={`Clear ${label} filter`}
              tabIndex={0}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              onClick={onReset}
            >
              <XCircle />
            </div>
          ) : (
            <PlusCircle />
          )}
          <span>{label}</span>
          {columnFilterValue ? (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              {formatValue(columnFilterValue[0])} -{" "}
              {formatValue(columnFilterValue[1])}
              {unit ? ` ${unit}` : ""}
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </p>
          <div className="flex items-center gap-4">
            <Label htmlFor={`${id}-from`} className="sr-only">
              From
            </Label>
            <div className="relative">
              <Input
                key={`${id}-from-${range[0]}`}
                id={`${id}-from`}
                type="number"
                aria-label={`${label} minimum value`}
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={min.toString()}
                min={min}
                max={max}
                defaultValue={range[0]}
                onChange={event =>
                  onRangeValueChange(String(event.target.value), true)
                }
                className={cn("h-8 w-24", unit && "pr-8")}
              />
              {unit && (
                <span className="absolute top-0 right-0 bottom-0 mt-0.5 mr-0.5 flex h-7 items-center rounded-r-md bg-accent px-2 text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            <Label htmlFor={`${id}-to`} className="sr-only">
              to
            </Label>
            <div className="relative">
              <Input
                key={`${id}-to-${range[1]}`}
                id={`${id}-to`}
                type="number"
                aria-label={`${label} maximum value`}
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={max.toString()}
                min={min}
                max={max}
                defaultValue={range[1]}
                onChange={event =>
                  onRangeValueChange(String(event.target.value))
                }
                className={cn("h-8 w-24", unit && "pr-8")}
              />
              {unit && (
                <span className="absolute top-0 right-0 bottom-0 mt-0.5 mr-0.5 flex h-7 items-center rounded-r-md bg-accent px-2 text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          </div>
          <Label htmlFor={`${id}-slider`} className="sr-only">
            {label} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={range}
            onValueChange={onSliderValueChange}
          />
        </div>
        <Button
          aria-label={`Clear ${label} filter`}
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableSliderFilter.displayName = "TableSliderFilter"
