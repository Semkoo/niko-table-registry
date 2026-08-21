/**
 * Drives real registry examples the way a user does — clicking the sort menu,
 * typing in search, paging, selecting and expanding rows — and asserts the
 * rendered rows change. The API-level coverage lives in
 * `src/components/niko-table/__tests__/table-features.test.tsx`; this file
 * proves the wiring between the components and TanStack Table v9 still holds.
 */
import * as React from "react"
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import BasicExample from "../new-york/examples/niko-table/basic"
import SearchExample from "../new-york/examples/niko-table/search"
import RowSelectionExample from "../new-york/examples/niko-table/row-selection"
import RowExpansionExample from "../new-york/examples/niko-table/row-expansion"
import FacetedExample from "../new-york/examples/niko-table/faceted"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** Text of the given column across all rendered body rows. */
function columnValues(columnIndex: number) {
  return Array.from(document.querySelectorAll("tbody tr")).map(
    row => row.querySelectorAll("td")[columnIndex]?.textContent?.trim() ?? "",
  )
}

async function renderExample(Component: React.ComponentType) {
  const user = userEvent.setup()
  await act(async () => {
    render(<Component />)
  })
  return user
}

/**
 * Mounts an example that loads its data through a simulated request and waits
 * for the skeleton to be replaced by real rows.
 */
async function renderAsyncExample(Component: React.ComponentType) {
  const user = userEvent.setup()
  await act(async () => {
    render(<Component />)
  })
  await waitFor(
    () => {
      expect(columnValues(0).filter(Boolean).length).toBeGreaterThan(0)
    },
    { timeout: 4000 },
  )
  return user
}

/** Opens the sort dropdown on a header and picks one of its options. */
async function sortViaMenu(
  user: ReturnType<typeof userEvent.setup>,
  headerName: string,
  option: RegExp,
) {
  const header = screen
    .getAllByRole("columnheader")
    .find(cell => cell.textContent?.startsWith(headerName))
  expect(header, `no header matching ${headerName}`).toBeTruthy()

  await user.click(
    within(header!).getByRole("button", { name: /sort column/i }),
  )
  await user.click(await screen.findByRole("menuitem", { name: option }))
}

describe("example interactions", () => {
  it("sorts text through the column sort menu, both directions", async () => {
    const user = await renderExample(BasicExample)

    const initial = columnValues(0)
    await sortViaMenu(user, "Product", /^Asc$/)
    const ascending = columnValues(0)

    expect(ascending).not.toEqual(initial)
    expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b)))

    await sortViaMenu(user, "Product", /^Desc$/)
    const descending = columnValues(0)
    expect(descending).toEqual(
      [...descending].sort((a, b) => b.localeCompare(a)),
    )
    expect(descending).not.toEqual(ascending)
  })

  it("sorts a numeric column low to high", async () => {
    const user = await renderExample(BasicExample)

    await sortViaMenu(user, "Price", /low to high/i)
    const prices = columnValues(2).map(text =>
      Number(text.replace(/[^\d.]/g, "")),
    )
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it("clears a sort back to the original order", async () => {
    const user = await renderExample(BasicExample)

    const initial = columnValues(0)
    await sortViaMenu(user, "Product", /^Asc$/)
    expect(columnValues(0)).not.toEqual(initial)

    await sortViaMenu(user, "Product", /clear sort/i)
    expect(columnValues(0)).toEqual(initial)
  })

  it("filters rows from the search box and clears back", async () => {
    const user = await renderAsyncExample(SearchExample)

    const before = columnValues(0)
    expect(before.filter(Boolean).length).toBeGreaterThan(0)

    const search = screen.getByRole("textbox", { name: /search table/i })
    await user.type(search, "acme")

    const filtered = columnValues(0)
    expect(filtered.length).toBeLessThan(before.length)
    expect(filtered.length).toBeGreaterThan(0)

    await user.clear(search)
    expect(columnValues(0)).toEqual(before)
  })

  it("shows the empty state when the search matches nothing", async () => {
    const user = await renderAsyncExample(SearchExample)
    const search = screen.getByRole("textbox", { name: /search table/i })

    await user.type(search, "zzzznotathing")
    expect(await screen.findByText(/no matches found/i)).toBeTruthy()
    expect(document.querySelectorAll("tbody td").length).toBe(1)
  })

  it("filters through a faceted filter menu", async () => {
    const user = await renderExample(FacetedExample)

    const before = document.querySelectorAll("tbody tr").length
    await user.click(screen.getByRole("button", { name: /^Category$/ }))

    const [option] = await screen.findAllByRole("option")
    await user.click(option!)

    expect(document.querySelectorAll("tbody tr").length).toBeLessThan(before)
  })

  it("pages forward and back", async () => {
    const user = await renderExample(BasicExample)

    const firstPage = columnValues(0)
    await user.click(screen.getByRole("button", { name: /go to next page/i }))
    expect(columnValues(0)).not.toEqual(firstPage)

    await user.click(
      screen.getByRole("button", { name: /go to previous page/i }),
    )
    expect(columnValues(0)).toEqual(firstPage)
  })

  it("selects a single row and then every row on the page", async () => {
    const user = await renderExample(RowSelectionExample)

    const rowCheckboxes = screen.getAllByRole("checkbox", {
      name: /select row/i,
    })
    await user.click(rowCheckboxes[0]!)
    expect(rowCheckboxes[0]!.dataset.state).toBe("checked")

    await user.click(screen.getByRole("checkbox", { name: /select all/i }))
    for (const checkbox of screen.getAllByRole("checkbox", {
      name: /select row/i,
    })) {
      expect(checkbox.dataset.state).toBe("checked")
    }
  })

  it("expands a row to reveal its detail content", async () => {
    const user = await renderExample(RowExpansionExample)

    const before = document.querySelectorAll("tbody tr").length
    const expandButton = document.querySelector<HTMLButtonElement>(
      '[data-col-id="expand"] button',
    )
    expect(expandButton, "no expand control rendered").toBeTruthy()

    await user.click(expandButton!)
    expect(document.querySelectorAll("tbody tr").length).toBeGreaterThan(before)
  })
})
