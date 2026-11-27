/**
 * Every block in src/data/blocks.ts mounts without throwing or logging
 * `console.error`, renders rows, and has a registry item; plus the Customers
 * Table's own interactions (search, row click, add customer).
 */
import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { blocks } from "@/data/blocks"
import registry from "../../../registry.json"

const modules = import.meta.glob<{ default: React.ComponentType }>(
  "../new-york/blocks/*/*.tsx",
)

afterEach(cleanup)

async function mount(name: string) {
  const load = modules[`../new-york/blocks/${name}/${name}.tsx`]
  expect(load, `no block file for ${name}`).toBeTruthy()
  const { default: Block } = await load!()
  let container: HTMLElement | undefined
  await act(async () => {
    container = render(<Block />).container
  })
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return container!
}

describe("blocks", () => {
  it.each(blocks.map(block => block.name))(
    "%s mounts without errors and ships a registry item",
    async name => {
      const errors: unknown[][] = []
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation((...args: unknown[]) => {
          errors.push(args)
        })
      try {
        const container = await mount(name)
        expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(0)
        expect(errors).toEqual([])
      } finally {
        consoleError.mockRestore()
      }

      const item = registry.items.find(entry => entry.name === name)
      expect(item, `${name} missing from registry.json`).toBeTruthy()
      const block = blocks.find(entry => entry.name === name)!
      expect(
        item!.files.map(file => file.path.split("/").pop()).sort(),
      ).toEqual([...block.files].sort())
    },
  )
})

describe("customers-table", () => {
  it("filters by search", async () => {
    await mount("customers-table")
    expect(screen.getByText(/^36 customers/)).toBeTruthy()
    fireEvent.change(screen.getByRole("textbox", { name: /search/i }), {
      target: { value: "zzz-no-match" },
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(screen.getByText(/^0 customers/)).toBeTruthy()
  })

  it("opens the details panel on row click", async () => {
    const container = await mount("customers-table")
    const firstRow = container.querySelector("tbody tr")!
    const name = firstRow.querySelector(".font-medium")!.textContent!
    await act(async () => {
      fireEvent.click(firstRow)
    })
    expect(
      await screen.findByRole("dialog", { name: new RegExp(name) }),
    ).toBeTruthy()
  })

  it("adds a customer from the form", async () => {
    await mount("customers-table")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add customer/i }))
    })
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Robin Example" },
    })
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "robin@example.com" },
    })
    await act(async () => {
      fireEvent.submit(screen.getByLabelText("Name").closest("form")!)
    })
    expect(screen.getByText(/^37 customers/)).toBeTruthy()
    expect(screen.getByText("Robin Example")).toBeTruthy()
  })
})

describe("orders-table", () => {
  it("expands a row to show its line items", async () => {
    await mount("orders-table")
    expect(screen.queryByText("Subtotal")).toBeNull()
    const [expand] = screen.getAllByRole("button", { name: /show items/i })
    await act(async () => {
      fireEvent.click(expand!)
    })
    expect(screen.getByText("Subtotal")).toBeTruthy()
    expect(screen.getByRole("button", { name: /hide items/i })).toBeTruthy()
  })

  it("marks selected paid orders as shipped", async () => {
    const container = await mount("orders-table")
    const toShip = () =>
      Number(screen.getByText("To ship").nextElementSibling!.textContent ?? "0")
    const before = toShip()
    expect(before).toBeGreaterThan(0)
    await act(async () => {
      fireEvent.click(
        screen.getByRole("checkbox", { name: /select all orders/i }),
      )
    })
    const ship = await screen.findByRole("button", { name: /as shipped/i })
    await act(async () => {
      fireEvent.click(ship)
    })
    expect(toShip()).toBeLessThan(before)
    expect(container.textContent).toMatch(/marked as shipped/)
  })
})

describe("tickets-table", () => {
  const rowCount = () =>
    Number(
      screen
        .getByRole("status", { name: "" })
        .textContent?.match(/of (\d+) items/)?.[1],
    )

  it("filters with a quick view and keeps the toolbar filter in sync", async () => {
    await mount("tickets-table")
    const all = rowCount()
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Unassigned" }))
    })
    expect(rowCount()).toBeLessThan(all)
    for (const row of document.querySelectorAll("tbody tr")) {
      expect(row.textContent).toContain("Unassigned")
    }
    // The toolbar's Assignee filter shows the view's selection.
    expect(
      screen
        .getAllByRole("button", { name: /assignee/i })
        .some(button => /^Assignee.*Unassigned/.test(button.textContent ?? "")),
    ).toBe(true)
  })

  it("marks selected tickets as solved", async () => {
    await mount("tickets-table")
    const solvedBefore = () =>
      [...document.querySelectorAll("tbody tr")].filter(row =>
        /Met/.test(row.textContent ?? ""),
      ).length
    expect(solvedBefore()).toBe(0)
    await act(async () => {
      fireEvent.click(
        screen.getByRole("checkbox", { name: /select all tickets/i }),
      )
    })
    await act(async () => {
      fireEvent.click(
        await screen.findByRole("button", { name: /mark solved/i }),
      )
    })
    expect(document.body.textContent).toMatch(/Solved \d+ tickets/)
  })
})
