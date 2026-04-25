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

// Spy on `TableFacetedFilter` so tests can inspect the final `options` prop
// that flows through after enrichment / narrowing.
const facetedFilterSpy = vi.fn()
vi.mock("./table-faceted-filter", async () => {
  const actual = await vi.importActual<typeof import("./table-faceted-filter")>(
    "./table-faceted-filter",
  )
  return {
    ...actual,
    TableFacetedFilter: (props: unknown) => {
      facetedFilterSpy(props)
      return null
    },
  }
})

import { useGeneratedOptionsForColumn } from "../hooks/use-generated-options"
import { TableColumnFacetedFilterMenu } from "./table-column-faceted-filter"
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
 * Harness component: creates a real TanStack table and mounts the menu with
 * whatever props we're exercising. We resolve the column inside the component
 * so that the menu gets a live `Column` reference (not stale on re-render).
 */
function Harness(props: {
  dynamicCounts?: boolean
  limitToFilteredRows?: boolean
  multiple?: boolean
  options?: Option[]
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

/**
 * Behavior regression: when a caller passes explicit `options` to the menu,
 * the component still has to enrich them with live counts and (optionally)
 * narrow them to values present in the filtered row set. An earlier version
 * returned caller options untouched — so `dynamicCounts` was silently
 * ignored whenever static options were supplied.
 */
describe("TableColumnFacetedFilterMenu — explicit options count enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    facetedFilterSpy.mockClear()
  })

  it("merges live counts into caller-supplied options and hides zero-count entries", () => {
    const callerOptions: Option[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
      { label: "C", value: "c" }, // resolves to count 0 — hidden by default
    ]
    render(<Harness multiple options={callerOptions} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: 2 },
      { label: "B", value: "b", count: 1 },
    ])
  })

  it("hides caller-supplied options whose count resolves to 0 (cross-filter default)", () => {
    // The default cross-filter rule hides options at count 0. Server-side
    // tables exploit this: pass the full static list with cross-filter counts,
    // and impossible-result options disappear automatically.
    const callerOptions: Option[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
      { label: "C", value: "c" }, // not present in row data
    ]
    render(<Harness options={callerOptions} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([
      { label: "A", value: "a", count: 2 },
      { label: "B", value: "b", count: 1 },
    ])
  })

  it("preserves an explicit empty array (does not fall through to generated)", () => {
    // The original `options ?? fallback` semantics treat `[]` as "explicitly
    // empty, don't auto-generate." The enrichment memo must preserve that.
    render(<Harness multiple options={[]} />)
    const lastProps = facetedFilterSpy.mock.calls.at(-1)?.[0] as {
      options: Option[]
    }
    expect(lastProps.options).toEqual([])
  })
})
