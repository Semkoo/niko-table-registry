import { renderHook } from "@testing-library/react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
} from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

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

// Reads the faceted `{ value: [...] }` shape (and a plain array) like the app.
const inFilter: FilterFn<Product> = (row, columnId, filterValue) => {
  const raw =
    filterValue && typeof filterValue === "object" && "value" in filterValue
      ? (filterValue as { value: unknown }).value
      : filterValue
  const values = Array.isArray(raw) ? raw : [raw]
  return values.map(String).includes(String(row.getValue(columnId)))
}

const columns: ColumnDef<Product>[] = [
  { accessorKey: "brand", filterFn: inFilter },
  { accessorKey: "category", filterFn: inFilter },
]

function useTable(columnFilters: Array<{ id: string; value: unknown }>) {
  return useReactTable({
    data: DATA,
    columns,
    state: { columnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
}

describe("buildFacetedOptions — pin selected values under limitToFilteredRows", () => {
  it("keeps a selected value that another filter excluded from the rows", () => {
    // Brand=apple AND Category=clothing → zero rows; apple is absent from the
    // clothing-only row set that feeds the brand facet.
    const columnFilters = [
      { id: "brand", value: { value: ["apple"] } },
      { id: "category", value: { value: ["clothing"] } },
    ]

    const { result } = renderHook(() => useTable(columnFilters))
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

    const values = options.map(o => o.value)
    // The selected brand must stay in its own facet so the pill renders and
    // the user can still un-check it.
    expect(values).toContain("apple")
    // Other brands (present in the clothing rows) still show.
    expect(values).toContain("nike")
    expect(values).toContain("adidas")

    const apple = options.find(o => o.value === "apple")
    // It matches no row under the other filters, so its count is 0.
    expect(apple?.count).toBe(0)
  })

  it("still narrows non-selected values when a different filter is active", () => {
    // Only Category=electronics active; brand facet should drop clothing-only
    // brands (nike, adidas) but keep electronics brands.
    const columnFilters = [
      { id: "category", value: { value: ["electronics"] } },
    ]

    const { result } = renderHook(() => useTable(columnFilters))
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

    const values = options.map(o => o.value)
    expect(values).toContain("apple") // present in electronics rows
    expect(values).not.toContain("nike") // clothing-only, not selected → dropped
    expect(values).not.toContain("adidas")
  })
})
