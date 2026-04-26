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

import type { FilterFn, RowData } from "@tanstack/react-table"
import type { ExtendedColumnFilter, FilterOperator } from "../types"
import { JOIN_OPERATORS, FILTER_OPERATORS, FILTER_VARIANTS } from "./constants"

// ============================================================================
// Regex Cache for Performance
// ============================================================================

// LRU-style regex cache. At 1k rows × 10 cols, naive `new RegExp` per cell
// burns 100-500ms per keystroke; reuse drops it to 5-20ms.
const regexCache = new Map<string, RegExp>()
const MAX_REGEX_CACHE_SIZE = 100

// Module-scoped guard so the RELATIVE-not-implemented warning fires once,
// not once per row × filter (would emit thousands of lines).
let hasLoggedRelativeFilterWarning = false

// LRU-evicted regex cache lookup.
function getOrCreateRegex(pattern: string, flags: string): RegExp {
  const key = `${pattern}:${flags}`

  if (regexCache.has(key)) {
    const cachedRegex = regexCache.get(key)
    if (cachedRegex !== undefined) {
      return cachedRegex
    }
  }

  // Limit cache size to prevent memory leaks
  if (regexCache.size >= MAX_REGEX_CACHE_SIZE) {
    const firstKey = regexCache.keys().next().value
    if (firstKey !== undefined) {
      regexCache.delete(firstKey)
    }
  }

  try {
    const regex = new RegExp(pattern, flags)
    regexCache.set(key, regex)
    return regex
  } catch {
    // Return a regex that matches nothing if pattern is invalid
    const fallbackRegex = /(?!)/
    regexCache.set(key, fallbackRegex)
    return fallbackRegex
  }
}

/**
 * Custom filter function that handles our extended filter operators
 */
export const extendedFilter: FilterFn<RowData> = (
  row,
  columnId,
  filterValue,
  _addMeta,
) => {
  // If no filter value, show all rows
  if (!filterValue) return true

  // Handle our extended filter format
  if (
    typeof filterValue === "object" &&
    filterValue.operator &&
    filterValue.value !== undefined
  ) {
    const filter = filterValue as ExtendedColumnFilter<RowData>
    return applyFilterOperator(
      row.getValue(columnId),
      filter.operator,
      filter.value,
    )
  }

  // Handle raw array filter values
  if (Array.isArray(filterValue)) {
    const cellValue = row.getValue(columnId)
    if (cellValue == null) return false

    // Handle numeric range arrays [min, max] from slider filters
    // Check if both values are numbers - if so, treat as range
    if (
      filterValue.length === 2 &&
      typeof filterValue[0] === "number" &&
      typeof filterValue[1] === "number"
    ) {
      const [min, max] = filterValue
      const value = Number(cellValue)
      if (isNaN(value)) return false
      return value >= min && value <= max
    }

    // Handle string arrays (from TableFacetedFilter with multiple selection)
    // When filterValue is an array like ["electronics", "clothing"], check if cell value is in the array

    // Case-insensitive comparison for strings
    if (typeof cellValue === "string") {
      const cellLower = cellValue.toLowerCase()
      return filterValue.some(val =>
        typeof val === "string"
          ? val.toLowerCase() === cellLower
          : String(val) === cellValue,
      )
    }
    // For non-string types, convert to string for comparison
    return filterValue.some(val => String(val) === String(cellValue))
  }

  // Fallback to default string contains behavior for simple values
  const cellValue = row.getValue(columnId)
  if (cellValue == null) return false

  try {
    const cellStr = String(cellValue).toLowerCase()
    const filterStr = String(filterValue).toLowerCase()
    const escapedFilter = filterStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = getOrCreateRegex(escapedFilter, "i") // ✅ Use cached regex
    return regex.test(cellStr)
  } catch {
    return String(cellValue)
      .toLowerCase()
      .includes(String(filterValue).toLowerCase())
  }
}

/**
 * Global filter with operator precedence. Supports plain string search,
 * pure OR, and mixed AND/OR (AND has higher precedence than OR — splits
 * filters into OR-separated AND-groups).
 */
export const globalFilter: FilterFn<RowData> = (
  row,
  _columnId,
  filterValue,
  _addMeta,
) => {
  // If no filter value, show all rows
  if (!filterValue) return true

  // Check if this is a complex filter object (from filter menu)
  if (
    typeof filterValue === "object" &&
    filterValue.filters &&
    Array.isArray(filterValue.filters)
  ) {
    const filters = filterValue.filters

    // Handle different join operator modes
    if (filterValue.joinOperator === "or") {
      // Pure OR logic: at least one filter must match
      return filters.some((filter: ExtendedColumnFilter<RowData>) => {
        const cellValue = row.getValue(filter.id)
        return applyFilterOperator(
          cellValue as string | number | boolean | null | undefined,
          filter.operator,
          filter.value as string | number | boolean | null | undefined,
        )
      })
    } else if (filterValue.joinOperator === JOIN_OPERATORS.MIXED) {
      // Mixed logic: process with proper operator precedence (AND before OR)
      if (filters.length === 0) return true
      if (filters.length === 1) {
        const filter = filters[0]
        const cellValue = row.getValue(filter.id)
        return applyFilterOperator(
          cellValue as string | number | boolean | null | undefined,
          filter.operator,
          filter.value as string | number | boolean | null | undefined,
        )
      }

      // Apply mathematical precedence: AND has higher precedence than OR
      // Split filters into OR-separated groups, then AND within each group
      const orGroups: (typeof filters)[] = []
      let currentAndGroup: typeof filters = []

      // Add first filter to the first AND group
      currentAndGroup.push(filters[0])

      // Process remaining filters
      for (let i = 1; i < filters.length; i++) {
        const filter = filters[i]

        if (filter.joinOperator === JOIN_OPERATORS.OR) {
          // OR breaks the current AND group, start a new one
          orGroups.push(currentAndGroup)
          currentAndGroup = [filter]
        } else {
          // AND continues the current group
          currentAndGroup.push(filter)
        }
      }

      // Add the last group
      orGroups.push(currentAndGroup)

      // Evaluate each OR group (AND logic within each group)
      const groupResults = orGroups.map(andGroup => {
        return andGroup.every((filter: ExtendedColumnFilter<RowData>) => {
          const cellValue = row.getValue(filter.id)
          return applyFilterOperator(
            cellValue as string | number | boolean | null | undefined,
            filter.operator,
            filter.value as string | number | boolean | null | undefined,
          )
        })
      })

      // OR all group results together
      return groupResults.some(result => result)
    }

    // Default to AND logic for other cases
    return filters.every((filter: ExtendedColumnFilter<RowData>) => {
      const cellValue = row.getValue(filter.id)
      return applyFilterOperator(
        cellValue as string | number | boolean | null | undefined,
        filter.operator,
        filter.value as string | number | boolean | null | undefined,
      )
    })
  }

  // Regular global search (string search across all columns)
  const searchValue = String(filterValue).toLowerCase()

  // Search across all columns that have filtering enabled
  return row.getAllCells().some(cell => {
    const column = cell.column

    // Skip columns that have filtering disabled
    if (column.getCanFilter() === false) return false

    const cellValue = cell.getValue()

    // Skip null/undefined values
    if (cellValue == null) return false

    try {
      // Convert cell value to string and search using regex
      const cellStr = String(cellValue).toLowerCase()
      const escapedFilter = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = getOrCreateRegex(escapedFilter, "i") // ✅ Use cached regex
      return regex.test(cellStr)
    } catch {
      // Fallback to simple includes if regex fails
      return String(cellValue).toLowerCase().includes(searchValue)
    }
  })
}

/**
 * Apply filter operator to a cell value
 */
function applyFilterOperator(
  cellValue: string | number | boolean | null | undefined,
  operator: FilterOperator,
  filterValue: string | number | boolean | null | undefined | string[],
): boolean {
  // Handle null/undefined cell values
  if (cellValue == null) {
    switch (operator) {
      case FILTER_OPERATORS.EMPTY:
        return true
      case FILTER_OPERATORS.NOT_EMPTY:
        return false
      default:
        return false
    }
  }

  // Convert cell value to string for text operations
  const cellStr = String(cellValue).toLowerCase()
  const filterStr = String(filterValue).toLowerCase()

  switch (operator) {
    // Text operators
    case FILTER_OPERATORS.ILIKE:
      try {
        // Escape special regex characters in the filter string
        const escapedFilter = filterStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = getOrCreateRegex(escapedFilter, "i") // ✅ Use cached regex
        return regex.test(cellStr)
      } catch {
        // Fallback to simple includes if regex fails
        return cellStr.includes(filterStr)
      }

    case FILTER_OPERATORS.NOT_ILIKE:
      try {
        // Escape special regex characters in the filter string
        const escapedFilter = filterStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = getOrCreateRegex(escapedFilter, "i") // ✅ Use cached regex
        return !regex.test(cellStr)
      } catch {
        // Fallback to simple includes if regex fails
        return !cellStr.includes(filterStr)
      }

    case FILTER_OPERATORS.EQ:
      // Case-insensitive comparison for strings
      if (typeof cellValue === "string" && typeof filterValue === "string") {
        return cellStr === filterStr
      }
      // Boolean comparison - convert boolean to string for comparison with string filter values
      // This handles cases where cellValue is boolean (true/false) and filterValue is string ("true"/"false")
      if (typeof cellValue === "boolean") {
        const cellBoolStr = String(cellValue)
        return cellBoolStr === String(filterValue)
      }
      if (typeof filterValue === "boolean") {
        const filterBoolStr = String(filterValue)
        return filterBoolStr === String(cellValue)
      }
      // Date comparison - check if cellValue is a Date object
      if (
        typeof cellValue === "object" &&
        cellValue !== null &&
        "getTime" in cellValue
      ) {
        const dateCell = (cellValue as { getTime: () => number }).getTime()
        const dateFilter = Number(filterValue)
        // For date equality, compare dates at day level (midnight to midnight)
        if (!isNaN(dateCell) && !isNaN(dateFilter)) {
          const cellDate = new Date(dateCell).setHours(0, 0, 0, 0)
          const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0)
          return cellDate === filterDate
        }
      }
      // Numeric comparison - convert both to numbers
      if (typeof cellValue === "number" || typeof filterValue === "number") {
        const numCell = Number(cellValue)
        const numFilter = Number(filterValue)
        // Check for valid numbers before comparing
        if (!isNaN(numCell) && !isNaN(numFilter)) {
          return numCell === numFilter
        }
      }
      return cellValue === filterValue

    case FILTER_OPERATORS.NEQ:
      // Case-insensitive comparison for strings
      if (typeof cellValue === "string" && typeof filterValue === "string") {
        return cellStr !== filterStr
      }
      // Date comparison - check if cellValue is a Date object
      if (
        typeof cellValue === "object" &&
        cellValue !== null &&
        "getTime" in cellValue
      ) {
        const dateCell = (cellValue as { getTime: () => number }).getTime()
        const dateFilter = Number(filterValue)
        // For date inequality, compare dates at day level (midnight to midnight)
        if (!isNaN(dateCell) && !isNaN(dateFilter)) {
          const cellDate = new Date(dateCell).setHours(0, 0, 0, 0)
          const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0)
          return cellDate !== filterDate
        }
      }
      // Numeric comparison - convert both to numbers
      if (typeof cellValue === "number" || typeof filterValue === "number") {
        const numCell = Number(cellValue)
        const numFilter = Number(filterValue)
        // Check for valid numbers before comparing
        if (!isNaN(numCell) && !isNaN(numFilter)) {
          return numCell !== numFilter
        }
      }
      return cellValue !== filterValue

    case FILTER_OPERATORS.EMPTY:
      // Check for empty strings and whitespace-only strings
      if (typeof cellValue === "string") {
        return cellValue.trim() === ""
      }
      return cellValue == null

    case FILTER_OPERATORS.NOT_EMPTY:
      // Check for non-empty strings (excluding whitespace-only)
      if (typeof cellValue === "string") {
        return cellValue.trim() !== ""
      }
      return cellValue != null

    // Numeric operators
    case FILTER_OPERATORS.LT: {
      const numCell = Number(cellValue)
      const numFilter = Number(filterValue)
      // Check for valid numbers (NaN would make comparison false)
      if (isNaN(numCell) || isNaN(numFilter)) return false
      return numCell < numFilter
    }

    case FILTER_OPERATORS.LTE: {
      const numCell = Number(cellValue)
      const numFilter = Number(filterValue)
      if (isNaN(numCell) || isNaN(numFilter)) return false
      return numCell <= numFilter
    }

    case FILTER_OPERATORS.GT: {
      const numCell = Number(cellValue)
      const numFilter = Number(filterValue)
      if (isNaN(numCell) || isNaN(numFilter)) return false
      return numCell > numFilter
    }

    case FILTER_OPERATORS.GTE: {
      const numCell = Number(cellValue)
      const numFilter = Number(filterValue)
      if (isNaN(numCell) || isNaN(numFilter)) return false
      return numCell >= numFilter
    }

    case FILTER_OPERATORS.BETWEEN:
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const [min, max] = filterValue
        const numValue = Number(cellValue)
        const numMin = Number(min)
        const numMax = Number(max)
        // Validate all numbers are valid
        if (isNaN(numValue) || isNaN(numMin) || isNaN(numMax)) return false
        return numValue >= numMin && numValue <= numMax
      }
      return false

    // Array operators
    case FILTER_OPERATORS.IN:
      if (Array.isArray(filterValue)) {
        // Handle case-insensitive string comparison
        if (typeof cellValue === "string") {
          const cellLower = cellValue.toLowerCase()
          return filterValue.some(val =>
            typeof val === "string"
              ? val.toLowerCase() === cellLower
              : val === cellValue,
          )
        }
        // For non-string types, convert to string for comparison
        return filterValue.some(val => String(val) === String(cellValue))
      }
      return false

    case FILTER_OPERATORS.NOT_IN:
      if (Array.isArray(filterValue)) {
        // Handle case-insensitive string comparison
        if (typeof cellValue === "string") {
          const cellLower = cellValue.toLowerCase()
          return !filterValue.some(val =>
            typeof val === "string"
              ? val.toLowerCase() === cellLower
              : val === cellValue,
          )
        }
        // For non-string types, convert to string for comparison
        return !filterValue.some(val => String(val) === String(cellValue))
      }
      return true

    // Date operators (basic implementation)
    case FILTER_OPERATORS.RELATIVE:
      // Not implemented — throw in dev (loud), return no matches in prod
      // (safer than silently passing every row).
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          "FILTER_OPERATORS.RELATIVE is not yet implemented. Either remove the 'Is relative to today' option from the date filter UI or implement this case.",
        )
      }
      if (!hasLoggedRelativeFilterWarning) {
        hasLoggedRelativeFilterWarning = true
        console.error(
          "FILTER_OPERATORS.RELATIVE is not yet implemented — returning no matches in production to avoid silently passing all rows.",
        )
      }
      return false

    default:
      // Fallback to contains behavior using regex
      try {
        const escapedFilter = filterStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = getOrCreateRegex(escapedFilter, "i") // ✅ Use cached regex
        return regex.test(cellStr)
      } catch {
        return cellStr.includes(filterStr)
      }
  }
}

/**
 * Filter function for number range (slider) filters
 * Handles array values [min, max] for range filtering
 */
export const numberRangeFilter: FilterFn<RowData> = (
  row,
  columnId,
  filterValue,

  addMeta,
) => {
  if (!filterValue) return true

  // Handle ExtendedColumnFilter format
  if (
    typeof filterValue === "object" &&
    filterValue.operator &&
    filterValue.value !== undefined
  ) {
    const filter = filterValue as ExtendedColumnFilter<RowData>
    return applyFilterOperator(
      row.getValue(columnId),
      filter.operator,
      filter.value,
    )
  }

  // Handle array format [min, max] from slider
  if (Array.isArray(filterValue) && filterValue.length === 2) {
    const [min, max] = filterValue
    const value = Number(row.getValue(columnId))
    if (isNaN(value)) return false
    const numMin = Number(min)
    const numMax = Number(max)
    if (isNaN(numMin) || isNaN(numMax)) return false
    return value >= numMin && value <= numMax
  }

  // Fallback to extendedFilter for other formats
  return extendedFilter(row, columnId, filterValue, addMeta)
}

/**
 * Filter function for date range filters
 * Handles both single date (timestamp) and date range [from, to] (timestamps)
 */
export const dateRangeFilter: FilterFn<RowData> = (
  row,
  columnId,
  filterValue,

  addMeta,
) => {
  if (!filterValue) return true

  // Handle ExtendedColumnFilter format
  if (
    typeof filterValue === "object" &&
    filterValue.operator &&
    filterValue.value !== undefined
  ) {
    const filter = filterValue as ExtendedColumnFilter<RowData>
    return applyFilterOperator(
      row.getValue(columnId),
      filter.operator,
      filter.value,
    )
  }

  const rowValue = row.getValue(columnId)
  if (!rowValue) return false

  // Handle Date objects - convert to timestamp
  const rowTimestamp =
    rowValue instanceof Date
      ? rowValue.getTime()
      : typeof rowValue === "number"
        ? rowValue
        : new Date(rowValue as string).getTime()

  if (isNaN(rowTimestamp)) return false

  // Handle array format [from, to] from date range picker
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 2) {
      const [from, to] = filterValue
      const fromTime = Number(from)
      const toTime = Number(to)
      if (isNaN(fromTime) || isNaN(toTime)) return false
      return rowTimestamp >= fromTime && rowTimestamp <= toTime
    }
    // Single date in array
    if (filterValue.length === 1) {
      const dateTime = Number(filterValue[0])
      if (isNaN(dateTime)) return false
      // Compare dates at day level (midnight to midnight)
      const rowDate = new Date(rowTimestamp).setHours(0, 0, 0, 0)
      const filterDate = new Date(dateTime).setHours(0, 0, 0, 0)
      return rowDate === filterDate
    }
  }

  // Handle single timestamp
  if (typeof filterValue === "number") {
    // Compare dates at day level (midnight to midnight)
    const rowDate = new Date(rowTimestamp).setHours(0, 0, 0, 0)
    const filterDate = new Date(filterValue).setHours(0, 0, 0, 0)
    return rowDate === filterDate
  }

  // Fallback to extendedFilter for other formats
  return extendedFilter(row, columnId, filterValue, addMeta)
}

/**
 * Helper function to create filter value with operator
 *
 * @param operator - The filter operator to apply
 * @param value - The value to filter by
 * @returns ExtendedColumnFilter object with default properties
 */
export const createFilterValue = <TData extends RowData = RowData>(
  operator: FilterOperator,
  value: string | number | boolean | null | undefined | string[],
): ExtendedColumnFilter<TData> => {
  return {
    id: "" as Extract<keyof TData, string>, // Will be set by the column
    filterId: "", // Will be set by the filter system
    operator,
    value: value as string | string[],
    variant: FILTER_VARIANTS.TEXT, // Default variant
    joinOperator: JOIN_OPERATORS.AND, // Default join operator
  }
}
// Mixed AND/OR: filters tagged JOIN_OPERATORS.MIXED apply AND-before-OR
// precedence. Pure AND still goes through columnFilters for perf.
