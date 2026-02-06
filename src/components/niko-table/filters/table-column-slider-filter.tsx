"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"
import { CircleHelp } from "lucide-react"

import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useDerivedColumnTitle } from "../hooks"

type RangeValue = [number, number]

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

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  )
}

/**
 * Slider filter options for composing inside TableColumnActions.
 * Renders as inline slider with min/max inputs.
 *
 * @example
 * ```tsx
 * // Inside TableColumnActions
 * <TableColumnActions column={column}>
 *   <TableColumnSliderFilterOptions
 *     column={column}
 *     min={0}
 *     max={1000}
 *   />
 * </TableColumnActions>
 * ```
 */
export function TableColumnSliderFilterOptions<TData, TValue>({
  column,
  title,
  range: manualRange,
  min: manualMin,
  max: manualMax,
  step: manualStep,
  unit: manualUnit,
  onValueChange,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
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
  /** Whether to render a separator before the options. Defaults to true. */
  withSeparator?: boolean
}) {
  const id = React.useId()

  const columnFilterValue = parseValuesAsNumbers(column.getFilterValue())

  const defaultRange = column.columnDef.meta?.range
  const unit = manualUnit ?? column.columnDef.meta?.unit

  // Compute range values - memoized to avoid recalculation
  const { min, max, step } = React.useMemo<{
    min: number
    max: number
    step: number
  }>(() => {
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

  const derivedTitle = useDerivedColumnTitle(column, column.id, title)
  const labelText = "Range Filter"
  const tooltipText = "Set a range to filter values"

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

  const onReset = React.useCallback(() => {
    applyFilterValue(undefined)
  }, [applyFilterValue])

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <span>{labelText}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            {tooltipText}
            {derivedTitle && ` - ${derivedTitle}`}
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      <div className="px-2 py-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-from`} className="sr-only">
              From
            </Label>
            <div className="relative flex-1">
              <Input
                key={`${id}-from-${range[0]}`}
                id={`${id}-from`}
                type="number"
                aria-label={`${derivedTitle} minimum value`}
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
                className={cn("h-8 w-full", unit && "pr-8")}
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
            <div className="relative flex-1">
              <Input
                key={`${id}-to-${range[1]}`}
                id={`${id}-to`}
                type="number"
                aria-label={`${derivedTitle} maximum value`}
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
                className={cn("h-8 w-full", unit && "pr-8")}
              />
              {unit && (
                <span className="absolute top-0 right-0 bottom-0 mt-0.5 mr-0.5 flex h-7 items-center rounded-r-md bg-accent px-2 text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          </div>
          <Label htmlFor={`${id}-slider`} className="sr-only">
            {derivedTitle} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={range}
            onValueChange={onSliderValueChange}
            className="w-full"
          />
          <Button
            aria-label={`Clear ${derivedTitle} filter`}
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
          >
            Clear
          </Button>
        </div>
      </div>
    </>
  )
}

TableColumnSliderFilterOptions.displayName = "TableColumnSliderFilterOptions"
