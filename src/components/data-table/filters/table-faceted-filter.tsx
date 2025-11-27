"use client"

/**
 * Table faceted filter component
 * @description A faceted filter component for DataTable that allows users to filter data based on multiple selectable options. It supports both single and multiple selection modes.
 * @inspiration Inspired by and adapted from sadmann7's work - https://github.com/sadmann7
 * @see https://github.com/sadmann7/tablecn/blob/main/src/components/data-table/data-table-faceted-filter.tsx
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
import type { Option } from "../types"

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
}

export function TableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  multiple,
  onValueChange,
}: TableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false)

  const columnFilterValue = column?.getFilterValue()
  const selectedValues = React.useMemo(
    () => new Set(Array.isArray(columnFilterValue) ? columnFilterValue : []),
    [columnFilterValue],
  )

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
        const finalValue = filterValues.length ? filterValues : undefined
        column.setFilterValue(finalValue)
        onValueChange?.(finalValue)
      } else {
        const finalValue = isSelected ? undefined : [option.value]
        column.setFilterValue(finalValue)
        onValueChange?.(finalValue)
        setOpen(false)
      }
    },
    [column, multiple, selectedValues, onValueChange, setOpen],
  )

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation()
      column?.setFilterValue(undefined)
      onValueChange?.(undefined)
    },
    [column, onValueChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
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
              <XCircle />
            </div>
          ) : (
            <PlusCircle />
          )}
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
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
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
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
                        "flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="size-4" />
                    </div>
                    {option.icon && <option.icon className="size-4" />}
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
      </PopoverContent>
    </Popover>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableFacetedFilter.displayName = "TableFacetedFilter"
