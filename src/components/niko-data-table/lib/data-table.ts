import { dataTableConfig } from "../config/data-table"
import { FILTER_OPERATORS, FILTER_VARIANTS, JOIN_OPERATORS } from "./constants"
import type {
  ExtendedColumnFilter,
  FilterOperator,
  FilterVariant,
} from "../types"

export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<
    FilterVariant,
    { label: string; value: FilterOperator }[]
  > = {
    [FILTER_VARIANTS.TEXT]: dataTableConfig.textOperators,
    [FILTER_VARIANTS.NUMBER]: dataTableConfig.numericOperators,
    [FILTER_VARIANTS.RANGE]: dataTableConfig.numericOperators,
    [FILTER_VARIANTS.DATE]: dataTableConfig.dateOperators,
    [FILTER_VARIANTS.DATE_RANGE]: dataTableConfig.dateOperators,
    [FILTER_VARIANTS.BOOLEAN]: dataTableConfig.booleanOperators,
    [FILTER_VARIANTS.SELECT]: dataTableConfig.selectOperators,
    [FILTER_VARIANTS.MULTI_SELECT]: dataTableConfig.multiSelectOperators,
  }

  return operatorMap[filterVariant] ?? dataTableConfig.textOperators
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant)

  return (
    operators[0]?.value ??
    (filterVariant === FILTER_VARIANTS.TEXT
      ? FILTER_OPERATORS.ILIKE
      : FILTER_OPERATORS.EQ)
  )
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  return filters.filter(filter => {
    // isEmpty and isNotEmpty don't need values
    if (
      filter.operator === FILTER_OPERATORS.EMPTY ||
      filter.operator === FILTER_OPERATORS.NOT_EMPTY
    ) {
      return true
    }

    // For array values (like isBetween with range [min, max])
    if (Array.isArray(filter.value)) {
      // All array elements must be non-empty
      return (
        filter.value.length > 0 &&
        filter.value.every(
          val => val !== "" && val !== null && val !== undefined,
        )
      )
    }

    // For non-array values
    return (
      filter.value !== "" && filter.value !== null && filter.value !== undefined
    )
  })
}

/**
 * Process filters to detect OR logic and same-column filters
 *
 * This utility function centralizes the logic for determining whether filters
 * should use OR/MIXED logic (via globalFilter) or AND logic (via columnFilters).
 *
 * It detects:
 * 1. Explicit OR operators (filters with joinOperator === "or")
 * 2. Same-column filters (multiple filters targeting the same column)
 *
 * For same-column filters, it automatically converts AND to OR for better UX,
 * since "brand is apple AND brand is samsung" is impossible and should become
 * "brand is apple OR brand is samsung".
 *
 * @param filters - Array of filters to process
 * @returns Object containing:
 *   - processedFilters: Filters with same-column AND converted to OR
 *   - hasOrFilters: Whether explicit OR operators are present
 *   - hasSameColumnFilters: Whether multiple filters target the same column
 *   - shouldUseGlobalFilter: Whether filters should be routed to globalFilter
 *   - joinOperator: The effective join operator (MIXED or AND)
 *
 * @example
 * ```ts
 * const result = processFiltersForLogic(filters)
 * if (result.shouldUseGlobalFilter) {
 *   setGlobalFilter({ filters: result.processedFilters, joinOperator: result.joinOperator })
 * } else {
 *   setColumnFilters(result.processedFilters.map(f => ({ id: f.id, value: f })))
 * }
 * ```
 */
export function processFiltersForLogic<TData>(
  filters: ExtendedColumnFilter<TData>[],
): {
  processedFilters: ExtendedColumnFilter<TData>[]
  hasOrFilters: boolean
  hasSameColumnFilters: boolean
  shouldUseGlobalFilter: boolean
  joinOperator: typeof JOIN_OPERATORS.MIXED | typeof JOIN_OPERATORS.AND
} {
  // Check for explicit OR operators
  const hasOrFilters = filters.some(
    (filter, index) => index > 0 && filter.joinOperator === JOIN_OPERATORS.OR,
  )

  // Check for multiple filters on the same column (UX: should use OR logic)
  const columnIds = filters.map(f => f.id)
  const hasSameColumnFilters = columnIds.length !== new Set(columnIds).size

  // Process filters: convert same-column AND to OR for better UX
  const processedFilters = hasSameColumnFilters
    ? filters.map((filter, index) => {
        // If this is not the first filter and it's on the same column as a previous filter,
        // convert AND to OR for better UX (same column filters should use OR logic)
        const previousFilters = filters.slice(0, index)
        const hasSameColumnBefore = previousFilters.some(
          f => f.id === filter.id,
        )
        if (hasSameColumnBefore && filter.joinOperator === JOIN_OPERATORS.AND) {
          return { ...filter, joinOperator: JOIN_OPERATORS.OR }
        }
        return filter
      })
    : filters

  const shouldUseGlobalFilter = hasOrFilters || hasSameColumnFilters
  const joinOperator = shouldUseGlobalFilter
    ? JOIN_OPERATORS.MIXED
    : JOIN_OPERATORS.AND

  return {
    processedFilters,
    hasOrFilters,
    hasSameColumnFilters,
    shouldUseGlobalFilter,
    joinOperator,
  }
}
