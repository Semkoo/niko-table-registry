/**
 * Wiring regression tests for `DataTableFacetedFilter` (context-aware variant).
 *
 * These tests pin down the `!multiple` default and the `dynamicCounts`
 * forwarding in the context-aware entry point. They mirror the direct-prop
 * tests in `../filters/table-column-faceted-filter.test.tsx`.
 */

import { render } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table"

vi.mock("../hooks/use-generated-options", async () => {
  const actual = await vi.importActual<
    typeof import("../hooks/use-generated-options")
  >("../hooks/use-generated-options")
  return {
    ...actual,
    useGeneratedOptionsForColumn: vi.fn(() => []),
  }
})

vi.mock("../core/data-table-context", async () => {
  const actual = await vi.importActual<
    typeof import("../core/data-table-context")
  >("../core/data-table-context")
  return {
    ...actual,
    useDataTable: vi.fn(),
  }
})

// Spy on the underlying `TableFacetedFilter` so we can inspect the final
// `options` array that flows through after enrichment / narrowing. We only
// need to observe props, not render anything real.
const facetedFilterSpy = vi.fn()
vi.mock("../filters/table-faceted-filter", async () => {
  const actual = await vi.importActual<
    typeof import("../filters/table-faceted-filter")
  >("../filters/table-faceted-filter")
  return {
    ...actual,
    TableFacetedFilter: (props: unknown) => {
      facetedFilterSpy(props)
      return null
    },
  }
})

import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { useDataTable } from "../core/data-table-context"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { FILTER_VARIANTS } from "../lib/constants"
import type { Option } from "../types"

type Row = { id: number; status: "a" | "b" }

const rows: Row[] = [
  { id: 1, status: "a" },
  { id: 2, status: "b" },
  { id: 3, status: "a" },
]

const columns: ColumnDef<Row>[] = [
  {
    id: "status",
    accessorKey: "status",
    meta: {
      variant: FILTER_VARIANTS.SELECT,
      autoOptions: true,
    },
  },
]

/**
 * Harness that wires a real TanStack table into the mocked `useDataTable`
 * context and renders `DataTableFacetedFilter` with the props under test.
 */
function Harness(props: {
  dynamicCounts?: boolean
  limitToFilteredRows?: boolean
  multiple?: boolean
  options?: Option[]
  showCounts?: boolean
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  // Push the real table into the mocked hook so `DataTableFacetedFilter`
  // can call `useDataTable()` and get back a valid context.
  vi.mocked(useDataTable).mockReturnValue({
    table: table as unknown as Table<unknown>,
  } as ReturnType<typeof useDataTable>)

  return (
    <DataTableFacetedFilter accessorKey="status" title="Status" {...props} />
  )
}

describe("DataTableFacetedFilter — prop wiring to useGeneratedOptionsForColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards dynamicCounts={false}", () => {
    render(<Harness dynamicCounts={false} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    expect(spy).toHaveBeenCalled()
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ dynamicCounts: false })
  })

  it("multi-select with no explicit limitToFilteredRows resolves !multiple default to false", () => {
    render(<Harness multiple />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: false })
  })

  it("single-select with no explicit limitToFilteredRows resolves !multiple default to true", () => {
    render(<Harness />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: true })
  })

  it("explicit limitToFilteredRows on a multi-select wins over the default", () => {
    render(<Harness multiple limitToFilteredRows={true} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: true })
  })
})

/**
 * Behavior regression: when a caller passes explicit `options`, the component
 * still has to enrich them with live counts and (optionally) narrow them down
 * to values present in the filtered row set. An earlier version silently
 * returned caller options untouched — so `dynamicCounts` was a no-op and
 * multi-select filters with static options never showed live counts.
 */
describe("DataTableFacetedFilter — explicit options count enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    facetedFilterSpy.mockClear()
  })

  it("merges live counts into caller-supplied options on the multi-select path", () => {
    const callerOptions: Option[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
      { label: "C", value: "c" },
    ]
    render(<Harness multiple options={callerOptions} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    // Multi-select defaults to limitToFilteredRows=false, so `c` stays in the
    // list with count 0; `a` and `b` receive live counts from the row set.
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: 2 },
      { label: "B", value: "b", count: 1 },
      { label: "C", value: "c", count: 0 },
    ])
  })

  it("narrows and counts explicit options on the single-select path", () => {
    const callerOptions: Option[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
      { label: "C", value: "c" }, // not present in row data
    ]
    render(<Harness options={callerOptions} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    // Single-select defaults to limitToFilteredRows=true, so `c` is filtered
    // out because no row carries that value.
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: 2 },
      { label: "B", value: "b", count: 1 },
    ])
  })

  it("strips preset counts when showCounts={false} on the slow path", () => {
    const callerOptions: Option[] = [
      { label: "A", value: "a", count: 99 },
      { label: "B", value: "b", count: 99 },
    ]
    render(<Harness options={callerOptions} showCounts={false} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: undefined },
      { label: "B", value: "b", count: undefined },
    ])
  })

  it("strips preset counts when showCounts={false} on the fast path (multi-select)", () => {
    const callerOptions: Option[] = [
      { label: "A", value: "a", count: 99 },
      { label: "B", value: "b", count: 99 },
      { label: "C", value: "c", count: 99 },
    ]
    render(<Harness multiple options={callerOptions} showCounts={false} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: undefined },
      { label: "B", value: "b", count: undefined },
      { label: "C", value: "c", count: undefined },
    ])
  })

  it("recomputes counts when dynamicCounts={false} (total counts, not filter-aware)", () => {
    // With dynamicCounts=false, counts are computed against the core row set
    // rather than rows-excluding-this-column. For this test the row set is
    // the full data, so values still reflect the full dataset totals.
    const callerOptions: Option[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ]
    render(<Harness multiple dynamicCounts={false} options={callerOptions} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: 2 },
      { label: "B", value: "b", count: 1 },
    ])
  })
})
