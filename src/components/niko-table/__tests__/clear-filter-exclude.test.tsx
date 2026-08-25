/**
 * `TableClearFilter` decides both whether a Reset button appears and what it
 * clears, from `columnFilters` alone. That is wrong for a table whose
 * navigational tab ALSO lives in `columnFilters` — a common shape, because
 * keeping the tab there is what lets a drill-through link select one with a
 * plain `?filters=`.
 *
 * Without `excludeColumnIds`, picking such a tab pops a Reset the reader never
 * asked for, and pressing it clears the tab entry — whose absence means the
 * default tab — silently navigating them somewhere else instead of merely
 * unfiltering them.
 */
import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import type { ColumnFiltersState } from "@tanstack/react-table"
import { DataTable } from "../core/data-table"
import { DataTableRoot } from "../core/data-table-root"
import { DataTableBody, DataTableHeader } from "../core/data-table-structure"
import { DataTableClearFilter } from "../components/data-table-clear-filter"
import type { DataTableColumnDef } from "../types"

type Row = { id: string; name: string; scope: string }

const rows: Row[] = [
  { id: "1", name: "Alice", scope: "past" },
  { id: "2", name: "Bob", scope: "upcoming" },
]

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "scope", header: "Scope", meta: { label: "Scope" } },
]

/** The tab id that is navigation rather than a user filter. */
const TAB = ["scope"] as const

async function renderTable(
  initialFilters: ColumnFiltersState,
  exclude?: readonly string[],
) {
  const user = userEvent.setup()
  // Mirrors a URL-backed table: the caller owns columnFilters state.
  const seen: { filters: ColumnFiltersState } = { filters: initialFilters }

  function Harness() {
    const [filters, setFilters] = React.useState(initialFilters)
    seen.filters = filters
    return (
      <DataTableRoot
        data={rows}
        columns={columns}
        getRowId={row => row.id}
        state={{ columnFilters: filters }}
        onColumnFiltersChange={updater =>
          setFilters(prev => {
            const next = typeof updater === "function" ? updater(prev) : updater
            return next
          })
        }
      >
        <DataTableClearFilter<Row> excludeColumnIds={exclude} />
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>
    )
  }

  await act(async () => {
    render(<Harness />)
  })
  return { user, seen }
}

const reset = () => screen.queryByRole("button", { name: /reset/i })

afterEach(cleanup)

describe("TableClearFilter excludeColumnIds", () => {
  it("shows Reset for an ordinary column filter", async () => {
    await renderTable([{ id: "name", value: ["Alice"] }])
    expect(reset()).not.toBeNull()
  })

  it("does not show Reset when only an excluded tab is set", async () => {
    await renderTable([{ id: "scope", value: ["past"] }], TAB)
    expect(reset()).toBeNull()
  })

  it("still shows Reset when a real filter sits alongside the tab", async () => {
    await renderTable(
      [
        { id: "scope", value: ["past"] },
        { id: "name", value: ["Alice"] },
      ],
      TAB,
    )
    expect(reset()).not.toBeNull()
  })

  it("clears real filters but leaves the excluded tab standing", async () => {
    const { user, seen } = await renderTable(
      [
        { id: "scope", value: ["past"] },
        { id: "name", value: ["Alice"] },
      ],
      TAB,
    )

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /reset/i }))
    })

    expect(seen.filters).toEqual([{ id: "scope", value: ["past"] }])
  })

  it("clears everything when nothing is excluded", async () => {
    const { user, seen } = await renderTable([
      { id: "scope", value: ["past"] },
      { id: "name", value: ["Alice"] },
    ])

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /reset/i }))
    })

    expect(seen.filters).toEqual([])
  })
})
