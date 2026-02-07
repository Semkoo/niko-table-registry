"use client"

import React from "react"
import type { Column } from "@tanstack/react-table"
import type { DateRange } from "react-day-picker"
import { CircleHelp, CalendarIcon, CalendarX2 } from "lucide-react"

import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useDerivedColumnTitle } from "../hooks"
import { formatDate } from "../lib/format"
import { cn } from "@/lib/utils"

type DateSelection = Date[] | DateRange

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (!timestamp) return undefined
  const numericTimestamp =
    typeof timestamp === "string" ? Number(timestamp) : timestamp
  const date = new Date(numericTimestamp)
  return !Number.isNaN(date.getTime()) ? date : undefined
}

function parseColumnFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === "number" || typeof item === "string") {
        return item
      }
      return undefined
    })
  }

  if (typeof value === "string" || typeof value === "number") {
    return [value]
  }

  return []
}

/**
 * Date filter options for composing inside TableColumnActions.
 * Renders as button that opens a popover with calendar picker - matches FilterDatePicker from table-filter-menu.
 *
 * @example
 * ```tsx
 * // Inside TableColumnActions
 * <TableColumnActions column={column}>
 *   <TableColumnDateFilterOptions
 *     column={column}
 *     multiple
 *   />
 * </TableColumnActions>
 * ```
 */
export function TableColumnDateFilterOptions<TData, TValue>({
  column,
  title,
  multiple = true,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
  title?: string
  /** Whether to allow date range selection. Defaults to true. */
  multiple?: boolean
  /** Whether to render a separator before the options. Defaults to true. */
  withSeparator?: boolean
}) {
  const [showValueSelector, setShowValueSelector] = React.useState(false)
  const columnFilterValue = column.getFilterValue()

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : []
    }

    if (multiple) {
      const timestamps = parseColumnFilterValue(columnFilterValue)
      return {
        from: parseAsDate(timestamps[0]),
        to: parseAsDate(timestamps[1]),
      }
    }

    const timestamps = parseColumnFilterValue(columnFilterValue)
    const date = parseAsDate(timestamps[0])
    return date ? [date] : []
  }, [columnFilterValue, multiple])

  const derivedTitle = useDerivedColumnTitle(column, column.id, title)
  const labelText = multiple ? "Date Range Filter" : "Date Filter"
  const tooltipText = multiple
    ? "Select a date range to filter"
    : "Select a date to filter"

  const dateValue = Array.isArray(selectedDates)
    ? selectedDates.filter(Boolean)
    : [selectedDates.from, selectedDates.to].filter(Boolean)

  const displayValue =
    multiple && dateValue.length === 2
      ? `${formatDate(dateValue[0] as Date)} - ${formatDate(dateValue[1] as Date)}`
      : dateValue[0]
        ? formatDate(dateValue[0] as Date)
        : "Pick a date"

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (!date) {
        column.setFilterValue(undefined)
        return
      }

      if (multiple && !("getTime" in date)) {
        const from = date.from?.getTime()
        const to = date.to?.getTime()

        if (from && to) {
          column.setFilterValue([from, to])
        } else if (from) {
          column.setFilterValue([from])
        } else {
          column.setFilterValue(undefined)
        }
      } else if (!multiple && "getTime" in date) {
        column.setFilterValue([date.getTime()])
      }
    },
    [column, multiple],
  )

  const onReset = React.useCallback(() => {
    column.setFilterValue(undefined)
  }, [column])

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
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start rounded text-left font-normal",
                !columnFilterValue && "text-muted-foreground",
              )}
            >
              <CalendarIcon />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            {multiple ? (
              <Calendar
                mode="range"
                captionLayout="dropdown"
                selected={selectedDates as DateRange}
                onSelect={onSelect as (date: DateRange | undefined) => void}
              />
            ) : (
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={(selectedDates as Date[])[0]}
                onSelect={onSelect as (date: Date | undefined) => void}
              />
            )}
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="mt-2 w-full"
        >
          Clear
        </Button>
      </div>
    </>
  )
}

TableColumnDateFilterOptions.displayName = "TableColumnDateFilterOptions"

/**
 * Standalone date filter menu for column headers.
 * Shows a filter button that opens a popover with a calendar picker.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <TableColumnDateFilterMenu
 *   column={column}
 *   multiple
 * />
 * ```
 */
export function TableColumnDateFilterMenu<TData, TValue>({
  column,
  title,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof TableColumnDateFilterOptions>,
  "withSeparator" | "column"
> & {
  column: Column<TData, TValue>
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity dark:text-muted-foreground",
            column.getIsFiltered() && "text-primary",
            className,
          )}
        >
          {column.getIsFiltered() ? (
            <CalendarX2 className="size-3.5" />
          ) : (
            <CalendarIcon className="size-3.5" />
          )}
          <span className="sr-only">Filter by date</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <TableColumnDateFilterOptions
          column={column}
          title={title}
          withSeparator={false}
          {...props}
        />
      </PopoverContent>
    </Popover>
  )
}

TableColumnDateFilterMenu.displayName = "TableColumnDateFilterMenu"
