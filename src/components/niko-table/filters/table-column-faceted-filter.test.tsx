/**
 * Wiring regression tests for `TableColumnFacetedFilterMenu`.
 *
 * These tests pin down two behaviors that shipped silently broken in an
 * earlier draft of the April 2026 refactor:
 *
 *   1. The `dynamicCounts` prop must flow through to `useGeneratedOptionsForColumn`.
 *      An earlier draft passed `{ limitToFilteredRows }` only, dropping `dynamicCounts`
 *      on the floor so the base hook always received its default `true`.
 *
 *   2. The `!multiple` default for `limitToFilteredRows` must be applied before
 *      the hook is called, not after. Users who mount a multi-select filter
 *      without passing `limitToFilteredRows` explicitly should get the full
 *      option universe (`limitToFilteredRows=false`). Users mounting a single-
 *      select filter should get narrowing behavior (`limitToFilteredRows=true`).
 *
 * We use `vi.mock` to intercept `useGeneratedOptionsForColumn` and assert on its
 * call arguments. This is a spec test for wiring, not a behavioral test. The
 * companion hook-level tests in `use-generated-options.test.tsx` cover the
 * behavioral layer.
 */

import { render } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
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

import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { TableColumnFacetedFilterMenu } from "./table-column-faceted-filter"
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
 * Harness component: creates a real TanStack table and mounts the menu with
 * whatever props we're exercising. We resolve the column inside the component
 * so that the menu gets a live `Column` reference (not stale on re-render).
 */
function Harness(props: {
  dynamicCounts?: boolean
  limitToFilteredRows?: boolean
  multiple?: boolean
}) {
  // eslint-disable-next-line react-hooks/incompatible-library -- test harness, stability is irrelevant here
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  const column = table.getColumn("status")
  if (!column) return null
  return (
    <TableColumnFacetedFilterMenu
      column={column}
      table={table}
      title="Status"
      {...props}
    />
  )
}

describe("TableColumnFacetedFilterMenu — prop wiring to useGeneratedOptionsForColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards dynamicCounts={false} — regression for the April 2026 refactor bug", () => {
    render(<Harness dynamicCounts={false} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    expect(spy).toHaveBeenCalled()
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ dynamicCounts: false })
  })

  it("forwards dynamicCounts={true} explicitly", () => {
    render(<Harness dynamicCounts={true} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ dynamicCounts: true })
  })

  it("multi-select with no explicit limitToFilteredRows resolves the !multiple default to false", () => {
    render(<Harness multiple />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: false })
  })

  it("single-select (no `multiple`) with no explicit limitToFilteredRows resolves the default to true", () => {
    render(<Harness />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: true })
  })

  it("explicit limitToFilteredRows overrides the !multiple default (multi-select case)", () => {
    render(<Harness multiple limitToFilteredRows={true} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: true })
  })

  it("explicit limitToFilteredRows overrides the !multiple default (single-select case)", () => {
    render(<Harness limitToFilteredRows={false} />)
    const spy = vi.mocked(useGeneratedOptionsForColumn)
    const config = spy.mock.calls.at(-1)?.[2]
    expect(config).toMatchObject({ limitToFilteredRows: false })
  })
})
