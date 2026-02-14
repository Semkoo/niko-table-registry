"use client"

/**
 * Table faceted filter component
 * @description A faceted filter component for DataTable that allows users to filter data based on multiple selectable options. It supports both single and multiple selection modes.
 */

import type { Column } from "@tanstack/react-table"
import { Check, PlusCircle, XCircle } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { ExtendedColumnFilter, Option } from "../types"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
} from "../lib/constants"

export interface TableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: Option[]
  multiple?: boolean
  /**
   * Callback fired when filter value changes
   * Useful for server-side filtering or external state management
   */
  onValueChange?: (value: string[] | undefined) => void
  /**
   * Optional custom trigger element
   */
  trigger?: React.ReactNode
}

export function useTableFacetedFilter<TData>({
  column,
  onValueChange,
  multiple,
}: {
  column?: Column<TData, unknown>
  onValueChange?: (value: string[] | undefined) => void
  multiple?: boolean
}) {
  const columnFilterValue = column?.getFilterValue()

  // Handle both ExtendedColumnFilter format (new) and legacy array format
  const selectedValues = React.useMemo(() => {
    // Handle ExtendedColumnFilter format (from filter menu or new faceted filter)
    if (
      columnFilterValue &&
      typeof columnFilterValue === "object" &&
      !Array.isArray(columnFilterValue) &&
      "value" in columnFilterValue
    ) {
      const filterValue = (columnFilterValue as ExtendedColumnFilter<TData>)
        .value
      return new Set(
        Array.isArray(filterValue) ? filterValue : [String(filterValue)],
      )
    }
    // Handle legacy array format (backward compatibility)
    return new Set(Array.isArray(columnFilterValue) ? columnFilterValue : [])
  }, [columnFilterValue])

  const onItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      if (!column) return

      if (multiple) {
        const newSelectedValues = new Set(selectedValues)
        if (isSelected) {
          newSelectedValues.delete(option.value)
        } else {
          newSelectedValues.add(option.value)
        }
        const filterValues = Array.from(newSelectedValues)

        if (filterValues.length === 0) {
          column.setFilterValue(undefined)
          onValueChange?.(undefined)
        } else {
          // Create ExtendedColumnFilter format for interoperability with filter menu
          // FORCE variant to multi_select when using IN operator to ensure it shows up in the menu
          const extendedFilter: ExtendedColumnFilter<TData> = {
            id: column.id as Extract<keyof TData, string>,
            value: filterValues,
            variant: FILTER_VARIANTS.MULTI_SELECT,
            operator: FILTER_OPERATORS.IN,
            filterId: `faceted-${column.id}`,
            joinOperator: JOIN_OPERATORS.AND,
          }
          column.setFilterValue(extendedFilter)
          onValueChange?.(filterValues)
        }
      } else {
        // Single selection
        if (isSelected) {
          column.setFilterValue(undefined)
          onValueChange?.(undefined)
        } else {
          // Create ExtendedColumnFilter format for single selection
          // Use EQUAL operator for single select
          const extendedFilter: ExtendedColumnFilter<TData> = {
            id: column.id as Extract<keyof TData, string>,
            value: option.value, // Single value, not array
            variant: FILTER_VARIANTS.SELECT,
            operator: FILTER_OPERATORS.EQ,
            filterId: `faceted-${column.id}`,
            joinOperator: JOIN_OPERATORS.AND,
          }
          column.setFilterValue(extendedFilter)
          onValueChange?.([option.value])
        }
      }
    },
    [column, multiple, selectedValues, onValueChange],
  )

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation()
      column?.setFilterValue(undefined)
      onValueChange?.(undefined)
    },
    [column, onValueChange],
  )

  return {
    selectedValues,
    onItemSelect,
    onReset,
  }
}

export function TableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  multiple,
  onValueChange,
  trigger,
}: TableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false)

  const { selectedValues, onItemSelect, onReset } = useTableFacetedFilter({
    column,
    onValueChange,
    multiple,
  })

  // Wrap onItemSelect to close multiple=false popover
  const handleItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      onItemSelect(option, isSelected)
      if (!multiple) {
        setOpen(false)
      }
    },
    [onItemSelect, multiple, setOpen],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            {selectedValues?.size > 0 ? (
              <div
                role="button"
                aria-label={`Clear ${title} filter`}
                tabIndex={0}
                onClick={onReset}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onReset(e as unknown as React.MouseEvent)
                  }
                }}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                <XCircle className="size-4" />
              </div>
            ) : (
              <PlusCircle className="size-4" />
            )}
            {title}
            {selectedValues?.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden items-center gap-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {selectedValues.size} selected
                    </Badge>
                  ) : (
                    options
                      .filter(option => selectedValues.has(option.value))
                      .map(option => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <TableFacetedFilterContent
          title={title}
          options={options}
          selectedValues={selectedValues}
          onItemSelect={handleItemSelect}
          onReset={onReset}
        />
      </PopoverContent>
    </Popover>
  )
}

export function TableFacetedFilterContent({
  title,
  options,
  selectedValues,
  onItemSelect,
  onReset,
}: {
  title?: string
  options: Option[]
  selectedValues: Set<string>
  onItemSelect: (option: Option, isSelected: boolean) => void
  onReset: (event?: React.MouseEvent) => void
}) {
  return (
    <Command>
      <CommandInput placeholder={title} className="pl-2" />
      <CommandList className="max-h-full">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup className="max-h-75 overflow-x-hidden overflow-y-auto">
          {options.map(option => {
            const isSelected = selectedValues.has(option.value)

            return (
              <CommandItem
                key={option.value}
                onSelect={() => onItemSelect(option, isSelected)}
              >
                <div
                  className={cn(
                    "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <Check className="size-4" />
                </div>
                {option.icon && <option.icon className="mr-2 size-4" />}
                <span className="truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="ml-auto font-mono text-xs">
                    {option.count}
                  </span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {selectedValues.size > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => onReset()}
                className="justify-center text-center"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableFacetedFilter.displayName = "TableFacetedFilter"
