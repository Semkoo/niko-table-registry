import { renderHook } from "@testing-library/react"
import { useTable, type ColumnDef, type FilterFn } from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

import { features } from "@/components/niko-table/lib/data-table-features"
import { buildFacetedOptions } from "@/components/niko-table/lib/build-faceted-options"
import type { Option } from "@/components/niko-table/types"

type Product = { id: number; brand: string; category: string }

const DATA: Product[] = [
  { id: 1, brand: "apple", category: "electronics" },
  { id: 2, brand: "apple", category: "electronics" },
  { id: 3, brand: "nike", category: "clothing" },
  { id: 4, brand: "adidas", category: "clothing" },
]

const BRAND_OPTIONS: Option[] = [
  { label: "Apple", value: "apple" },
  { label: "Nike", value: "nike" },
  { label: "Adidas", value: "adidas" },
]

const inFilter: FilterFn<typeof features, Product> = (
  row,
  columnId,
  filterValue,
) => {
  const raw =
    filterValue && typeof filterValue === "object" && "value" in filterValue
      ? (filterValue as { value: unknown }).value
      : filterValue
  const values = Array.isArray(raw) ? raw : [raw]
  return values.map(String).includes(String(row.getValue(columnId)))
}

const columns: ColumnDef<typeof features, Product>[] = [
  { accessorKey: "brand", filterFn: inFilter },
  { accessorKey: "category", filterFn: inFilter },
]

function useProductTable(columnFilters: Array<{ id: string; value: unknown }>) {
  return useTable({
    features,
    data: DATA,
    columns,
    state: { columnFilters },
  })
}

describe("buildFacetedOptions — pin selected values under limitToFilteredRows", () => {
  it("keeps a selected value that another filter excluded from the rows", () => {
    const columnFilters = [
      { id: "brand", value: { value: ["apple"] } },
      { id: "category", value: { value: ["clothing"] } },
    ]

    const { result } = renderHook(() => useProductTable(columnFilters))
    const table = result.current
    const coreRows = table.getCoreRowModel().rows

    const options = buildFacetedOptions(
      table,
      coreRows,
      "brand",
      columnFilters,
      "",
      {
        staticOptions: BRAND_OPTIONS,
        limitToFilteredRows: true,
        dynamicCounts: true,
        showCounts: true,
        autoOptionsFormat: false,
      },
    )

    expect(options.map(o => o.value)).toContain("apple")
  })

  it("still narrows non-selected values when a different filter is active", () => {
    const columnFilters = [{ id: "category", value: { value: ["clothing"] } }]

    const { result } = renderHook(() => useProductTable(columnFilters))
    const table = result.current
    const coreRows = table.getCoreRowModel().rows

    const options = buildFacetedOptions(
      table,
      coreRows,
      "brand",
      columnFilters,
      "",
      {
        staticOptions: BRAND_OPTIONS,
        limitToFilteredRows: true,
        dynamicCounts: true,
        showCounts: true,
        autoOptionsFormat: false,
      },
    )

    expect(options.map(o => o.value).sort()).toEqual(["adidas", "nike"])
  })
})
