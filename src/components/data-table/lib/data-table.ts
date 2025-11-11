import { dataTableConfig } from "../config/data-table"
import { FILTER_OPERATORS, FILTER_VARIANTS } from "./constants"
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
      ? FILTER_OPERATORS.I_LIKE
      : FILTER_OPERATORS.EQUAL)
  )
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  return filters.filter(filter => {
    // isEmpty and isNotEmpty don't need values
    if (
      filter.operator === FILTER_OPERATORS.IS_EMPTY ||
      filter.operator === FILTER_OPERATORS.IS_NOT_EMPTY
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
