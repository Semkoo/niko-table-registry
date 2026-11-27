/**
 * Two filters on one column go to `globalFilter`. The filter menu and the
 * inline filter wrote that from an effect keyed on the table object, which
 * TanStack v9 renews on every state change, so the write re-ran forever: a
 * hang on Radix and Base UI, "Maximum update depth exceeded" on React Aria.
 * Before the fix these tests never finish.
 */
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DataTableRoot } from "../core/data-table-root"
import { DataTableFilterMenu } from "../components/data-table-filter-menu"
import { DataTableInlineFilter } from "../components/data-table-inline-filter"
import type { DataTableColumnDef } from "../types"

type Row = { id: string; name: string; city: string; age: number }

const rows: Row[] = [
  { id: "1", name: "Alice", city: "Oslo", age: 30 },
  { id: "2", name: "Bob", city: "Rome", age: 25 },
]

const columns: DataTableColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableColumnFilter: true,
    meta: { label: "Name", variant: "text" },
  },
  {
    accessorKey: "city",
    header: "City",
    enableColumnFilter: true,
    meta: { label: "City", variant: "text" },
  },
  {
    accessorKey: "age",
    header: "Age",
    enableColumnFilter: true,
    meta: { label: "Age", variant: "number" },
  },
]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("filter menu with several filters", () => {
  it.each([2, 3])("adds %i filters without an update loop", async count => {
    const errors: string[] = []
    vi.spyOn(console, "error").mockImplementation(
      (...a) => void errors.push(a.map(String).join(" ")),
    )
    const user = userEvent.setup()
    await act(
      async () =>
        void render(
          <DataTableRoot data={rows} columns={columns} getRowId={r => r.id}>
            <DataTableFilterMenu />
          </DataTableRoot>,
        ),
    )
    await user.click(screen.getByRole("button", { name: /filter/i }))
    for (let i = 1; i <= count; i++) {
      await user.click(
        await screen.findByRole("button", { name: /add filter/i }),
      )
      await waitFor(() =>
        expect(
          document.querySelectorAll('[data-slot="sortable-item"]'),
        ).toHaveLength(i),
      )
    }
    expect(errors.filter(m => /Maximum update depth/.test(m))).toEqual([])
  })

  it.each([
    ["filter menu", <DataTableFilterMenu key="menu" />],
    ["inline filter", <DataTableInlineFilter key="inline" />],
  ])("%s settles with two same-column filters in state", async (_, filter) => {
    const twoNameFilters = {
      joinOperator: "mixed",
      filters: [
        {
          id: "name",
          operator: "ilike",
          value: "a",
          variant: "text",
          filterId: "f1",
          joinOperator: "and",
        },
        {
          id: "name",
          operator: "ilike",
          value: "b",
          variant: "text",
          filterId: "f2",
          joinOperator: "or",
        },
      ],
    }
    await act(
      async () =>
        void render(
          <DataTableRoot
            data={rows}
            columns={columns}
            getRowId={r => r.id}
            initialState={{ globalFilter: twoNameFilters }}
          >
            {filter}
          </DataTableRoot>,
        ),
    )
    expect(document.body).toBeTruthy()
  })
})
