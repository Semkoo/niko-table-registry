/**
 * The sort menu's sortable list must be valid markup on every shadcn base:
 * the drag handle is the button itself (no button inside a button), the list
 * and list-item props land on the sortable's own elements, and no `asChild`
 * prop reaches the DOM. Picking a new field re-mounts the row (it is keyed by
 * field), so focus has to move to the new row's field trigger.
 */
import * as React from "react"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SortingState } from "@tanstack/react-table"
import { DataTableRoot } from "../core/data-table-root"
import { DataTableSortMenu } from "../components/data-table-sort-menu"
import type { DataTableColumnDef } from "../types"

type Row = { id: string; name: string; city: string; age: number }

const rows: Row[] = [
  { id: "1", name: "Alice", city: "Oslo", age: 30 },
  { id: "2", name: "Bob", city: "Rome", age: 25 },
]

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "city", header: "City", meta: { label: "City" } },
  { accessorKey: "age", header: "Age", meta: { label: "Age" } },
]

function Harness() {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
    { id: "city", desc: true },
  ])
  return (
    <DataTableRoot
      data={rows}
      columns={columns}
      getRowId={row => row.id}
      state={{ sorting }}
      onSortingChange={updater =>
        setSorting(prev =>
          typeof updater === "function" ? updater(prev) : updater,
        )
      }
    >
      <DataTableSortMenu />
    </DataTableRoot>
  )
}

async function openMenu() {
  const user = userEvent.setup()
  await act(async () => {
    render(<Harness />)
  })
  await user.click(screen.getByRole("button", { name: /sort/i }))
  return user
}

afterEach(cleanup)

describe("TableSortMenu sortable list", () => {
  it("renders valid markup with two sorts", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    await openMenu()

    const list = await screen.findByRole("list")
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    for (const item of items) {
      expect(item.parentElement).toBe(list)
      expect(item.id).toMatch(/-sort-(name|city)$/)
      expect(item.tabIndex).toBe(-1)
    }

    expect(document.querySelectorAll("button button")).toHaveLength(0)
    expect(document.querySelector("[aschild]")).toBeNull()
    const handles = document.querySelectorAll(
      '[data-slot="sortable-item-handle"]',
    )
    expect(handles).toHaveLength(2)
    handles.forEach((handle, i) => {
      expect(handle.tagName).toBe("BUTTON")
      expect(handle.getAttribute("aria-controls")).toBe(items[i]!.id)
    })

    const messages = errors.mock.calls.map(call => call.join(" ")).join("\n")
    expect(messages).not.toMatch(/validateDOMNesting|descendant of <button>/)
    expect(messages).not.toMatch(/asChild/)
    errors.mockRestore()
  })

  it("returns focus to the field trigger after a field change", async () => {
    const user = await openMenu()

    const trigger = (await screen.findAllByRole("listitem"))[0]!.querySelector(
      "[id$='-field-trigger']",
    ) as HTMLElement
    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "Age" }))

    await waitFor(() => {
      const active = document.activeElement as HTMLElement
      expect(active.id).toMatch(/-sort-age-field-trigger$/)
      expect(active.textContent).toBe("Age")
    })
  })
})
