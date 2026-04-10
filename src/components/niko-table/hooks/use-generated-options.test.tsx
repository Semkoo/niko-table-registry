/**
 * Behavioral tests for `useGeneratedOptions` / `useGeneratedOptionsForColumn`.
 *
 * These tests are the regression net for the April 2026 faceted-filter refactor:
 * - `dynamicCounts` must drive counts independently of `limitToFilteredRows`
 * - `limitToFilteredRows` must drive the option list independently of `dynamicCounts`
 * - `mergeStrategy: "preserve"` must return user-defined options untouched (no count injection)
 * - `mergeStrategy: "augment"` must inject counts derived from `countSourceRows`
 * - Options with zero counts must still be returned when discovered from `optionSourceRows`
 */

import * as React from "react"
import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table"

import {
  useGeneratedOptions,
  useGeneratedOptionsForColumn,
} from "./use-generated-options"
import { FILTER_VARIANTS } from "../lib/constants"

type Row = {
  id: number
  status: "draft" | "live" | "archived"
  category: "hardware" | "textile" | "garden"
}

const rows: Row[] = [
  // 3 draft hardware, 2 live hardware, 1 archived hardware
  { id: 1, status: "draft", category: "hardware" },
  { id: 2, status: "draft", category: "hardware" },
  { id: 3, status: "draft", category: "hardware" },
  { id: 4, status: "live", category: "hardware" },
  { id: 5, status: "live", category: "hardware" },
  { id: 6, status: "archived", category: "hardware" },
  // 2 draft textile, 1 live textile
  { id: 7, status: "draft", category: "textile" },
  { id: 8, status: "draft", category: "textile" },
  { id: 9, status: "live", category: "textile" },
  // 1 draft garden
  { id: 10, status: "draft", category: "garden" },
]

/**
 * Build a reusable hook wrapper that mounts a real TanStack table with a
 * stable set of columns and optional initial column filter state. Returns the
 * `useReactTable()` instance so the caller can drive filters, selection, etc.
 */
function useTestTable(
  columns: ColumnDef<Row>[],
  initialColumnFilters: ColumnFiltersState = [],
) {
  const [columnFilters, setColumnFilters] = React.useState(initialColumnFilters)
  // eslint-disable-next-line react-hooks/incompatible-library -- test harness, stability is irrelevant here
  const table = useReactTable({
    data: rows,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  return table
}

/**
 * Column definitions used across most tests: a fully auto-generated `status`
 * column (no static options) and a `category` column with `preserve`-style
 * static options.
 *
 * Both columns declare explicit `filterFn`s — otherwise TanStack Table will
 * record the filter in state but not actually exclude rows, and our
 * `getFilteredRowsExcludingColumn` helper will return the full dataset,
 * silently masking any real behavior under test.
 */
const baseColumns: ColumnDef<Row>[] = [
  {
    id: "status",
    accessorKey: "status",
    enableColumnFilter: true,
    // Multi-select: filter value is an array of allowed strings.
    filterFn: (row, id, value: string[]) => {
      if (!value?.length) return true
      return value.includes(row.getValue(id))
    },
    meta: {
      variant: FILTER_VARIANTS.MULTI_SELECT,
      autoOptions: true,
      autoOptionsFormat: false, // keep labels == values for easy assertions
    },
  },
  {
    id: "category",
    accessorKey: "category",
    enableColumnFilter: true,
    // Single-select: filter value is a single string.
    filterFn: (row, id, value: string) => {
      if (!value) return true
      return row.getValue(id) === value
    },
    meta: {
      variant: FILTER_VARIANTS.SELECT,
      options: [
        { label: "Hardware", value: "hardware" },
        { label: "Textile", value: "textile" },
        { label: "Garden", value: "garden" },
      ],
      // mergeStrategy defaults to "preserve"
    },
  },
]

describe("useGeneratedOptions — auto-generated column, no filter applied", () => {
  it("returns every distinct value with its count under default flags", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns)
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
      })
    })

    // 6 draft, 3 live, 1 archived — should appear alphabetically
    expect(result.current.status).toEqual([
      { value: "archived", label: "archived", count: 1 },
      { value: "draft", label: "draft", count: 6 },
      { value: "live", label: "live", count: 3 },
    ])
  })

  it("returns counts without `count` field when showCounts is false", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns)
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
        showCounts: false,
      })
    })

    for (const opt of result.current.status) {
      expect(opt.count).toBeUndefined()
    }
  })
})

describe("useGeneratedOptions — auto-generated column, filter applied on another column", () => {
  it("limitToFilteredRows=true + dynamicCounts=true (defaults): options AND counts reflect filter", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "category", value: "hardware" },
      ])
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
      })
    })

    // Hardware has: 3 draft, 2 live, 1 archived
    expect(result.current.status).toEqual([
      { value: "archived", label: "archived", count: 1 },
      { value: "draft", label: "draft", count: 3 },
      { value: "live", label: "live", count: 2 },
    ])
  })

  it("limitToFilteredRows=false + dynamicCounts=false: options AND counts reflect ALL rows", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "category", value: "hardware" },
      ])
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
        limitToFilteredRows: false,
        dynamicCounts: false,
      })
    })

    expect(result.current.status).toEqual([
      { value: "archived", label: "archived", count: 1 },
      { value: "draft", label: "draft", count: 6 },
      { value: "live", label: "live", count: 3 },
    ])
  })

  it("limitToFilteredRows=true + dynamicCounts=false: options from filtered rows, counts from ALL rows (the key fix)", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "category", value: "hardware" },
      ])
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
        limitToFilteredRows: true,
        dynamicCounts: false,
      })
    })

    // Options limited to those appearing in hardware rows (draft, live, archived — all three)
    // but counts reflect the entire dataset (6 draft, 3 live, 1 archived)
    expect(result.current.status).toEqual([
      { value: "archived", label: "archived", count: 1 },
      { value: "draft", label: "draft", count: 6 },
      { value: "live", label: "live", count: 3 },
    ])
  })

  it("limitToFilteredRows=false + dynamicCounts=true: options from ALL rows, counts from filtered rows", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "category", value: "textile" },
      ])
      return useGeneratedOptions(table, {
        includeColumns: ["status"],
        limitToFilteredRows: false,
        dynamicCounts: true,
      })
    })

    // Textile has: 2 draft, 1 live, 0 archived
    // All three options appear (because limitToFilteredRows=false reads from ALL rows)
    // but `archived` has count 0, and is kept in the output (zero-count regression guard)
    expect(result.current.status).toEqual([
      { value: "archived", label: "archived", count: 0 },
      { value: "draft", label: "draft", count: 2 },
      { value: "live", label: "live", count: 1 },
    ])
  })
})

describe("useGeneratedOptions — mergeStrategy", () => {
  it("preserve: returns user-defined options untouched, with NO count injection", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns)
      return useGeneratedOptions(table, {
        includeColumns: ["category"],
      })
    })

    // The "preserve" branch must return meta.options exactly as-declared:
    // labels are title-case, values are lower-case, NO `count` field.
    expect(result.current.category).toEqual([
      { label: "Hardware", value: "hardware" },
      { label: "Textile", value: "textile" },
      { label: "Garden", value: "garden" },
    ])
  })

  it("preserve + limitToFilteredRows: hides options whose value is not present in filtered rows", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "status", value: ["draft"] },
      ])
      return useGeneratedOptions(table, {
        includeColumns: ["category"],
      })
    })

    // Only hardware, textile, and garden appear in draft rows — all three, actually.
    // All three should still be present since every category has at least one draft row.
    expect(result.current.category).toHaveLength(3)
    for (const opt of result.current.category) {
      expect(opt).not.toHaveProperty("count")
    }
  })

  it("preserve + limitToFilteredRows: drops options not present in filtered rows", () => {
    const columns: ColumnDef<Row>[] = [
      baseColumns[0],
      {
        ...baseColumns[1],
        meta: {
          ...baseColumns[1].meta,
          options: [
            { label: "Hardware", value: "hardware" },
            { label: "Textile", value: "textile" },
            { label: "Garden", value: "garden" },
            // Not in any row — should be dropped when limitToFilteredRows=true
            { label: "Ceramics", value: "ceramics" },
          ],
        },
      },
    ]

    const { result } = renderHook(() => {
      const table = useTestTable(columns)
      return useGeneratedOptions(table, { includeColumns: ["category"] })
    })

    const values = result.current.category.map(o => o.value)
    expect(values).not.toContain("ceramics")
    expect(values).toEqual(["hardware", "textile", "garden"])
  })

  it("augment: injects counts into user-defined options from countSourceRows", () => {
    const columns: ColumnDef<Row>[] = [
      baseColumns[0],
      {
        ...baseColumns[1],
        meta: {
          ...baseColumns[1].meta,
          mergeStrategy: "augment",
        },
      },
    ]

    const { result } = renderHook(() => {
      const table = useTestTable(columns)
      return useGeneratedOptions(table, { includeColumns: ["category"] })
    })

    expect(result.current.category).toEqual([
      { label: "Hardware", value: "hardware", count: 6 },
      { label: "Textile", value: "textile", count: 3 },
      { label: "Garden", value: "garden", count: 1 },
    ])
  })

  it("augment + limitToFilteredRows=true + dynamicCounts=false: counts from all rows, options filtered", () => {
    const columns: ColumnDef<Row>[] = [
      baseColumns[0],
      {
        ...baseColumns[1],
        meta: {
          ...baseColumns[1].meta,
          mergeStrategy: "augment",
          // override meta dynamicCounts so the hook's prop is consulted
          dynamicCounts: false,
        },
      },
    ]

    const { result } = renderHook(() => {
      const table = useTestTable(columns, [{ id: "status", value: ["live"] }])
      return useGeneratedOptions(table, {
        includeColumns: ["category"],
        limitToFilteredRows: true,
      })
    })

    // "live" rows: hardware×2, textile×1. Garden absent → dropped.
    // But counts come from all rows: hardware=6, textile=3.
    expect(result.current.category).toEqual([
      { label: "Hardware", value: "hardware", count: 6 },
      { label: "Textile", value: "textile", count: 3 },
    ])
  })
})

describe("useGeneratedOptionsForColumn — single-column convenience wrapper", () => {
  it("returns an empty array when the column is not present", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns)
      return useGeneratedOptionsForColumn(table, "nonexistent")
    })

    expect(result.current).toEqual([])
  })

  it("forwards dynamicCounts and limitToFilteredRows from config", () => {
    const { result } = renderHook(() => {
      const table = useTestTable(baseColumns, [
        { id: "category", value: "hardware" },
      ])
      return useGeneratedOptionsForColumn(table, "status", {
        dynamicCounts: false,
        limitToFilteredRows: true,
      })
    })

    // Counts from the full dataset, not the filtered set:
    // draft=6, live=3, archived=1 — even though we filtered to hardware.
    expect(result.current).toEqual([
      { value: "archived", label: "archived", count: 1 },
      { value: "draft", label: "draft", count: 6 },
      { value: "live", label: "live", count: 3 },
    ])
  })
})
