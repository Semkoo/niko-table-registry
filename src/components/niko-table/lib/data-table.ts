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
 * Operators whose same-column repetitions are equivalent to a single `IN`
 * (e.g. "brand is apple OR brand is samsung" ≡ "brand IN (apple, samsung)").
 * Only these are collapsed into a faceted multi-select entry.
 */
const EQUALITY_OPERATORS = new Set<FilterOperator>([
  FILTER_OPERATORS.EQ,
  FILTER_OPERATORS.IN,
])

/**
 * A pending menu row: an equality filter whose value hasn't been chosen yet.
 * These are inert (no query effect) and must neither pollute a merged `IN`
 * nor trigger OR routing while the user is still picking a value.
 */
function isPendingEqualityFilter<TData>(
  filter: ExtendedColumnFilter<TData>,
): boolean {
  return (
    EQUALITY_OPERATORS.has(filter.operator) &&
    (filter.value === "" ||
      filter.value == null ||
      (Array.isArray(filter.value) && filter.value.length === 0))
  )
}

/**
 * Collapse repeated equality filters on the same column into one `IN`
 * multi-select filter, kept in first-occurrence position.
 *
 * @description The advanced filter menu and the faceted-filter dropdown must
 * stay in sync, but they read different state channels — the dropdown reads a
 * column's value from `columnFilters`, while OR logic is routed to
 * `globalFilter`. Two "brand is X" menu rows are semantically the faceted
 * multi-select's own `{ operator: "in", value: [...] }` shape, so collapsing
 * them yields a single `columnFilters` entry both surfaces read and write.
 *
 * A column is only collapsed when EVERY filter on it is an equality operator;
 * "brand is X OR brand contains Y" can't be a multi-select, so it is left
 * untouched (and continues to route through `globalFilter`).
 */
function collapseSameColumnEqualityFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  const groups = new Map<string, ExtendedColumnFilter<TData>[]>()
  const indicesById = new Map<string, number[]>()
  filters.forEach((filter, index) => {
    const group = groups.get(filter.id) ?? []
    group.push(filter)
    groups.set(filter.id, group)
    const indices = indicesById.get(filter.id) ?? []
    indices.push(index)
    indicesById.set(filter.id, indices)
  })

  const emitted = new Set<string>()
  const result: ExtendedColumnFilter<TData>[] = []

  for (const filter of filters) {
    const group = groups.get(filter.id) ?? []
    // Pending rows (no value yet) pass through untouched — merging them would
    // leak "" into the IN values or make the row vanish from the menu.
    const mergeable = group.filter(member => !isPendingEqualityFilter(member))
    // Only collapse a contiguous run of the column's filters — nothing from
    // another column interleaved. Merging across an interleaved filter would
    // cross an AND/OR clause boundary and change the boolean grouping the
    // mixed-filter evaluator relies on: e.g. "brand=A AND category=C OR
    // brand=B" ((A ∧ C) ∨ B) must not become "brand IN (A,B) AND category=C"
    // ((A ∨ B) ∧ C).
    const indices = indicesById.get(filter.id) ?? []
    const firstIndex = indices[0]
    const lastIndex = indices[indices.length - 1]
    const contiguous =
      indices.length > 0 &&
      firstIndex !== undefined &&
      lastIndex !== undefined &&
      lastIndex - firstIndex + 1 === indices.length
    const collapsible =
      contiguous &&
      mergeable.length > 1 &&
      group.every(member => EQUALITY_OPERATORS.has(member.operator))

    if (!collapsible || isPendingEqualityFilter(filter)) {
      result.push(filter)
      continue
    }

    // Emit the merged filter once, at the first occurrence of the column.
    if (emitted.has(filter.id)) continue
    emitted.add(filter.id)

    const values: string[] = []
    for (const member of mergeable) {
      const memberValues = Array.isArray(member.value)
        ? member.value
        : [member.value]
      for (const value of memberValues) {
        if (!values.includes(value)) values.push(value)
      }
    }

    result.push({
      // collapsible guarantees mergeable.length > 1, so mergeable[0] exists.
      ...mergeable[0]!, // preserve id, filterId and the group's leading joinOperator
      value: values,
      variant: FILTER_VARIANTS.MULTI_SELECT,
      operator: FILTER_OPERATORS.IN,
    })
  }

  return result
}

/**
 * Inverse of {@link collapseSameColumnEqualityFilters}, for menu display:
 * expand a multi-value `IN` filter into one simple "is" row per value,
 * OR-joined after the first row.
 *
 * @description The canonical stored state keeps multi-value equality as a
 * single `IN` entry in `columnFilters` (that's what the faceted dropdown
 * reads), but the filter menu should present it as plain per-value rows —
 * "Brand is Samsung / or Brand is Adidas" — not a "has any of" multi-select
 * row. Row `filterId`s derive from column + value (`brand-in-samsung`) so
 * identities stay stable across edit → collapse → expand cycles and rows
 * don't remount. `NOT_IN` ("has none of") has no per-row equivalent and is
 * left untouched. Returns the input array unchanged (same reference) when
 * nothing is expandable.
 */
export function expandMergedEqualityFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  const isExpandable = (filter: ExtendedColumnFilter<TData>) =>
    filter.operator === FILTER_OPERATORS.IN &&
    Array.isArray(filter.value) &&
    filter.value.length > 0

  if (!filters.some(isExpandable)) return filters

  const result: ExtendedColumnFilter<TData>[] = []
  for (const filter of filters) {
    if (!isExpandable(filter)) {
      result.push(filter)
      continue
    }
    const values = filter.value as string[]
    values.forEach((value, index) => {
      result.push({
        ...filter,
        value,
        variant: FILTER_VARIANTS.SELECT,
        operator: FILTER_OPERATORS.EQ,
        filterId: `${filter.id}-in-${value}`,
        joinOperator:
          index === 0
            ? (filter.joinOperator ?? JOIN_OPERATORS.AND)
            : JOIN_OPERATORS.OR,
      })
    })
  }
  return result
}

/**
 * Process filters to detect OR logic and same-column filters. Auto-converts
 * same-column AND to OR for UX (e.g. "brand=apple AND brand=samsung" is
 * impossible), and collapses repeated same-column equality filters into a
 * single `IN` multi-select entry so the faceted dropdown and the advanced
 * filter menu stay in sync (see {@link collapseSameColumnEqualityFilters}).
 *
 * @param filters - Array of filters to process
 * @returns Object with `processedFilters`, `hasOrFilters`,
 *   `hasSameColumnFilters`, `shouldUseGlobalFilter`, and effective `joinOperator`.
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
  inputFilters: ExtendedColumnFilter<TData>[],
): {
  processedFilters: ExtendedColumnFilter<TData>[]
  hasOrFilters: boolean
  hasSameColumnFilters: boolean
  shouldUseGlobalFilter: boolean
  joinOperator: typeof JOIN_OPERATORS.MIXED | typeof JOIN_OPERATORS.AND
} {
  // Merge repeated same-column equality filters first, so a "brand is X /
  // or brand is Y" menu pair becomes one faceted-readable IN entry rather than
  // two rows routed to globalFilter (where the dropdown can't see them).
  const filters = collapseSameColumnEqualityFilters(inputFilters)

  // Pending equality rows (no value yet) are inert and excluded from routing
  // decisions — a merged IN entry plus a just-added empty row must not
  // re-route the set to globalFilter (which would blank the faceted dropdown
  // mid-edit).
  const activeFilters = filters.filter(f => !isPendingEqualityFilter(f))

  // Check for explicit OR operators
  const hasOrFilters = activeFilters.some(
    (filter, index) => index > 0 && filter.joinOperator === JOIN_OPERATORS.OR,
  )

  // Check for multiple filters on the same column (UX: should use OR logic)
  const columnIds = activeFilters.map(f => f.id)
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
