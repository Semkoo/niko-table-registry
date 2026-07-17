import { describe, expect, it } from "vitest"

import {
  expandMergedEqualityFilters,
  processFiltersForLogic,
} from "@/components/niko-table/lib/data-table"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
} from "@/components/niko-table/lib/constants"
import type { ExtendedColumnFilter } from "@/components/niko-table/types"

type Row = { brand: string; category: string }

function eq(
  id: keyof Row,
  value: string,
  joinOperator: (typeof JOIN_OPERATORS)[keyof typeof JOIN_OPERATORS],
): ExtendedColumnFilter<Row> {
  return {
    id: id as Extract<keyof Row, string>,
    value,
    variant: FILTER_VARIANTS.SELECT,
    operator: FILTER_OPERATORS.EQ,
    filterId: `${id}-${value}`,
    joinOperator,
  }
}

describe("processFiltersForLogic — same-column equality collapse", () => {
  it("collapses two same-column 'is' filters into a single IN entry kept in columnFilters", () => {
    const filters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "adidas", JOIN_OPERATORS.OR),
    ]

    const result = processFiltersForLogic(filters)

    // The faceted dropdown reads columnFilters, so this MUST stay out of globalFilter.
    expect(result.shouldUseGlobalFilter).toBe(false)
    expect(result.processedFilters).toHaveLength(1)

    const merged = result.processedFilters[0]
    expect(merged.id).toBe("brand")
    expect(merged.operator).toBe(FILTER_OPERATORS.IN)
    expect(merged.variant).toBe(FILTER_VARIANTS.MULTI_SELECT)
    expect(merged.value).toEqual(["samsung", "adidas"])
  })

  it("dedupes and flattens existing IN values when merging", () => {
    const filters: ExtendedColumnFilter<Row>[] = [
      {
        id: "brand",
        value: ["samsung", "adidas"],
        variant: FILTER_VARIANTS.MULTI_SELECT,
        operator: FILTER_OPERATORS.IN,
        filterId: "brand-in",
        joinOperator: JOIN_OPERATORS.AND,
      },
      eq("brand", "adidas", JOIN_OPERATORS.OR),
      eq("brand", "apple", JOIN_OPERATORS.OR),
    ]

    const result = processFiltersForLogic(filters)

    expect(result.shouldUseGlobalFilter).toBe(false)
    expect(result.processedFilters).toHaveLength(1)
    expect(result.processedFilters[0].value).toEqual([
      "samsung",
      "adidas",
      "apple",
    ])
  })

  it("still routes genuine cross-column OR to globalFilter", () => {
    const filters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("category", "electronics", JOIN_OPERATORS.OR),
    ]

    const result = processFiltersForLogic(filters)

    expect(result.shouldUseGlobalFilter).toBe(true)
  })

  it("does NOT collapse same-column filters when an operator is non-equality", () => {
    const filters: ExtendedColumnFilter<Row>[] = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      {
        id: "brand",
        value: "adi",
        variant: FILTER_VARIANTS.TEXT,
        operator: FILTER_OPERATORS.ILIKE,
        filterId: "brand-ilike",
        joinOperator: JOIN_OPERATORS.OR,
      },
    ]

    const result = processFiltersForLogic(filters)

    // Can't express "is X OR contains Y" as a faceted multi-select → keep OR/globalFilter.
    expect(result.shouldUseGlobalFilter).toBe(true)
    expect(result.processedFilters).toHaveLength(2)
  })

  it("round-trips to a faceted dropdown showing both values selected", () => {
    // Reproduces the reported bug end-to-end: menu OR pair -> handler write ->
    // faceted `selectedValues` derivation (from table-faceted-filter.tsx).
    const menuFilters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "adidas", JOIN_OPERATORS.OR),
    ]

    const result = processFiltersForLogic(menuFilters)

    // Example handlers write the result into columnFilters when it stays local.
    expect(result.shouldUseGlobalFilter).toBe(false)
    const columnFilters = result.processedFilters.map(f => ({
      id: f.id,
      value: f,
    }))
    const brandFilterValue = columnFilters.find(cf => cf.id === "brand")?.value

    // Faceted dropdown `selectedValues` derivation for an ExtendedColumnFilter.
    const selected =
      brandFilterValue &&
      typeof brandFilterValue === "object" &&
      "value" in brandFilterValue
        ? new Set(
            Array.isArray(brandFilterValue.value)
              ? brandFilterValue.value
              : [String(brandFilterValue.value)],
          )
        : new Set<string>()

    expect([...selected]).toEqual(["samsung", "adidas"])
  })

  it("leaves a single filter untouched", () => {
    const filters = [eq("brand", "samsung", JOIN_OPERATORS.AND)]

    const result = processFiltersForLogic(filters)

    expect(result.shouldUseGlobalFilter).toBe(false)
    expect(result.processedFilters).toHaveLength(1)
    expect(result.processedFilters[0].operator).toBe(FILTER_OPERATORS.EQ)
  })

  it("excludes a pending empty row from the merge and keeps it as-is", () => {
    // User has "Brand is Samsung", "Brand is Adidas" and just added a third
    // brand row whose value is still empty.
    const filters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "adidas", JOIN_OPERATORS.OR),
      eq("brand", "", JOIN_OPERATORS.OR),
    ]

    const result = processFiltersForLogic(filters)

    // The pending row must not leak "" into the IN values, must not vanish,
    // and must not push the whole set back into globalFilter (which would
    // blank the faceted dropdown mid-edit).
    expect(result.shouldUseGlobalFilter).toBe(false)
    expect(result.processedFilters).toHaveLength(2)
    expect(result.processedFilters[0].operator).toBe(FILTER_OPERATORS.IN)
    expect(result.processedFilters[0].value).toEqual(["samsung", "adidas"])
    expect(result.processedFilters[1].value).toBe("")
    expect(result.processedFilters[1].operator).toBe(FILTER_OPERATORS.EQ)
  })

  it("does not merge when only one same-column row has a value yet", () => {
    const filters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "", JOIN_OPERATORS.AND),
    ]

    const result = processFiltersForLogic(filters)

    expect(result.shouldUseGlobalFilter).toBe(false)
    expect(result.processedFilters).toHaveLength(2)
    expect(result.processedFilters[0].operator).toBe(FILTER_OPERATORS.EQ)
    expect(result.processedFilters[0].value).toBe("samsung")
  })
})

describe("expandMergedEqualityFilters — menu display rows", () => {
  it("expands a merged IN entry into one 'is' row per value, OR-joined", () => {
    const collapsed = processFiltersForLogic([
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "adidas", JOIN_OPERATORS.OR),
    ]).processedFilters

    const rows = expandMergedEqualityFilters(collapsed)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: "brand",
      value: "samsung",
      operator: FILTER_OPERATORS.EQ,
      variant: FILTER_VARIANTS.SELECT,
      joinOperator: JOIN_OPERATORS.AND, // first row inherits the group's join
    })
    expect(rows[1]).toMatchObject({
      id: "brand",
      value: "adidas",
      operator: FILTER_OPERATORS.EQ,
      variant: FILTER_VARIANTS.SELECT,
      joinOperator: JOIN_OPERATORS.OR,
    })
    // Stable identities across derive cycles (no remount churn)
    expect(rows[0].filterId).toBe("brand-in-samsung")
    expect(rows[1].filterId).toBe("brand-in-adidas")
  })

  it("round-trips: expand → collapse reproduces the same IN entry", () => {
    const collapsed = processFiltersForLogic([
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("brand", "adidas", JOIN_OPERATORS.OR),
    ]).processedFilters

    const recollapsed = processFiltersForLogic(
      expandMergedEqualityFilters(collapsed),
    ).processedFilters

    expect(recollapsed).toHaveLength(1)
    expect(recollapsed[0].operator).toBe(FILTER_OPERATORS.IN)
    expect(recollapsed[0].value).toEqual(["samsung", "adidas"])
    expect(recollapsed[0].id).toBe("brand")
  })

  it("returns the same array reference when nothing is expandable", () => {
    const filters = [
      eq("brand", "samsung", JOIN_OPERATORS.AND),
      eq("category", "electronics", JOIN_OPERATORS.AND),
    ]

    expect(expandMergedEqualityFilters(filters)).toBe(filters)
  })

  it("leaves NOT_IN and non-array values untouched", () => {
    const filters: ExtendedColumnFilter<Row>[] = [
      {
        id: "brand",
        value: ["samsung", "adidas"],
        variant: FILTER_VARIANTS.MULTI_SELECT,
        operator: FILTER_OPERATORS.NOT_IN,
        filterId: "brand-not-in",
        joinOperator: JOIN_OPERATORS.AND,
      },
      eq("category", "electronics", JOIN_OPERATORS.AND),
    ]

    const rows = expandMergedEqualityFilters(filters)

    expect(rows).toHaveLength(2)
    expect(rows[0].operator).toBe(FILTER_OPERATORS.NOT_IN)
  })

  it("keeps surrounding filters in position when expanding in place", () => {
    const filters: ExtendedColumnFilter<Row>[] = [
      eq("category", "electronics", JOIN_OPERATORS.AND),
      {
        id: "brand",
        value: ["samsung", "adidas"],
        variant: FILTER_VARIANTS.MULTI_SELECT,
        operator: FILTER_OPERATORS.IN,
        filterId: "faceted-brand",
        joinOperator: JOIN_OPERATORS.AND,
      },
    ]

    const rows = expandMergedEqualityFilters(filters)

    expect(rows.map(r => [r.id, r.value])).toEqual([
      ["category", "electronics"],
      ["brand", "samsung"],
      ["brand", "adidas"],
    ])
  })
})
