"use client"

import type { Table } from "@tanstack/react-table"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

export interface TableSearchFilterProps<TData> {
  table: Table<TData>
  className?: string
  placeholder?: string
  showClearButton?: boolean
  onChange?: (value: string) => void
  value?: string
}

export function TableSearchFilter<TData>({
  table,
  className,
  placeholder = "Search...",
  showClearButton = true,
  onChange,
  value,
}: TableSearchFilterProps<TData>) {
  // Determine if we're in controlled mode
  const isControlled = value !== undefined

  // Get current globalFilter from table state
  const tableGlobalFilter = table.getState().globalFilter
  const globalFilterValue =
    typeof tableGlobalFilter === "string" ? tableGlobalFilter : ""

  // Use controlled value if provided, otherwise use table's globalFilter
  const currentValue = isControlled ? value : globalFilterValue

  const handleClear = React.useCallback(() => {
    table.setGlobalFilter("")
    onChange?.("")
  }, [table, onChange])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      table.setGlobalFilter(newValue)
      onChange?.(newValue)
    },
    [table, onChange],
  )

  const hasValue = currentValue.length > 0

  return (
    <div
      className={cn("relative flex flex-1 items-center", className)}
      role="search"
    >
      <Search
        className="absolute left-3 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        className="pr-9 pl-9"
        aria-label="Search table"
      />
      {hasValue && showClearButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 h-7 w-7 p-0 hover:bg-muted"
          type="button"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see src/components/data-table/config/feature-detection.ts
 */
TableSearchFilter.displayName = "TableSearchFilter"
