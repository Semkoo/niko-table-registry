"use client"

/**
 * Table inline filter component
 * @description An inline filter component for DataTable that allows users to filter data with operator selection and multiple filter types.
 * @inspiration Inspired by and adapted from sadmann7's work - https://github.com/sadmann7/tablecn/blob/main/src/components/data-table/data-table-filter-menu.tsx
 *
 * @architecture
 * This file is organized into sections for easy copy-paste:
 *
 * 1. **Utilities** (createFilterId) - Helper functions
 *
 * 2. **Custom Hooks** - Replace useEffect with composable logic:
 *    - useInitialFilters: Extracts initial state from table (replaces initialization useEffect)
 *    - useSyncFiltersWithTable: Syncs filters to table state (replaces sync useEffect)
 *
 * 3. **Filter Value Components** - Inline filter input renderers:
 *    - FilterValueSelector: Command menu for selecting filter values
 *    - Inline filter input renderer (text, number, boolean, select, date)
 *
 * 4. **Main Components**:
 *    - TableInlineFilterItem: Single inline filter badge with controls
 *    - TableInline: Main inline filter toolbar
 *
 * @debugging
 * - All components have displayName for React DevTools
 * - Development-only console.log statements in hooks (NODE_ENV check)
 * - Check table.getState() to see current filter state
 * - Use React DevTools Components tab to inspect component tree
 * - Filter data flow: User Input → onFilterUpdate → filters state → useSyncFiltersWithTable → table state
 */

import type { Column, Table } from "@tanstack/react-table"
import {
  BadgeCheck,
  CalendarIcon,
  Check,
  ListFilter,
  Text,
  X,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getDefaultFilterOperator,
  getFilterOperators,
  processFiltersForLogic,
} from "../lib/data-table"
import { formatDate } from "../lib/format"
import { useKeyboardShortcut } from "../hooks"
import { cn } from "@/lib/utils"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
  KEYBOARD_SHORTCUTS,
} from "../lib/constants"
import { dataTableConfig } from "../config/data-table"
import type {
  ExtendedColumnFilter,
  FilterOperator,
  JoinOperator,
  Option,
} from "../types"
import { TableRangeFilter } from "./table-range-filter"

/* --------------------------------- Utilities -------------------------------- */

/**
 * Create a deterministic filter ID based on filter properties
 * This ensures filters can be shared via URL and will have consistent IDs
 */
function createFilterId<TData>(
  filter: Omit<ExtendedColumnFilter<TData>, "filterId">,
  index?: number,
): string {
  // Create a deterministic ID based on filter properties
  // Using a combination that should be unique for each filter configuration
  const valueStr =
    typeof filter.value === "string"
      ? filter.value
      : JSON.stringify(filter.value)

  // Include index as a fallback to ensure uniqueness for URL sharing
  const indexSuffix = typeof index === FILTER_VARIANTS.NUMBER ? `-${index}` : ""

  return `${filter.id}-${filter.operator}-${filter.variant}-${valueStr}${indexSuffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100) // Limit length to avoid extremely long IDs
}

/**
 * Type for filters without filterId (for URL serialization)
 */
type FilterWithoutId<TData> = Omit<ExtendedColumnFilter<TData>, "filterId">

/**
 * Normalize filters loaded from URL by ensuring they have filterId
 * If filterId is missing, generate it deterministically
 *
 * This allows filters to be stored in URL without filterId, making URLs shorter
 * and more robust. The filterId is auto-generated when filters are loaded.
 *
 * @param filters - Filters that may or may not have filterId
 * @returns Filters with guaranteed filterId values
 */
function normalizeFiltersFromUrl<TData>(
  filters: (FilterWithoutId<TData> | ExtendedColumnFilter<TData>)[],
): ExtendedColumnFilter<TData>[] {
  return filters.map((filter, index) => {
    // If filterId is missing, generate it
    if (!("filterId" in filter) || !filter.filterId) {
      return {
        ...filter,
        filterId: createFilterId(filter, index),
      } as ExtendedColumnFilter<TData>
    }
    return filter as ExtendedColumnFilter<TData>
  })
}

/* -------------------------------- Custom Hooks ------------------------------ */

/**
 * Hook to initialize filters from table state (for URL restoration)
 * Replaces the initialization useEffect with derived state
 *
 * @description This hook runs ONCE on mount to extract initial filter state from:
 * 1. Controlled filters (if provided via props)
 * 2. Table's globalFilter (for OR logic filters)
 * 3. Table's columnFilters (for AND logic filters)
 *
 * @debug Check React DevTools > Components > useInitialFilters to see returned value
 */
function useInitialFilters<TData>(
  table: Table<TData>,
  controlledFilters?: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  const initialFilters = React.useMemo(() => {
    if (controlledFilters) {
      const normalized = normalizeFiltersFromUrl(controlledFilters)
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[TableInline useInitialFilters] Using controlled filters:",
          normalized,
        )
      }
      return normalized
    }

    const globalFilter = table.getState().globalFilter
    if (
      globalFilter &&
      typeof globalFilter === "object" &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: (FilterWithoutId<TData> | ExtendedColumnFilter<TData>)[]
      }
      const normalized = normalizeFiltersFromUrl(filterObj.filters)
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[TableInline useInitialFilters] Extracted from globalFilter:",
          normalized,
        )
      }
      return normalized
    }

    const columnFilters = table.getState().columnFilters
    if (columnFilters && columnFilters.length > 0) {
      const extractedFilters = columnFilters
        .map(cf => cf.value)
        .filter(
          (v): v is FilterWithoutId<TData> | ExtendedColumnFilter<TData> =>
            v !== null && typeof v === "object" && "id" in v,
        )
      if (extractedFilters.length > 0) {
        const normalized = normalizeFiltersFromUrl(extractedFilters)
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[TableInline useInitialFilters] Extracted from columnFilters:",
            normalized,
          )
        }
        return normalized
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[TableInline useInitialFilters] No initial filters found")
    }
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return initialFilters
}

/**
 * Hook to sync filters with table state
 * Replaces multiple useEffect hooks with a single focused effect
 *
 * @description Manages synchronization between filter state and TanStack Table:
 * - Updates table.meta.joinOperator for the global filter function
 * - In uncontrolled mode: updates table's globalFilter or columnFilters based on join operators
 * - In controlled mode: only updates table.meta (parent handles table state)
 *
 * @debug
 * - Check table.getState().globalFilter to see OR filters
 * - Check table.getState().columnFilters to see AND filters
 * - Check table.options.meta.joinOperator to see current join logic
 */
function useSyncFiltersWithTable<TData>(
  table: Table<TData>,
  filters: ExtendedColumnFilter<TData>[],
  isControlled: boolean,
) {
  // Use core utility to process filters and determine logic
  const filterLogic = React.useMemo(
    () => processFiltersForLogic(filters),
    [filters],
  )

  // Update table meta (happens during render, safe mutation)
  if (table.options.meta) {
    // eslint-disable-next-line react-hooks/immutability
    table.options.meta.hasIndividualJoinOperators = true
    // eslint-disable-next-line react-hooks/immutability
    table.options.meta.joinOperator = filterLogic.joinOperator
  }

  // Sync with table state only when filters change (and not in controlled mode)
  React.useEffect(() => {
    if (isControlled) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[TableInline useSyncFiltersWithTable] Controlled mode - skipping table sync",
        )
      }
      return
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[TableInline useSyncFiltersWithTable] Syncing filters:", {
        filterCount: filters.length,
        hasOrFilters: filterLogic.hasOrFilters,
        hasSameColumnFilters: filterLogic.hasSameColumnFilters,
        joinOperator: filterLogic.joinOperator,
      })
    }

    // Use core utility to determine routing
    if (filterLogic.shouldUseGlobalFilter) {
      table.resetColumnFilters()

      table.setGlobalFilter({
        filters: filterLogic.processedFilters,
        joinOperator: filterLogic.joinOperator,
      })
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[TableInline useSyncFiltersWithTable] Set globalFilter (OR/MIXED logic)",
          {
            hasOrFilters: filterLogic.hasOrFilters,
            hasSameColumnFilters: filterLogic.hasSameColumnFilters,
          },
        )
      }
    } else {
      table.setGlobalFilter("")
      const columnFilters = filterLogic.processedFilters.map(filter => ({
        id: filter.id,
        value: {
          operator: filter.operator,
          value: filter.value,
          id: filter.id,
          filterId: filter.filterId,
          joinOperator: filter.joinOperator,
        },
      }))
      table.setColumnFilters(columnFilters)
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[TableInline useSyncFiltersWithTable] Set columnFilters (AND logic)",
        )
      }
    }
  }, [filters, filterLogic, table, isControlled])
}

export interface TableInlineProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  filters?: ExtendedColumnFilter<TData>[]
  onFiltersChange?: (filters: ExtendedColumnFilter<TData>[]) => void
}

export function TableInline<TData>({
  table,
  filters: controlledFilters,
  onFiltersChange: controlledOnFiltersChange,
  children,
  className,
  ...props
}: TableInlineProps<TData>) {
  const id = React.useId()

  // Check if we're in controlled mode
  const isControlled = controlledFilters !== undefined

  // Get initial filters from table state (for URL restoration)
  const initialFilters = useInitialFilters(table, controlledFilters)

  // Internal state - manages filters when not controlled
  const [internalFilters, setInternalFilters] =
    React.useState<ExtendedColumnFilter<TData>[]>(initialFilters)

  // Use controlled values if provided, otherwise use internal state
  const filters = controlledFilters ?? internalFilters

  // Sync filters with table state (handles both controlled and uncontrolled)
  useSyncFiltersWithTable(table, filters, isControlled)

  // Handler that works with both controlled and internal state
  const onFiltersChange = React.useCallback(
    (newFilters: ExtendedColumnFilter<TData>[]) => {
      if (controlledOnFiltersChange) {
        // In controlled mode, just notify parent - don't call table methods
        // Parent will update URL state, which will flow back to table state via DataTableRoot
        controlledOnFiltersChange(newFilters)
      } else {
        // In uncontrolled mode, update internal state
        // Table sync happens via useSyncFiltersWithTable hook
        setInternalFilters(newFilters)
      }
    },
    [controlledOnFiltersChange],
  )

  const columns = React.useMemo(
    () => table.getAllColumns().filter(column => column.getCanFilter()),
    [table],
  )

  const [open, setOpen] = React.useState(false)
  const [selectedColumn, setSelectedColumn] =
    React.useState<Column<TData> | null>(null)
  const [inputValue, setInputValue] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open)

    if (!open) {
      setTimeout(() => {
        setSelectedColumn(null)
        setInputValue("")
      }, 100)
    }
  }, [])

  const onFilterAdd = React.useCallback(
    (column: Column<TData>, value: string) => {
      if (
        !value.trim() &&
        column.columnDef.meta?.variant !== FILTER_VARIANTS.BOOLEAN
      ) {
        return
      }

      const filterValue =
        column.columnDef.meta?.variant === FILTER_VARIANTS.MULTI_SELECT
          ? [value]
          : value

      const filterWithoutId = {
        id: column.id as Extract<keyof TData, string>,
        value: filterValue,
        variant: column.columnDef.meta?.variant ?? FILTER_VARIANTS.TEXT,
        operator: getDefaultFilterOperator(
          column.columnDef.meta?.variant ?? FILTER_VARIANTS.TEXT,
        ),
        joinOperator: JOIN_OPERATORS.AND, // Default to AND for new filters
      }

      // Use current filter length as index to ensure unique IDs
      const newFilterIndex = filters.length

      const newFilter: ExtendedColumnFilter<TData> = {
        ...filterWithoutId,
        filterId: createFilterId(filterWithoutId, newFilterIndex),
      }

      onFiltersChange([...filters, newFilter])
      setOpen(false)

      setTimeout(() => {
        setSelectedColumn(null)
        setInputValue("")
      }, 100)
    },
    [filters, onFiltersChange],
  )

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter(
        filter => filter.filterId !== filterId,
      )
      onFiltersChange(updatedFilters)
      requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    },
    [filters, onFiltersChange],
  )

  const onFilterUpdate = React.useCallback(
    (
      filterId: string,
      updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
    ) => {
      const updatedFilters = filters.map(filter => {
        if (filter.filterId === filterId) {
          return { ...filter, ...updates } as ExtendedColumnFilter<TData>
        }
        return filter
      })
      onFiltersChange(updatedFilters)
    },
    [filters, onFiltersChange],
  )

  const onFiltersReset = React.useCallback(() => {
    onFiltersChange([])
  }, [onFiltersChange])

  // Toggle filter menu with 'F' key
  useKeyboardShortcut({
    key: KEYBOARD_SHORTCUTS.FILTER_TOGGLE,
    onTrigger: () => setOpen(prev => !prev),
  })

  // Remove last filter with Shift+F
  useKeyboardShortcut({
    key: KEYBOARD_SHORTCUTS.FILTER_REMOVE,
    requireShift: true,
    onTrigger: () => {
      if (filters.length > 0) {
        onFilterRemove(filters[filters.length - 1]?.filterId ?? "")
      }
    },
    condition: () => filters.length > 0,
  })

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const key = event.key.toLowerCase()
      if (
        (key === KEYBOARD_SHORTCUTS.BACKSPACE ||
          key === KEYBOARD_SHORTCUTS.DELETE) &&
        !inputValue &&
        selectedColumn
      ) {
        event.preventDefault()
        setSelectedColumn(null)
      }
    },
    [inputValue, selectedColumn],
  )

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const key = event.key.toLowerCase()
      if (
        (key === KEYBOARD_SHORTCUTS.BACKSPACE ||
          key === KEYBOARD_SHORTCUTS.DELETE) &&
        filters.length > 0
      ) {
        event.preventDefault()
        onFilterRemove(filters[filters.length - 1]?.filterId ?? "")
      }
    },
    [filters, onFilterRemove],
  )

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {filters.map((filter, index) => (
          <React.Fragment key={filter.filterId}>
            {/* Show join operator selector before filter (except for first filter) */}
            {index > 0 && (
              <Select
                value={filter.joinOperator || JOIN_OPERATORS.AND}
                onValueChange={(value: JoinOperator) =>
                  onFilterUpdate(filter.filterId, { joinOperator: value })
                }
              >
                <SelectTrigger className="h-8 w-20 text-xs font-medium uppercase">
                  <SelectValue placeholder={filter.joinOperator || "and"} />
                </SelectTrigger>
                <SelectContent>
                  {dataTableConfig.joinOperators.map(operator => (
                    <SelectItem
                      key={operator}
                      value={operator}
                      className="uppercase"
                    >
                      {operator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <TableInlineFilterItem
              filter={filter}
              filterItemId={`${id}-filter-${filter.filterId}`}
              columns={columns}
              onFilterUpdate={onFilterUpdate}
              onFilterRemove={onFilterRemove}
            />
          </React.Fragment>
        ))}
        {filters.length > 0 && (
          <Button
            aria-label="Clear all filters"
            title="Clear all filters"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={onFiltersReset}
          >
            <X />
          </Button>
        )}
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              aria-label="Open filter command menu"
              title="Add filter (Press F)"
              variant="outline"
              size="sm"
              ref={triggerRef}
              onKeyDown={onTriggerKeyDown}
            >
              <ListFilter />
              Add filter
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-full max-w-(--radix-popover-content-available-width) origin-(--radix-popover-content-transform-origin) p-0"
          >
            <Command loop className="[&_[cmdk-input-wrapper]_svg]:hidden">
              <CommandInput
                ref={inputRef}
                placeholder={
                  selectedColumn
                    ? (selectedColumn.columnDef.meta?.label ??
                      selectedColumn.id)
                    : "Search fields..."
                }
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={onInputKeyDown}
              />
              <CommandList>
                {selectedColumn ? (
                  <>
                    {selectedColumn.columnDef.meta?.options && (
                      <CommandEmpty>No options found.</CommandEmpty>
                    )}
                    <FilterValueSelector
                      column={selectedColumn}
                      value={inputValue}
                      onSelect={value => onFilterAdd(selectedColumn, value)}
                    />
                  </>
                ) : (
                  <>
                    <CommandEmpty>No fields found.</CommandEmpty>
                    <CommandGroup>
                      {columns.map(column => (
                        <CommandItem
                          key={column.id}
                          value={column.id}
                          onSelect={() => {
                            setSelectedColumn(column)
                            setInputValue("")
                            requestAnimationFrame(() => {
                              inputRef.current?.focus()
                            })
                          }}
                        >
                          {column.columnDef.meta?.icon && (
                            <column.columnDef.meta.icon />
                          )}
                          <span className="truncate">
                            {column.columnDef.meta?.label ?? column.id}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
TableInline.displayName = "TableInline"

interface TableInlineFilterItemProps<TData> {
  filter: ExtendedColumnFilter<TData>
  filterItemId: string
  columns: Column<TData>[]
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  onFilterRemove: (filterId: string) => void
}

function TableInlineFilterItem<TData>({
  filter,
  filterItemId,
  columns,
  onFilterUpdate,
  onFilterRemove,
}: TableInlineFilterItemProps<TData>) {
  const [showFieldSelector, setShowFieldSelector] = React.useState(false)
  const [showOperatorSelector, setShowOperatorSelector] = React.useState(false)
  const [showValueSelector, setShowValueSelector] = React.useState(false)

  const column = columns.find(column => column.id === filter.id)

  const operatorListboxId = `${filterItemId}-operator-listbox`
  const inputId = `${filterItemId}-input`

  const columnMeta = column?.columnDef.meta
  const filterOperators = getFilterOperators(filter.variant)

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (showFieldSelector || showOperatorSelector || showValueSelector) {
        return
      }

      const key = event.key.toLowerCase()
      if (
        key === KEYBOARD_SHORTCUTS.BACKSPACE ||
        key === KEYBOARD_SHORTCUTS.DELETE
      ) {
        event.preventDefault()
        onFilterRemove(filter.filterId)
      }
    },
    [
      filter.filterId,
      showFieldSelector,
      showOperatorSelector,
      showValueSelector,
      onFilterRemove,
    ],
  )

  if (!column) return null

  return (
    <div
      key={filter.filterId}
      role="listitem"
      id={filterItemId}
      className="flex h-8 items-center rounded-md bg-background"
      onKeyDown={onItemKeyDown}
    >
      <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
        <PopoverTrigger asChild>
          <Button
            title="Change field"
            variant="ghost"
            size="sm"
            className="rounded-none rounded-l-md border border-r-0 font-normal dark:bg-input/30"
          >
            {columnMeta?.icon && (
              <columnMeta.icon className="text-muted-foreground" />
            )}
            {columnMeta?.label ?? column.id}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-48 origin-(--radix-popover-content-transform-origin) p-0"
        >
          <Command loop>
            <CommandInput placeholder="Search fields..." />
            <CommandList>
              <CommandEmpty>No fields found.</CommandEmpty>
              <CommandGroup>
                {columns.map(column => (
                  <CommandItem
                    key={column.id}
                    value={column.id}
                    onSelect={() => {
                      onFilterUpdate(filter.filterId, {
                        id: column.id as Extract<keyof TData, string>,
                        variant:
                          column.columnDef.meta?.variant ??
                          FILTER_VARIANTS.TEXT,
                        operator: getDefaultFilterOperator(
                          column.columnDef.meta?.variant ??
                            FILTER_VARIANTS.TEXT,
                        ),
                        value: "",
                      })

                      setShowFieldSelector(false)
                    }}
                  >
                    {column.columnDef.meta?.icon && (
                      <column.columnDef.meta.icon />
                    )}
                    <span className="truncate">
                      {column.columnDef.meta?.label ?? column.id}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto",
                        column.id === filter.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Select
        open={showOperatorSelector}
        onOpenChange={setShowOperatorSelector}
        value={filter.operator}
        onValueChange={(value: FilterOperator) =>
          onFilterUpdate(filter.filterId, {
            operator: value,
            value:
              value === FILTER_OPERATORS.EMPTY ||
              value === FILTER_OPERATORS.NOT_EMPTY
                ? ""
                : filter.value,
          })
        }
      >
        <SelectTrigger
          title="Change operator"
          aria-controls={operatorListboxId}
          className="h-8 rounded-none border-r-0 px-2.5 lowercase data-size:h-8 [&_svg]:hidden"
        >
          <SelectValue placeholder={filter.operator} />
        </SelectTrigger>
        <SelectContent
          id={operatorListboxId}
          className="origin-(--radix-select-content-transform-origin)"
        >
          {filterOperators.map(operator => (
            <SelectItem
              key={operator.value}
              className="lowercase"
              value={operator.value}
            >
              {operator.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onFilterInputRender({
        filter,
        column,
        inputId,
        onFilterUpdate,
        showValueSelector,
        setShowValueSelector,
      })}
      <Button
        aria-controls={filterItemId}
        title={`Remove ${columnMeta?.label ?? column.id} filter`}
        variant="ghost"
        size="sm"
        className="h-full rounded-none rounded-r-md border border-l-0 px-1.5 font-normal dark:bg-input/30"
        onClick={() => onFilterRemove(filter.filterId)}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
TableInlineFilterItem.displayName = "TableInlineFilterItem"

interface FilterValueSelectorProps<TData> {
  column: Column<TData>
  value: string
  onSelect: (value: string) => void
}

function FilterValueSelector<TData>({
  column,
  value,
  onSelect,
}: FilterValueSelectorProps<TData>) {
  const variant = column.columnDef.meta?.variant ?? FILTER_VARIANTS.TEXT

  switch (variant) {
    case FILTER_VARIANTS.BOOLEAN:
      return (
        <CommandGroup>
          <CommandItem value="true" onSelect={() => onSelect("true")}>
            True
          </CommandItem>
          <CommandItem value="false" onSelect={() => onSelect("false")}>
            False
          </CommandItem>
        </CommandGroup>
      )

    case FILTER_VARIANTS.SELECT:
    case FILTER_VARIANTS.MULTI_SELECT:
      return (
        <CommandGroup>
          {column.columnDef.meta?.options?.map((option: Option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={() => onSelect(option.value)}
            >
              {option.icon && <option.icon />}
              <span className="truncate">{option.label}</span>
              {option.count && (
                <span className="ml-auto font-mono text-xs">
                  {option.count}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      )

    case FILTER_VARIANTS.DATE:
    case FILTER_VARIANTS.DATE_RANGE:
      return (
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={value ? new Date(value) : undefined}
          onSelect={date => onSelect(date?.getTime().toString() ?? "")}
        />
      )

    default: {
      const isEmpty = !value.trim()

      return (
        <CommandGroup>
          <CommandItem
            value={value}
            onSelect={() => onSelect(value)}
            disabled={isEmpty}
          >
            {isEmpty ? (
              <>
                <Text />
                <span>Type to add filter...</span>
              </>
            ) : (
              <>
                <BadgeCheck />
                <span className="truncate">Filter by &quot;{value}&quot;</span>
              </>
            )}
          </CommandItem>
        </CommandGroup>
      )
    }
  }
}
FilterValueSelector.displayName = "FilterValueSelector"

function onFilterInputRender<TData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: {
  filter: ExtendedColumnFilter<TData>
  column: Column<TData>
  inputId: string
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  showValueSelector: boolean
  setShowValueSelector: (value: boolean) => void
}) {
  if (
    filter.operator === FILTER_OPERATORS.EMPTY ||
    filter.operator === FILTER_OPERATORS.NOT_EMPTY
  ) {
    return (
      <div
        id={inputId}
        role="status"
        aria-label={`${column.columnDef.meta?.label} filter is ${
          filter.operator === FILTER_OPERATORS.EMPTY ? "empty" : "not empty"
        }`}
        aria-live="polite"
        className="h-full w-16 rounded-none border bg-transparent px-1.5 py-0.5 text-muted-foreground dark:bg-input/30"
      />
    )
  }

  switch (filter.variant) {
    case FILTER_VARIANTS.TEXT:
    case FILTER_VARIANTS.NUMBER:
    case FILTER_VARIANTS.RANGE: {
      if (
        (filter.variant === FILTER_VARIANTS.RANGE &&
          filter.operator === FILTER_OPERATORS.BETWEEN) ||
        filter.operator === FILTER_OPERATORS.BETWEEN
      ) {
        return (
          <TableRangeFilter
            filter={filter}
            column={column}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
            className="size-full max-w-28 gap-0 **:data-[slot='range-min']:border-r-0 [&_input]:rounded-none [&_input]:px-1.5"
          />
        )
      }

      const isNumber =
        filter.variant === FILTER_VARIANTS.NUMBER ||
        filter.variant === FILTER_VARIANTS.RANGE

      return (
        <Input
          id={inputId}
          type={isNumber ? FILTER_VARIANTS.NUMBER : FILTER_VARIANTS.TEXT}
          inputMode={isNumber ? "numeric" : undefined}
          placeholder={column.columnDef.meta?.placeholder ?? "Enter value..."}
          className="h-full w-24 rounded-none px-1.5"
          value={typeof filter.value === "string" ? filter.value : ""}
          onChange={event =>
            onFilterUpdate(filter.filterId, { value: event.target.value })
          }
        />
      )
    }

    case FILTER_VARIANTS.BOOLEAN: {
      const inputListboxId = `${inputId}-listbox`

      return (
        <Select
          open={showValueSelector}
          onOpenChange={setShowValueSelector}
          value={typeof filter.value === "string" ? filter.value : "true"}
          onValueChange={(value: "true" | "false") =>
            onFilterUpdate(filter.filterId, { value })
          }
        >
          <SelectTrigger
            id={inputId}
            aria-controls={inputListboxId}
            className="rounded-none bg-transparent px-1.5 py-0.5 [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.value ? "True" : "False"} />
          </SelectTrigger>
          <SelectContent id={inputListboxId}>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    case FILTER_VARIANTS.SELECT:
    case FILTER_VARIANTS.MULTI_SELECT: {
      const inputListboxId = `${inputId}-listbox`

      const options = column.columnDef.meta?.options ?? []
      const selectedValues = Array.isArray(filter.value)
        ? filter.value
        : [filter.value]

      const selectedOptions = options.filter((option: Option) =>
        selectedValues.includes(option.value),
      )

      return (
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              variant="ghost"
              size="sm"
              className="h-full min-w-16 rounded-none border px-1.5 font-normal dark:bg-input/30"
            >
              {selectedOptions.length === 0 ? (
                filter.variant === FILTER_VARIANTS.MULTI_SELECT ? (
                  "Select options..."
                ) : (
                  "Select option..."
                )
              ) : (
                <>
                  <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                    {selectedOptions.map((selectedOption: Option) =>
                      selectedOption.icon ? (
                        <div
                          key={selectedOption.value}
                          className="rounded-full border bg-background p-0.5"
                        >
                          <selectedOption.icon className="size-3.5" />
                        </div>
                      ) : null,
                    )}
                  </div>
                  <span className="truncate">
                    {selectedOptions.length > 1
                      ? `${selectedOptions.length} selected`
                      : selectedOptions[0]?.label}
                  </span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={inputListboxId}
            align="start"
            className="w-48 origin-(--radix-popover-content-transform-origin) p-0"
          >
            <Command>
              <CommandInput placeholder="Search options..." />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option: Option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        const value =
                          filter.variant === FILTER_VARIANTS.MULTI_SELECT
                            ? selectedValues.includes(option.value)
                              ? selectedValues.filter(v => v !== option.value)
                              : [...selectedValues, option.value]
                            : option.value
                        onFilterUpdate(filter.filterId, { value })
                      }}
                    >
                      {option.icon && <option.icon />}
                      <span className="truncate">{option.label}</span>
                      {filter.variant === FILTER_VARIANTS.MULTI_SELECT && (
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedValues.includes(option.value)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )
    }

    case FILTER_VARIANTS.DATE:
    case FILTER_VARIANTS.DATE_RANGE: {
      const inputListboxId = `${inputId}-listbox`

      const dateValue = Array.isArray(filter.value)
        ? filter.value.filter(Boolean)
        : [filter.value, filter.value].filter(Boolean)

      const displayValue =
        filter.operator === FILTER_OPERATORS.BETWEEN && dateValue.length === 2
          ? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(
              new Date(Number(dateValue[1])),
            )}`
          : dateValue[0]
            ? formatDate(new Date(Number(dateValue[0])))
            : "Pick date..."

      return (
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              variant="ghost"
              size="sm"
              className={cn(
                "h-full rounded-none border px-1.5 font-normal dark:bg-input/30",
                !filter.value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-3.5" />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={inputListboxId}
            align="start"
            className="w-auto origin-(--radix-popover-content-transform-origin) p-0"
          >
            {filter.operator === FILTER_OPERATORS.BETWEEN ? (
              <Calendar
                mode={FILTER_VARIANTS.RANGE}
                captionLayout="dropdown"
                selected={
                  dateValue.length === 2
                    ? {
                        from: new Date(Number(dateValue[0])),
                        to: new Date(Number(dateValue[1])),
                      }
                    : {
                        from: new Date(),
                        to: new Date(),
                      }
                }
                onSelect={date => {
                  onFilterUpdate(filter.filterId, {
                    value: date
                      ? [
                          (date.from?.getTime() ?? "").toString(),
                          (date.to?.getTime() ?? "").toString(),
                        ]
                      : [],
                  })
                }}
              />
            ) : (
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={
                  dateValue[0] ? new Date(Number(dateValue[0])) : undefined
                }
                onSelect={date => {
                  onFilterUpdate(filter.filterId, {
                    value: (date?.getTime() ?? "").toString(),
                  })
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      )
    }

    default:
      return null
  }
}
