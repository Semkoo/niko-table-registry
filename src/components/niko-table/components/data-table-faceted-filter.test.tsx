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

import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { useDataTable } from "../core/data-table-context"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { FILTER_VARIANTS } from "../lib/constants"

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
