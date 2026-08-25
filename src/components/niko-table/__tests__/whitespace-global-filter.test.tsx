/**
 * A stray space in the search box is invisible, so every place that treats it
 * as a real search lies to the reader in a way they cannot diagnose.
 *
 * Two of those places, exercised here through the rendered table:
 *
 *  - the default global filter, which built its regex from the UNTRIMMED term,
 *    so "bob " searched for a literal trailing space and matched nothing
 *  - the empty state, which asked `globalFilter.length > 0` and so reported
 *    "no results match your filters" on a table with no filters at all
 */
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { DataTable } from "../core/data-table"
import { DataTableRoot } from "../core/data-table-root"
import { DataTableBody, DataTableHeader } from "../core/data-table-structure"
import { isGlobalFilterActive } from "../lib/filter-functions"
import type { DataTableColumnDef } from "../types"

type Row = { id: string; name: string }

const rows: Row[] = [
  { id: "1", name: "Bob" },
  { id: "2", name: "Alice" },
  { id: "3", name: "Bobby" },
  { id: "4", name: "Bob Smith" },
]

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
]

async function renderWithSearch(search: string) {
  await act(async () => {
    render(
      <DataTableRoot
        data={rows}
        columns={columns}
        getRowId={row => row.id}
        // Explicit: feature detection scans the rendered children for filter
        // components, and this harness renders none — without this the table
        // runs with `manualFiltering` on and every assertion below passes
        // vacuously against an unfiltered set.
        config={{ enableFilters: true, manualFiltering: false }}
        state={{ globalFilter: search }}
      >
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>,
    )
  })
}

const names = () =>
  Array.from(document.querySelectorAll("tbody tr")).map(
    r => r.querySelector("td")?.textContent?.trim() ?? "",
  )

afterEach(cleanup)

describe("isGlobalFilterActive", () => {
  it("ignores whitespace-only strings", () => {
    for (const blank of ["", " ", "   ", "\t", "\n"]) {
      expect(isGlobalFilterActive(blank)).toBe(false)
    }
  })
  it("counts a real term, even one padded with spaces", () => {
    expect(isGlobalFilterActive("bob")).toBe(true)
    expect(isGlobalFilterActive("  bob  ")).toBe(true)
  })
  it("counts the advanced filter payload object", () => {
    expect(isGlobalFilterActive({ filters: [], joinOperator: "and" })).toBe(
      true,
    )
  })
})

describe("default globalFilter fn", () => {
  it("treats a whitespace-only search as no search", async () => {
    await renderWithSearch("   ")
    expect(names()).toEqual(["Bob", "Alice", "Bobby", "Bob Smith"])
  })

  it("does not blank the table on a trailing space", async () => {
    await renderWithSearch("Bob ")
    expect(names()).toEqual(["Bob", "Bobby", "Bob Smith"])
  })

  it("gives a padded term the same rows as the bare term", async () => {
    await renderWithSearch("Bob")
    const bare = names()
    cleanup()
    await renderWithSearch("  Bob  ")
    expect(names()).toEqual(bare)
  })

  it("trims the ends without collapsing an internal space", async () => {
    await renderWithSearch("  bob s  ")
    expect(names()).toEqual(["Bob Smith"])
  })
})
