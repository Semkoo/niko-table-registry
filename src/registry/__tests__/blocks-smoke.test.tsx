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
import { invoices } from "../new-york/blocks/invoices-table/invoices-data"

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

describe("team-table", () => {
  it("seeds invited and suspended members", async () => {
    const container = await mount("team-table")
    const text = container.textContent ?? ""
    expect(text).toMatch(/[1-9]\d* pending invites/)
    const { members } = await import("../new-york/blocks/team-table/team-data")
    expect(members.some(m => m.status === "invited" && !m.lastActive)).toBe(
      true,
    )
    expect(members.some(m => m.status === "suspended")).toBe(true)
    expect(members.filter(m => m.role === "owner")).toHaveLength(1)
  })

  it("changes a member's role from the row menu", async () => {
    const container = await mount("team-table")
    // First active row with the plain member role.
    const row = [...container.querySelectorAll("tbody tr")].find(r =>
      /memberactive/.test(r.textContent ?? ""),
    ) as HTMLElement
    const name = row.querySelector(".font-medium")?.textContent ?? ""
    await act(async () => {
      fireEvent.contextMenu(row)
    })
    const sub = await screen.findByRole("menuitem", { name: "Role" })
    await act(async () => {
      fireEvent.keyDown(sub, { key: "ArrowRight" })
    })
    await act(async () => {
      fireEvent.click(await screen.findByRole("menuitem", { name: "Admin" }))
    })
    expect(document.body.textContent).toContain(`${name} is now admin`)
    expect(row.textContent).toMatch(/admin/)
  })

  it("invites a member through the dialog", async () => {
    await mount("team-table")
    const pending = () =>
      Number(
        document.body.textContent?.match(/(\d+) pending invites/)?.[1] ?? NaN,
      )
    const before = pending()
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }))
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
    expect(pending()).toBe(before + 1)
    const first = document.querySelector("tbody tr")!
    expect(first.textContent).toContain("Robin Example")
    expect(first.textContent).toContain("Pending invite")
  })
})

describe("request-logs-table", () => {
  const total = () =>
    screen.getByText("Requests").nextElementSibling?.textContent ?? ""

  it("renders only a window of the 5,000 rows", async () => {
    const container = await mount("request-logs-table")
    expect(total()).toBe("5,000")
    // jsdom has no layout, so assert far fewer rows than the dataset.
    const rendered = container.querySelectorAll("tbody tr").length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(200)
  })

  it("filters by status class 5xx", async () => {
    await mount("request-logs-table")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /status class/i }))
    })
    await act(async () => {
      fireEvent.click(await screen.findByText(/5xx/))
    })
    const count = Number(total().replace(/,/g, ""))
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(5000)
    const rows = [...document.querySelectorAll("tbody tr[data-row-id]")]
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.querySelector("[data-col-id=status]")?.textContent).toMatch(
        /^5\d\d$/,
      )
    }
  })
})

describe("invoices-table", () => {
  const groupToggles = () =>
    screen.queryAllByRole("button", {
      name: /^(Collapse|Expand) the .* group$/,
    })
  const overdueNote = () =>
    screen.getByRole("group", { name: "Overdue" }).lastElementChild!
      .textContent!
  const overdueCount = () => Number(overdueNote().match(/^(\d+)/)![1])

  it("groups by status with counts and totals, and ungroups", async () => {
    const container = await mount("invoices-table")
    const overdue = screen.getByRole("button", {
      name: /^(Collapse|Expand) the overdue group$/,
    })
    const groupRow = overdue.closest("tr")!
    const mine = invoices.filter(invoice => invoice.status === "overdue")
    const cents = mine.reduce((sum, invoice) => sum + invoice.amount, 0)
    const total = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
    expect(mine.length).toBeGreaterThan(0)
    expect(groupRow.textContent).toContain(
      `· ${mine.length} ${mine.length === 1 ? "invoice" : "invoices"}`,
    )
    expect(groupRow.textContent).toContain(total)
    expect(groupToggles().length).toBeGreaterThan(1)
    expect(screen.queryByRole("columnheader", { name: /status/i })).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Group by status" }))
    })
    expect(groupToggles()).toHaveLength(0)
    expect(screen.getByRole("columnheader", { name: /status/i })).toBeTruthy()
    const badge = container
      .querySelector("tbody tr")!
      .querySelector("td:nth-last-child(2)")!.textContent
    expect(badge).toMatch(/^(overdue|sent|draft|paid|void)$/)
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(30)
    expect(container.querySelector("tbody")!.textContent).not.toMatch(
      /· \d+ invoices?/,
    )
  })

  it("marks an overdue invoice as paid and updates the group and KPI", async () => {
    await mount("invoices-table")
    const before = overdueCount()
    const groupCount = () =>
      Number(
        screen
          .getByRole("button", {
            name: /^(Collapse|Expand) the overdue group$/,
          })
          .closest("tr")!
          .textContent!.match(/· (\d+) invoices?/)![1],
      )
    expect(groupCount()).toBe(before)
    const checkbox = screen
      .getAllByRole("checkbox", { name: /^select invoice/i })
      .find(box =>
        /Overdue \d+ days?/.test(box.closest("tr")!.textContent ?? ""),
      )!
    await act(async () => {
      fireEvent.click(checkbox)
    })
    await act(async () => {
      fireEvent.click(
        await screen.findByRole("button", { name: /mark as paid/i }),
      )
    })
    expect(overdueCount()).toBe(before - 1)
    expect(groupCount()).toBe(before - 1)
    expect(document.body.textContent).toMatch(/marked as paid/)
  })
})
