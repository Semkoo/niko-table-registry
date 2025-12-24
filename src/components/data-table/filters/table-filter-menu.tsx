"use client"

/**
 * Table filter menu component
 * @description A filter menu component for DataTable that allows users to manage multiple filtering criteria. Users can add, remove, and reorder filters, select fields, operators, and input values.
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
 * 3. **Filter Input Components** - Small, focused components for each input type:
 *    - FilterEmptyInput: Empty state for isEmpty/isNotEmpty
 *    - FilterTextNumberInput: Text/number inputs
 *    - FilterBooleanSelect: Boolean dropdown
 *    - FilterFacetedSelect: Single/multi-select faceted component
 *    - FilterDatePicker: Date/date range picker
 *    - FilterValueInput: Main router component that renders correct input
 *
 * 4. **Filter Item Sub-Components** - Break down filter row UI:
 *    - FilterJoinOperator: AND/OR selector
 *    - FilterFieldSelector: Column field picker
 *    - FilterOperatorSelector: Operator picker (equals, contains, etc.)
 *
 * 5. **Main Components**:
 *    - DataTableFilterItem: Single filter row (uses sub-components)
 *    - TableFilterMenu: Main popover with filter list
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
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Grip,
  ListFilter,
  Trash2,
} from "lucide-react"
import * as React from "react"

import { TableRangeFilter } from "./table-range-filter"
import { Badge } from "@/components/ui/badge"
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
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable"
import { dataTableConfig } from "../config/data-table"
import {
  getDefaultFilterOperator,
  getFilterOperators,
  processFiltersForLogic,
} from "../lib/data-table"
import { formatDate } from "../lib/format"
import { useKeyboardShortcut } from "../hooks"
import { cn } from "@/lib/utils"
import {
  JOIN_OPERATORS,
  ERROR_MESSAGES,
  KEYBOARD_SHORTCUTS,
} from "../lib/constants"
import type {
  ExtendedColumnFilter,
  FilterOperator,
  JoinOperator,
  Option,
} from "../types"

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
  const indexSuffix = typeof index === "number" ? `-${index}` : ""

  return `${filter.id}-${filter.operator}-${filter.variant}-${valueStr}${indexSuffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100) // Limit length to avoid extremely long IDs
}

/**
 * Create a unique key for a filter based on its properties (not filterId)
 * This allows matching filters even if filterId is changed in the URL
 */
function getFilterKey<TData>(filter: ExtendedColumnFilter<TData>): string {
  const valueStr =
    typeof filter.value === "string"
      ? filter.value
      : Array.isArray(filter.value)
        ? filter.value.join(",")
        : JSON.stringify(filter.value)
  return `${filter.id}-${filter.operator}-${filter.variant}-${valueStr}`
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
  // Quick check: if all filters already have filterIds, return as-is
  // This preserves object and array references
  const hasAllIds = filters.every(
    (f): f is ExtendedColumnFilter<TData> => "filterId" in f && !!f.filterId,
  )
  if (hasAllIds) {
    return filters as ExtendedColumnFilter<TData>[]
  }

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

/**
 * Serialize filters for URL (excludes filterId to make URLs shorter)
 *
 * OPTIONAL: Use this function when serializing filters to URL to exclude filterId.
 * The filterId will be auto-generated when filters are loaded from URL via
 * normalizeFiltersFromUrl(), so it's safe to exclude it.
 *
 * Example usage in URL state management:
 * ```ts
 * const urlFilters = serializeFiltersForUrl(filters)
 * setUrlParams({ filters: urlFilters })
 * ```
 *
 * @param filters - Filters with filterId
 * @returns Filters without filterId (suitable for URL storage)
 */
export function serializeFiltersForUrl<TData>(
  filters: ExtendedColumnFilter<TData>[],
): FilterWithoutId<TData>[] {
  return filters.map(filter => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { filterId, ...filterWithoutId } = filter
    return filterWithoutId
  })
}

/* --------------------------------- Faceted Component (Inline) -------------------------------- */

/**
 * Faceted component for single/multi-select filters
 * Inlined here so users can copy-paste the entire filter menu without external dependencies
 */

type FacetedValue<Multiple extends boolean> = Multiple extends true
  ? string[]
  : string

interface FacetedContextValue<Multiple extends boolean = boolean> {
  value?: FacetedValue<Multiple>
  onItemSelect?: (value: string) => void
  multiple?: Multiple
}

const FacetedContext = React.createContext<FacetedContextValue<boolean> | null>(
  null,
)

function useFacetedContext(name: string) {
  const context = React.useContext(FacetedContext)
  if (!context) {
    throw new Error(`\`${name}\` must be within Faceted`)
  }
  return context
}

interface FacetedProps<
  Multiple extends boolean = false,
> extends React.ComponentProps<typeof Popover> {
  value?: FacetedValue<Multiple>
  onValueChange?: (value: FacetedValue<Multiple> | undefined) => void
  children?: React.ReactNode
  multiple?: Multiple
}

function Faceted<Multiple extends boolean = false>(
  props: FacetedProps<Multiple>,
) {
  const {
    open: openProp,
    onOpenChange: onOpenChangeProp,
    value,
    onValueChange,
    children,
    multiple = false,
    ...facetedProps
  } = props

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const onOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChangeProp?.(newOpen)
    },
    [isControlled, onOpenChangeProp],
  )

  const onItemSelect = React.useCallback(
    (selectedValue: string) => {
      if (!onValueChange) return

      if (multiple) {
        const currentValue = (Array.isArray(value) ? value : []) as string[]
        const newValue = currentValue.includes(selectedValue)
          ? currentValue.filter(v => v !== selectedValue)
          : [...currentValue, selectedValue]
        onValueChange(newValue as FacetedValue<Multiple>)
      } else {
        if (value === selectedValue) {
          onValueChange(undefined)
        } else {
          onValueChange(selectedValue as FacetedValue<Multiple>)
        }

        requestAnimationFrame(() => onOpenChange(false))
      }
    },
    [multiple, value, onValueChange, onOpenChange],
  )

  const contextValue = React.useMemo<FacetedContextValue<typeof multiple>>(
    () => ({ value, onItemSelect, multiple }),
    [value, onItemSelect, multiple],
  )

  return (
    <FacetedContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={onOpenChange} {...facetedProps}>
        {children}
      </Popover>
    </FacetedContext.Provider>
  )
}

function FacetedTrigger(props: React.ComponentProps<typeof PopoverTrigger>) {
  const { className, children, ...triggerProps } = props

  return (
    <PopoverTrigger
      {...triggerProps}
      className={cn("justify-between text-left", className)}
    >
      {children}
    </PopoverTrigger>
  )
}

interface FacetedBadgeListProps extends React.ComponentProps<"div"> {
  options?: { label: string; value: string }[]
  max?: number
  badgeClassName?: string
  placeholder?: string
}

function FacetedBadgeList(props: FacetedBadgeListProps) {
  const {
    options = [],
    max = 2,
    placeholder = "Select options...",
    className,
    badgeClassName,
    ...badgeListProps
  } = props

  const context = useFacetedContext("FacetedBadgeList")
  const values = Array.isArray(context.value)
    ? context.value
    : ([context.value].filter(Boolean) as string[])

  const getLabel = React.useCallback(
    (value: string) => {
      const option = options.find(opt => opt.value === value)
      return option?.label ?? value
    },
    [options],
  )

  if (!values || values.length === 0) {
    return (
      <div
        {...badgeListProps}
        className="flex w-full items-center gap-1 text-muted-foreground"
      >
        {placeholder}
        <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
      </div>
    )
  }

  return (
    <div
      {...badgeListProps}
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {values.length > max ? (
        <Badge
          variant="secondary"
          className={cn("rounded-sm px-1 font-normal", badgeClassName)}
        >
          {values.length} selected
        </Badge>
      ) : (
        values.map(value => (
          <Badge
            key={value}
            variant="secondary"
            className={cn("rounded-sm px-1 font-normal", badgeClassName)}
          >
            <span className="truncate">{getLabel(value)}</span>
          </Badge>
        ))
      )}
    </div>
  )
}

function FacetedContent(props: React.ComponentProps<typeof PopoverContent>) {
  const { className, children, ...contentProps } = props

  return (
    <PopoverContent
      {...contentProps}
      align="start"
      className={cn(
        "w-[200px] origin-(--radix-popover-content-transform-origin) p-0",
        className,
      )}
    >
      <Command>{children}</Command>
    </PopoverContent>
  )
}

const FacetedInput = CommandInput

const FacetedList = CommandList

const FacetedEmpty = CommandEmpty

const FacetedGroup = CommandGroup

interface FacetedItemProps extends React.ComponentProps<typeof CommandItem> {
  value: string
}

function FacetedItem(props: FacetedItemProps) {
  const { value, onSelect, className, children, ...itemProps } = props
  const context = useFacetedContext("FacetedItem")

  const isSelected = context.multiple
    ? Array.isArray(context.value) && context.value.includes(value)
    : context.value === value

  const onItemSelect = React.useCallback(
    (currentValue: string) => {
      if (onSelect) {
        onSelect(currentValue)
      } else if (context.onItemSelect) {
        context.onItemSelect(currentValue)
      }
    },
    [onSelect, context],
  )

  return (
    <CommandItem
      aria-selected={isSelected}
      data-selected={isSelected}
      className={cn("gap-2", className)}
      onSelect={() => onItemSelect(value)}
      {...itemProps}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-sm border border-primary",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "opacity-50 [&_svg]:invisible",
        )}
      >
        <Check className="size-4" />
      </span>
      {children}
    </CommandItem>
  )
}

/**
 * Normalize join operators when filters are reordered
 *
 * This function ensures that filter order changes don't break the filter logic.
 * The joinOperator on each filter (except the first) determines how it joins
 * with the PREVIOUS filter in the array. When filters are reordered, we need
 * to preserve the logical relationship.
 *
 * Strategy:
 * 1. First filter always has joinOperator="and" (it's ignored anyway)
 * 2. For each subsequent filter, determine the joinOperator based on:
 *    - If the current filter and previous filter were adjacent in original order,
 *      use the joinOperator that was on the current filter in original order
 *    - If they were not adjacent, trace the path between them in original order
 *      to determine the relationship
 *
 * Example:
 * Original: [A(and), B(or), C(and)]
 *   Logic: A OR B AND C → (A OR B) AND C (AND has precedence)
 * After swapping A and B: [B(and), A(?), C(?)]
 *   We want to preserve: (B OR A) AND C
 *   So: [B(and), A(or), C(and)]
 *
 * ROBUSTNESS:
 * This function uses filter properties (id, operator, variant, value) to match
 * filters, not just filterId. This means it will work even if filterId is
 * changed in the URL, as long as the filter properties remain the same.
 *
 * @param originalFilters - Filters in their original order
 * @param reorderedFilters - Filters in their new order
 * @returns Normalized filters with correct joinOperator values
 */
function normalizeFilterJoinOperators<TData>(
  originalFilters: ExtendedColumnFilter<TData>[],
  reorderedFilters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  // If filters are the same or empty, return as-is
  if (
    originalFilters.length === 0 ||
    reorderedFilters.length === 0 ||
    originalFilters.length !== reorderedFilters.length
  ) {
    return reorderedFilters
  }

  // Check if order actually changed (using filterId first, then fallback to properties)
  const orderChangedById = reorderedFilters.some(
    (filter, index) => filter.filterId !== originalFilters[index]?.filterId,
  )

  // Also check if order changed by comparing filter properties
  const orderChangedByProps = reorderedFilters.some((filter, index) => {
    const original = originalFilters[index]
    if (!original) return true
    return getFilterKey(filter) !== getFilterKey(original)
  })

  if (!orderChangedById && !orderChangedByProps) {
    return reorderedFilters
  }

  // Create maps using filterId (primary) and filter properties (fallback)
  // This allows matching even if filterId is changed in URL
  const originalIndexMapById = new Map<string, number>()
  const originalIndexMapByKey = new Map<string, number>()

  originalFilters.forEach((filter, index) => {
    originalIndexMapById.set(filter.filterId, index)
    originalIndexMapByKey.set(getFilterKey(filter), index)
  })

  // Normalize the reordered filters
  return reorderedFilters.map((filter, newIndex) => {
    // First filter always has "and" (it's ignored in evaluation anyway)
    if (newIndex === 0) {
      return {
        ...filter,
        joinOperator: JOIN_OPERATORS.AND,
      }
    }

    // Get the previous filter in the new order
    const previousFilter = reorderedFilters[newIndex - 1]

    // Try to find original index using filterId first, then fallback to properties
    let currentOriginalIndex = originalIndexMapById.get(filter.filterId) ?? -1
    let previousOriginalIndex =
      originalIndexMapById.get(previousFilter.filterId) ?? -1

    // If not found by filterId, try matching by properties
    // This handles the case where filterId was changed in the URL
    if (currentOriginalIndex === -1) {
      currentOriginalIndex =
        originalIndexMapByKey.get(getFilterKey(filter)) ?? -1
    }
    if (previousOriginalIndex === -1) {
      previousOriginalIndex =
        originalIndexMapByKey.get(getFilterKey(previousFilter)) ?? -1
    }

    // If either filter wasn't in original, default to AND
    // This can happen if filters were added/removed or properties changed
    if (currentOriginalIndex === -1 || previousOriginalIndex === -1) {
      return {
        ...filter,
        joinOperator: JOIN_OPERATORS.AND,
      }
    }

    // If filters were adjacent in original order
    if (Math.abs(currentOriginalIndex - previousOriginalIndex) === 1) {
      // They were adjacent - use the joinOperator from the filter that came
      // after the earlier one in original order
      if (currentOriginalIndex > previousOriginalIndex) {
        // Current came after previous in original - use current's original joinOperator
        return {
          ...filter,
          joinOperator: originalFilters[currentOriginalIndex].joinOperator,
        }
      } else {
        // Current came before previous in original - use previous's original joinOperator
        // (which determines how it joins with what was before it)
        return {
          ...filter,
          joinOperator: originalFilters[previousOriginalIndex].joinOperator,
        }
      }
    }

    // Filters were not adjacent in original order
    // Determine relationship by checking if there's an OR operator in the path
    const startIndex = Math.min(currentOriginalIndex, previousOriginalIndex)
    const endIndex = Math.max(currentOriginalIndex, previousOriginalIndex)

    // Check if any filter between them (or the one after start) has OR
    const hasOrInPath = originalFilters
      .slice(startIndex, endIndex + 1)
      .some((f, idx) => {
        // Check joinOperator of filters after startIndex
        return idx > 0 && f.joinOperator === JOIN_OPERATORS.OR
      })

    return {
      ...filter,
      joinOperator: hasOrInPath ? JOIN_OPERATORS.OR : JOIN_OPERATORS.AND,
    }
  })
}

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
  // Derive initial filters from table state only once on mount
  const initialFilters = React.useMemo(() => {
    // If controlled, use controlled filters (normalize to ensure filterId exists)
    if (controlledFilters) {
      const normalized = normalizeFiltersFromUrl(controlledFilters)
      if (process.env.NODE_ENV === "development") {
        console.log("[useInitialFilters] Using controlled filters:", normalized)
      }
      return normalized
    }

    // Check if table has globalFilter with filters object (OR filters)
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
          "[useInitialFilters] Extracted from globalFilter:",
          normalized,
        )
      }
      return normalized
    }

    // Otherwise check columnFilters (AND filters)
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
            "[useInitialFilters] Extracted from columnFilters:",
            normalized,
          )
        }
        return normalized
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[useInitialFilters] No initial filters found")
    }
    return []
    // Only run once on mount - we don't want to reset when table state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return initialFilters
}

/**
 * Hook to sync filters with table state - COLUMNFILTERS-ONLY ARCHITECTURE
 *
 * @description This hook uses ONLY columnFilters (not globalFilter) for all filtering:
 * - Stores individual filter objects in each column's filter value
 * - Each column uses the `extendedFilter` filterFn that respects filter operators
 * - For OR/MIXED logic: Still uses separate columnFilters per column, but table evaluates them
 * - In uncontrolled mode: updates table's columnFilters with all filters
 * - In controlled mode: only updates table.meta (parent handles table state)
 * - globalFilter remains FREE for other purposes (e.g., separate global search feature)
 *
 * @architecture
 * TanStack Table's columnFilters work like this:
 * - Multiple filters on SAME column → evaluated by that column's filterFn
 * - Multiple filters on DIFFERENT columns → combined with AND logic
 * - To achieve OR logic across columns, we need custom evaluation
 *
 * SOLUTION: Store filter metadata in table.meta and use it in a custom pre-filter
 *
 * @debug
 * - Check table.getState().columnFilters to see all filters
 * - Check table.options.meta.joinOperator to see current join logic
 * - globalFilter should remain empty/unused
 */
function useSyncFiltersWithTable<TData>(
  table: Table<TData>,
  filters: ExtendedColumnFilter<TData>[],
  isControlled: boolean,
) {
  // Track if we've done initial sync
  const hasSyncedRef = React.useRef(false)

  // Use core utility to process filters and determine logic
  const filterLogic = React.useMemo(
    () => processFiltersForLogic(filters),
    [filters],
  )

  // Update table meta immediately (no effect needed, happens during render)
  // This is safe because we're only mutating table.options.meta, not triggering re-renders
  // Custom filter logic can read this meta to apply correct join operators
  if (table.options.meta) {
    // eslint-disable-next-line react-hooks/immutability
    table.options.meta.hasIndividualJoinOperators = true
    // eslint-disable-next-line react-hooks/immutability
    table.options.meta.joinOperator = filterLogic.joinOperator
  }

  // Sync with table state only when filters change (and not in controlled mode)
  React.useEffect(() => {
    // Skip if controlled - parent handles table state
    if (isControlled) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[useSyncFiltersWithTable] Controlled mode - skipping table sync",
        )
      }
      return
    }

    // Mark that we've synced at least once
    hasSyncedRef.current = true

    if (process.env.NODE_ENV === "development") {
      console.log("[useSyncFiltersWithTable] Syncing filters:", {
        filterCount: filters.length,
        hasOrFilters: filterLogic.hasOrFilters,
        hasSameColumnFilters: filterLogic.hasSameColumnFilters,
        joinOperator: filterLogic.joinOperator,
        filters: filters.map(f => ({
          id: f.id,
          operator: f.operator,
          joinOp: f.joinOperator,
          value: f.value,
        })),
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
          "[useSyncFiltersWithTable] Set globalFilter (OR/MIXED logic)",
          {
            hasOrFilters: filterLogic.hasOrFilters,
            hasSameColumnFilters: filterLogic.hasSameColumnFilters,
          },
        )
      }
    } else {
      // BUILD COLUMN FILTERS ARRAY
      // Each filter becomes a separate columnFilter entry
      // TanStack Table will AND them together by default, but we can override with custom logic
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
          "[useSyncFiltersWithTable] Set columnFilters (columnFilters-only architecture)",
          "- pure AND logic",
        )
      }
    }
  }, [filters, filterLogic, table, isControlled])
}

interface TableFilterMenuProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
  filters?: ExtendedColumnFilter<TData>[]
  onFiltersChange?: (filters: ExtendedColumnFilter<TData>[] | null) => void
  joinOperator?: JoinOperator
  onJoinOperatorChange?: (operator: JoinOperator) => void
}

export function TableFilterMenu<TData>({
  table,
  filters: controlledFilters,
  onFiltersChange: controlledOnFiltersChange,
  // Legacy properties ignored: joinOperator, onJoinOperatorChange - now uses individual joinOperators
  ...props
}: Omit<
  TableFilterMenuProps<TData>,
  "joinOperator" | "onJoinOperatorChange"
> & {
  joinOperator?: JoinOperator
  onJoinOperatorChange?: (operator: JoinOperator) => void
}) {
  const id = React.useId()
  const labelId = React.useId()
  const descriptionId = React.useId()
  const [open, setOpen] = React.useState(false)
  const addButtonRef = React.useRef<HTMLButtonElement>(null)

  // Initialize filters from table state (replaces initialization useEffect)
  const initialFilters = useInitialFilters(table, controlledFilters)
  const [internalFilters, setInternalFilters] = React.useState(initialFilters)

  // Use controlled values if provided, otherwise use internal state
  const filters = controlledFilters ?? internalFilters
  const isControlled = Boolean(controlledFilters)

  // Handler that works with both controlled and internal state
  const onFiltersChange = React.useCallback(
    (newFilters: ExtendedColumnFilter<TData>[] | null) => {
      if (controlledOnFiltersChange) {
        controlledOnFiltersChange(newFilters)
      } else {
        setInternalFilters(newFilters ?? [])
      }
    },
    [controlledOnFiltersChange],
  )

  // Sync filters with table state (replaces sync useEffect)
  useSyncFiltersWithTable(table, filters, isControlled)

  // Legacy global join operator - replaced with individual join operators per filter
  const onJoinOperatorChange = React.useCallback(() => {
    // No-op: Individual join operators handle this functionality
    console.warn(ERROR_MESSAGES.DEPRECATED_GLOBAL_JOIN_OPERATOR)
  }, [])

  const columns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter(column => column.columnDef.enableColumnFilter)
  }, [table])

  const onFilterAdd = React.useCallback(() => {
    const column = columns[0]

    if (!column) return

    const filterWithoutId = {
      id: column.id as Extract<keyof TData, string>,
      value: "",
      variant: column.columnDef.meta?.variant ?? "text",
      operator: getDefaultFilterOperator(
        column.columnDef.meta?.variant ?? "text",
      ),
      joinOperator: JOIN_OPERATORS.AND, // Default to AND for new filters
    }

    // Use current filter length as index to ensure unique IDs
    const newFilterIndex = filters.length

    onFiltersChange([
      ...filters,
      {
        ...filterWithoutId,
        filterId: createFilterId(filterWithoutId, newFilterIndex),
      },
    ])
  }, [columns, filters, onFiltersChange])

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

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter(
        filter => filter.filterId !== filterId,
      )
      onFiltersChange(updatedFilters)
      requestAnimationFrame(() => {
        addButtonRef.current?.focus()
      })
    },
    [filters, onFiltersChange],
  )

  const onFiltersReset = React.useCallback(() => {
    onFiltersChange(null)
    onJoinOperatorChange?.() // Legacy - individual filters handle their own join operators
  }, [onFiltersChange, onJoinOperatorChange])

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

  // Handle filter reordering with join operator normalization
  const handleFiltersReorder = React.useCallback(
    (reorderedFilters: ExtendedColumnFilter<TData>[]) => {
      // Normalize join operators when filters are reordered
      const normalizedFilters = normalizeFilterJoinOperators(
        filters,
        reorderedFilters,
      )
      onFiltersChange(normalizedFilters)
    },
    [filters, onFiltersChange],
  )

  return (
    <Sortable
      value={filters}
      onValueChange={handleFiltersReorder}
      getItemValue={item => item.filterId}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" title="Open filter menu (F)">
            <ListFilter />
            Filter
            {filters.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono text-[10.4px] font-normal"
              >
                {filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className="flex w-full max-w-(--radix-popover-content-available-width) origin-(--radix-popover-content-transform-origin) flex-col gap-3.5 p-4 sm:min-w-[380px]"
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h4 id={labelId} className="leading-none font-medium">
              {filters.length > 0 ? "Filters" : "No filters applied"}
            </h4>
            <p
              id={descriptionId}
              className={cn(
                "text-sm text-muted-foreground",
                filters.length > 0 && "sr-only",
              )}
            >
              {filters.length > 0
                ? "Modify filters to refine your rows."
                : "Add filters to refine your rows."}
            </p>
          </div>
          {filters.length > 0 ? (
            <SortableContent asChild>
              <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1">
                {filters.map((filter, index) => (
                  <TableFilterItem<TData>
                    key={filter.filterId}
                    filter={filter}
                    index={index}
                    filterItemId={`${id}-filter-${filter.filterId}`}
                    columns={columns}
                    onFilterUpdate={onFilterUpdate}
                    onFilterRemove={onFilterRemove}
                  />
                ))}
              </ul>
            </SortableContent>
          ) : null}
          <div className="flex w-full items-center gap-2">
            <Button
              size="sm"
              className="rounded"
              ref={addButtonRef}
              onClick={onFilterAdd}
              title="Add a new filter"
            >
              Add filter
            </Button>
            {filters.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded"
                onClick={onFiltersReset}
                title="Clear all filters"
              >
                Reset filters
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 min-w-[72px] rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 min-w-36 flex-1 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  )
}

interface TableFilterItemProps<TData> {
  filter: ExtendedColumnFilter<TData>
  index: number
  filterItemId: string
  columns: Column<TData>[]
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  onFilterRemove: (filterId: string) => void
}

function TableFilterItem<TData>({
  filter,
  index,
  filterItemId,
  columns,
  onFilterUpdate,
  onFilterRemove,
}: TableFilterItemProps<TData>) {
  const [showFieldSelector, setShowFieldSelector] = React.useState(false)
  const [showOperatorSelector, setShowOperatorSelector] = React.useState(false)
  const [showValueSelector, setShowValueSelector] = React.useState(false)

  const column = columns.find(column => column.id === filter.id)
  const inputId = `${filterItemId}-input`
  const columnMeta = column?.columnDef.meta

  // Handle keyboard shortcuts for removing filters
  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>) => {
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
    <SortableItem value={filter.filterId} asChild>
      <li
        id={filterItemId}
        tabIndex={-1}
        className="flex items-center gap-2"
        onKeyDown={onItemKeyDown}
      >
        {/* Join operator (AND/OR) or "Where" for first filter */}
        <FilterJoinOperator
          filter={filter}
          index={index}
          filterItemId={filterItemId}
          onFilterUpdate={onFilterUpdate}
        />

        {/* Field selector */}
        <FilterFieldSelector
          filter={filter}
          filterItemId={filterItemId}
          columns={columns}
          onFilterUpdate={onFilterUpdate}
          showFieldSelector={showFieldSelector}
          setShowFieldSelector={setShowFieldSelector}
        />

        {/* Operator selector (equals, contains, etc.) */}
        <FilterOperatorSelector
          filter={filter}
          filterItemId={filterItemId}
          onFilterUpdate={onFilterUpdate}
          showOperatorSelector={showOperatorSelector}
          setShowOperatorSelector={setShowOperatorSelector}
        />

        {/* Value input (text, number, select, date, etc.) */}
        <div className="min-w-36 flex-1">
          <FilterValueInput
            filter={filter}
            inputId={inputId}
            column={column}
            columnMeta={columnMeta}
            onFilterUpdate={onFilterUpdate}
            showValueSelector={showValueSelector}
            setShowValueSelector={setShowValueSelector}
          />
        </div>

        {/* Remove button */}
        <Button
          aria-controls={filterItemId}
          variant="outline"
          size="icon"
          className="size-8 rounded"
          onClick={() => onFilterRemove(filter.filterId)}
          title="Remove filter"
        >
          <Trash2 />
        </Button>

        {/* Drag handle */}
        <SortableItemHandle asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded"
            title="Drag to reorder filters"
          >
            <Grip />
          </Button>
        </SortableItemHandle>
      </li>
    </SortableItem>
  )
}

/* ----------------------------- Filter Input Components ---------------------------- */

interface FilterInputProps<TData> {
  filter: ExtendedColumnFilter<TData>
  inputId: string
  column: Column<TData>
  columnMeta?: Column<TData>["columnDef"]["meta"]
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  showValueSelector: boolean
  setShowValueSelector: (value: boolean) => void
}

/**
 * Empty state filter input for isEmpty/isNotEmpty operators
 */
function FilterEmptyInput<TData>({
  inputId,
  columnMeta,
  filter,
}: Pick<FilterInputProps<TData>, "inputId" | "columnMeta" | "filter">) {
  return (
    <div
      id={inputId}
      role="status"
      aria-label={`${columnMeta?.label} filter is ${
        filter.operator === "isEmpty" ? "empty" : "not empty"
      }`}
      aria-live="polite"
      className="h-8 w-full rounded border bg-transparent dark:bg-input/30"
    />
  )
}
FilterEmptyInput.displayName = "FilterEmptyInput"

/**
 * Text or number input for text/number/range variants
 */
function FilterTextNumberInput<TData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
}: Pick<
  FilterInputProps<TData>,
  "filter" | "inputId" | "columnMeta" | "onFilterUpdate"
>) {
  const isNumber = filter.variant === "number" || filter.variant === "range"

  return (
    <Input
      id={inputId}
      type={isNumber ? "number" : "text"}
      aria-label={`${columnMeta?.label} filter value`}
      aria-describedby={`${inputId}-description`}
      inputMode={isNumber ? "numeric" : undefined}
      placeholder={columnMeta?.placeholder ?? "Enter a value..."}
      className="h-8 w-full rounded"
      value={typeof filter.value === "string" ? filter.value : ""}
      onChange={event =>
        onFilterUpdate(filter.filterId, {
          value: String(event.target.value),
        })
      }
    />
  )
}
FilterTextNumberInput.displayName = "FilterTextNumberInput"

/**
 * Boolean select input
 */
function FilterBooleanSelect<TData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: FilterInputProps<TData>) {
  if (Array.isArray(filter.value)) return null

  const inputListboxId = `${inputId}-listbox`

  return (
    <Select
      open={showValueSelector}
      onOpenChange={setShowValueSelector}
      value={filter.value}
      onValueChange={value =>
        onFilterUpdate(filter.filterId, {
          value,
        })
      }
    >
      <SelectTrigger
        id={inputId}
        aria-controls={inputListboxId}
        aria-label={`${columnMeta?.label} boolean filter`}
        className="h-8 w-full rounded data-size:h-8"
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
FilterBooleanSelect.displayName = "FilterBooleanSelect"

/**
 * Select/multi-select faceted input
 */
function FilterFacetedSelect<TData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: FilterInputProps<TData>) {
  const inputListboxId = `${inputId}-listbox`
  const multiple = filter.variant === "multiSelect"
  const selectedValues = multiple
    ? Array.isArray(filter.value)
      ? filter.value
      : []
    : typeof filter.value === "string"
      ? filter.value
      : undefined

  return (
    <Faceted
      open={showValueSelector}
      onOpenChange={setShowValueSelector}
      value={selectedValues}
      onValueChange={value => {
        onFilterUpdate(filter.filterId, {
          value,
        })
      }}
      multiple={multiple}
    >
      <FacetedTrigger asChild>
        <Button
          id={inputId}
          aria-controls={inputListboxId}
          aria-label={`${columnMeta?.label} filter value${multiple ? "s" : ""}`}
          variant="outline"
          size="sm"
          className="w-full rounded font-normal"
          title={`Select ${columnMeta?.label?.toLowerCase() ?? "option"}${multiple ? "s" : ""}`}
        >
          <FacetedBadgeList
            options={columnMeta?.options}
            placeholder={
              columnMeta?.placeholder ??
              `Select option${multiple ? "s" : ""}...`
            }
          />
        </Button>
      </FacetedTrigger>
      <FacetedContent
        id={inputListboxId}
        className="w-[200px] origin-(--radix-popover-content-transform-origin)"
      >
        <FacetedInput
          aria-label={`Search ${columnMeta?.label} options`}
          placeholder={columnMeta?.placeholder ?? "Search options..."}
        />
        <FacetedList>
          <FacetedEmpty>No options found.</FacetedEmpty>
          <FacetedGroup>
            {columnMeta?.options?.map((option: Option) => (
              <FacetedItem key={option.value} value={option.value}>
                {option.icon && <option.icon />}
                <span>{option.label}</span>
                {option.count && (
                  <span className="ml-auto font-mono text-xs">
                    {option.count}
                  </span>
                )}
              </FacetedItem>
            ))}
          </FacetedGroup>
        </FacetedList>
      </FacetedContent>
    </Faceted>
  )
}

/**
 * Date picker input for date/dateRange variants
 */
function FilterDatePicker<TData>({
  filter,
  inputId,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: FilterInputProps<TData>) {
  const inputListboxId = `${inputId}-listbox`

  const dateValue = Array.isArray(filter.value)
    ? filter.value.filter(Boolean)
    : [filter.value, filter.value].filter(Boolean)

  const displayValue =
    filter.operator === "isBetween" && dateValue.length === 2
      ? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(
          new Date(Number(dateValue[1])),
        )}`
      : dateValue[0]
        ? formatDate(new Date(Number(dateValue[0])))
        : "Pick a date"

  return (
    <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
      <PopoverTrigger asChild>
        <Button
          id={inputId}
          aria-controls={inputListboxId}
          aria-label={`${columnMeta?.label} date filter`}
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start rounded text-left font-normal",
            !filter.value && "text-muted-foreground",
          )}
          title={`Select ${columnMeta?.label?.toLowerCase() ?? "date"}${filter.operator === "isBetween" ? " range" : ""}`}
        >
          <CalendarIcon />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={inputListboxId}
        align="start"
        className="w-auto origin-(--radix-popover-content-transform-origin) p-0"
      >
        {filter.operator === "isBetween" ? (
          <Calendar
            aria-label={`Select ${columnMeta?.label} date range`}
            mode="range"
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
            aria-label={`Select ${columnMeta?.label} date`}
            mode="single"
            captionLayout="dropdown"
            selected={dateValue[0] ? new Date(Number(dateValue[0])) : undefined}
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

/**
 * Main filter input renderer - delegates to specific input components
 */
function FilterValueInput<TData>(props: FilterInputProps<TData>) {
  const { filter, column, inputId, onFilterUpdate } = props

  // Empty state for isEmpty/isNotEmpty operators
  if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
    return <FilterEmptyInput {...props} />
  }

  // Variant-specific inputs
  switch (filter.variant) {
    case "text":
    case "number":
    case "range": {
      // Range filter for isBetween operator
      if (
        (filter.variant === "range" && filter.operator === "isBetween") ||
        filter.operator === "isBetween"
      ) {
        return (
          <TableRangeFilter
            filter={filter}
            column={column}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
          />
        )
      }

      return <FilterTextNumberInput {...props} />
    }

    case "boolean":
      return <FilterBooleanSelect {...props} />

    case "select":
    case "multiSelect":
      return <FilterFacetedSelect {...props} />

    case "date":
    case "dateRange":
      return <FilterDatePicker {...props} />

    default:
      return null
  }
}
FilterValueInput.displayName = "FilterValueInput"
FilterFacetedSelect.displayName = "FilterFacetedSelect"
FilterDatePicker.displayName = "FilterDatePicker"

/* ----------------------- Filter Item Sub-Components ----------------------- */

/**
 * Join operator selector (AND/OR) for filters after the first one
 */
function FilterJoinOperator<TData>({
  filter,
  index,
  filterItemId,
  onFilterUpdate,
}: {
  filter: ExtendedColumnFilter<TData>
  index: number
  filterItemId: string
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
}) {
  const joinOperatorListboxId = `${filterItemId}-join-operator-listbox`

  if (index === 0) {
    return (
      <div className="min-w-[72px] text-center">
        <span className="text-sm text-muted-foreground">Where</span>
      </div>
    )
  }

  return (
    <div className="min-w-[72px] text-center">
      <Select
        value={filter.joinOperator || JOIN_OPERATORS.AND}
        onValueChange={(value: JoinOperator) =>
          onFilterUpdate(filter.filterId, { joinOperator: value })
        }
      >
        <SelectTrigger
          aria-label="Select join operator"
          aria-controls={joinOperatorListboxId}
          className="h-8 rounded lowercase data-size:h-8"
        >
          <SelectValue placeholder={filter.joinOperator || "and"} />
        </SelectTrigger>
        <SelectContent
          id={joinOperatorListboxId}
          position="popper"
          className="min-w-(--radix-select-trigger-width) lowercase"
        >
          {dataTableConfig.joinOperators.map(operator => (
            <SelectItem key={operator} value={operator}>
              {operator}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
FilterJoinOperator.displayName = "FilterJoinOperator"

/**
 * Field selector for choosing which column to filter
 */
function FilterFieldSelector<TData>({
  filter,
  filterItemId,
  columns,
  onFilterUpdate,
  showFieldSelector,
  setShowFieldSelector,
}: {
  filter: ExtendedColumnFilter<TData>
  filterItemId: string
  columns: Column<TData>[]
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  showFieldSelector: boolean
  setShowFieldSelector: (value: boolean) => void
}) {
  const fieldListboxId = `${filterItemId}-field-listbox`

  return (
    <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
      <PopoverTrigger asChild>
        <Button
          aria-controls={fieldListboxId}
          variant="outline"
          size="sm"
          className="w-32 justify-between rounded font-normal"
          title="Select field to filter"
        >
          <span className="truncate">
            {columns.find(column => column.id === filter.id)?.columnDef.meta
              ?.label ?? "Select field"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={fieldListboxId}
        align="start"
        className="w-40 origin-(--radix-popover-content-transform-origin) p-0"
      >
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList>
            <CommandEmpty>No fields found.</CommandEmpty>
            <CommandGroup>
              {columns.map(column => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  onSelect={value => {
                    onFilterUpdate(filter.filterId, {
                      id: value as Extract<keyof TData, string>,
                      variant: column.columnDef.meta?.variant ?? "text",
                      operator: getDefaultFilterOperator(
                        column.columnDef.meta?.variant ?? "text",
                      ),
                      value: "",
                    })

                    setShowFieldSelector(false)
                  }}
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label}
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
  )
}
FilterFieldSelector.displayName = "FilterFieldSelector"

/**
 * Operator selector for choosing filter operation (equals, contains, etc.)
 */
function FilterOperatorSelector<TData>({
  filter,
  filterItemId,
  onFilterUpdate,
  showOperatorSelector,
  setShowOperatorSelector,
}: {
  filter: ExtendedColumnFilter<TData>
  filterItemId: string
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>,
  ) => void
  showOperatorSelector: boolean
  setShowOperatorSelector: (value: boolean) => void
}) {
  const operatorListboxId = `${filterItemId}-operator-listbox`
  const filterOperators = getFilterOperators(filter.variant)

  return (
    <Select
      open={showOperatorSelector}
      onOpenChange={setShowOperatorSelector}
      value={filter.operator}
      onValueChange={(value: FilterOperator) =>
        onFilterUpdate(filter.filterId, {
          operator: value,
          value:
            value === "isEmpty" || value === "isNotEmpty" ? "" : filter.value,
        })
      }
    >
      <SelectTrigger
        aria-controls={operatorListboxId}
        className="h-8 w-32 rounded lowercase data-size:h-8"
      >
        <div className="truncate">
          <SelectValue placeholder={filter.operator} />
        </div>
      </SelectTrigger>
      <SelectContent
        id={operatorListboxId}
        className="origin-(--radix-select-content-transform-origin)"
      >
        {filterOperators.map(operator => (
          <SelectItem
            key={operator.value}
            value={operator.value}
            className="lowercase"
          >
            {operator.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
FilterOperatorSelector.displayName = "FilterOperatorSelector"

/* ----------------------------- Main Components ---------------------------- */

// Add displayName to DataTableFilterItem for React DevTools
interface DataTableFilterItemType {
  <TData>(props: TableFilterItemProps<TData>): React.JSX.Element | null
  displayName?: string
}

;(TableFilterItem as DataTableFilterItemType).displayName =
  "DataTableFilterItem"

/**
 * @required displayName is required for auto feature detection
 * @see src/components/data-table/config/feature-detection.ts
 */
TableFilterMenu.displayName = "TableFilterMenu"
