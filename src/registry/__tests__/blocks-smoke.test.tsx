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
import {
  categories,
  products,
} from "../new-york/blocks/inventory-grid/inventory-data"
import {
  PAGE_SIZE,
  queryTransactions,
  TRANSACTION_COUNT,
  transactionAt,
} from "../new-york/blocks/transactions-table/transactions-data"
import { arrayMove } from "@dnd-kit/sortable"
import type { DragEndEvent } from "@dnd-kit/core"
// Capture the provider's onDragEnd: jsdom has no layout, so the keyboard
// sensor cannot find a drop target. Everything else passes through.
const dnd = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: DragEndEvent) => void) | undefined,
}))
vi.mock("@dnd-kit/core", async importOriginal => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>()
  return {
    ...actual,
    DndContext: (props: React.ComponentProps<typeof actual.DndContext>) => {
      dnd.onDragEnd = props.onDragEnd
      return <actual.DndContext {...props} />
    },
  }
})
import { formatSigned } from "../new-york/blocks/transactions-table/transactions-format"
import {
  invoices,
  statusOptions as invoiceStatuses,
} from "../new-york/blocks/invoices-table/invoices-data"

const modules = import.meta.glob<{
  default: React.ComponentType<Record<string, unknown>>
}>("../new-york/blocks/*/*.tsx")

afterEach(cleanup)

async function mount(name: string, props: Record<string, unknown> = {}) {
  const load = modules[`../new-york/blocks/${name}/${name}.tsx`]
  expect(load, `no block file for ${name}`).toBeTruthy()
  const { default: Block } = await load!()
  let container: HTMLElement | undefined
  await act(async () => {
    container = render(<Block {...props} />).container
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
      // A block also ships the Niko Table overlay primitives it imports
      // (swapped per base); every other file must be the block's own.
      expect(
        item!.files
          .filter(file => !file.path.includes("/niko-table/primitives/"))
          .map(file => file.path.split("/").pop())
          .sort(),
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

  it("sample data includes every invoice status", () => {
    expect(new Set(invoices.map(invoice => invoice.status))).toEqual(
      new Set(invoiceStatuses.map(option => option.value)),
    )
  })

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

describe("backlog-table", () => {
  const dataModule = () =>
    import("../new-york/blocks/backlog-table/backlog-data")
  const formatModule = () =>
    import("../new-york/blocks/backlog-table/backlog-format")
  const rowKeys = () =>
    [...document.querySelectorAll("tbody tr[data-row-id]")].map(row =>
      row.getAttribute("data-row-id"),
    )

  it("seeds every type and status, and more points than the sprint holds", async () => {
    const { issues, CAPACITY } = await dataModule()
    const { belowTheLine } = await formatModule()
    for (const type of ["feature", "bug", "chore"])
      expect(issues.some(issue => issue.type === type)).toBe(true)
    for (const status of ["todo", "in-progress", "in-review", "done"])
      expect(issues.some(issue => issue.status === status)).toBe(true)
    expect(issues.some(issue => issue.assignee === null)).toBe(true)
    expect(issues).toHaveLength(18)
    const { keys, first } = belowTheLine(issues, CAPACITY)
    expect(keys.size).toBeGreaterThan(0)

    const container = await mount("backlog-table")
    expect(rowKeys()).toEqual(issues.map(issue => issue.key))
    const marked = container.querySelector(`tr[data-row-id="${first}"]`)!
    expect(marked.textContent).toContain("Below the line")
    expect(container.textContent?.match(/Below the line/g)).toHaveLength(1)
  })

  it("moves an issue to the top and moves the line", async () => {
    const { issues, CAPACITY } = await dataModule()
    const { belowTheLine } = await formatModule()
    const target = issues[issues.length - 1]!
    const expected = [target, ...issues.filter(i => i.key !== target.key)]
    const { first } = belowTheLine(expected, CAPACITY)
    expect(first).not.toBe(belowTheLine(issues, CAPACITY).first)

    const container = await mount("backlog-table")
    const row = container.querySelector(`tr[data-row-id="${target.key}"]`)!
    await act(async () => {
      fireEvent.contextMenu(row)
    })
    await act(async () => {
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "Move to top" }),
      )
    })
    expect(rowKeys()).toEqual(expected.map(issue => issue.key))
    expect(
      container.querySelector(`tr[data-row-id="${first}"]`)!.textContent,
    ).toContain("Below the line")
    expect(container.textContent?.match(/Below the line/g)).toHaveLength(1)
    expect(document.body.textContent).toContain(
      `${target.key} moved to position 1`,
    )
  })

  it("turns the drag handles off while searching", async () => {
    const container = await mount("backlog-table")
    const handles = () =>
      screen.queryAllByRole("button", { name: /drag to reorder/i })
    expect(handles()).toHaveLength(18)
    fireEvent.change(screen.getByRole("textbox", { name: /search/i }), {
      target: { value: "cart" },
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(container.querySelectorAll("tbody tr[data-row-id]")).toHaveLength(1)
    expect(handles()).toHaveLength(0)
    expect(
      screen.getAllByRole("button", { name: /reordering .* is off/i }),
    ).toHaveLength(1)

    fireEvent.change(screen.getByRole("textbox", { name: /search/i }), {
      target: { value: "" },
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(handles()).toHaveLength(18)
  })

  it("announces and orders a drag one place down and several places up", async () => {
    const { issues, CAPACITY } = await dataModule()
    const { belowTheLine } = await formatModule()
    const container = await mount("backlog-table")
    const drag = async (activeId: string, overId: string) => {
      await act(async () => {
        dnd.onDragEnd?.({
          active: { id: activeId },
          over: { id: overId },
        } as unknown as DragEndEvent)
      })
    }
    const live = () => document.querySelector("[aria-live=polite]")?.textContent

    // One place down: the case a before/after diff cannot tell apart.
    const first = issues[0]!
    const second = issues[1]!
    await drag(first.key, second.key)
    let expected = arrayMove(issues, 0, 1)
    expect(rowKeys()).toEqual(expected.map(issue => issue.key))
    expect(live()).toBe(`${first.key} moved to position 2`)

    // Several places up.
    const lifted = issues[12]!
    await drag(lifted.key, expected[2]!.key)
    expected = arrayMove(expected, 12, 2)
    expect(rowKeys()).toEqual(expected.map(issue => issue.key))
    expect(live()).toBe(`${lifted.key} moved to position 3`)
    const line = belowTheLine(expected, CAPACITY)
    expect(
      container.querySelector(`tr[data-row-id="${line.first}"]`)!.textContent,
    ).toContain("Below the line")
    expect(container.textContent?.match(/Below the line/g)).toHaveLength(1)
  })

  it("disables Move to top on the first row and Move to bottom on the last", async () => {
    const { issues } = await dataModule()
    const container = await mount("backlog-table")
    const open = async (key: string) => {
      await act(async () => {
        fireEvent.contextMenu(
          container.querySelector(`tr[data-row-id="${key}"]`)!,
        )
      })
    }
    await open(issues[0]!.key)
    expect(
      (
        await screen.findByRole("menuitem", { name: "Move to top" })
      ).hasAttribute("data-disabled"),
    ).toBe(true)
    expect(
      screen
        .getByRole("menuitem", { name: "Move to bottom" })
        .hasAttribute("data-disabled"),
    ).toBe(false)
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, {
        key: "Escape",
      })
    })
    await open(issues[issues.length - 1]!.key)
    const items = await screen.findAllByRole("menuitem", {
      name: "Move to bottom",
    })
    expect(items.some(item => item.hasAttribute("data-disabled"))).toBe(true)
  })
})

describe("shipments-table", () => {
  const LAYOUT = "shipments-table:layout"
  const SIZING = "shipments-table:sizing"

  const header = (container: HTMLElement, title: string) =>
    [...container.querySelectorAll("th")].find(th =>
      (th.textContent ?? "").startsWith(title),
    ) as HTMLElement | undefined

  async function openColumnMenu(th: HTMLElement) {
    const trigger = th.querySelector("button") as HTMLElement
    await act(async () => {
      fireEvent.keyDown(trigger, { key: "Enter" })
    })
  }

  const clickItem = async (name: RegExp) => {
    await act(async () => {
      fireEvent.click(await screen.findByRole("menuitem", { name }))
    })
  }

  function expectDefaults(container: HTMLElement) {
    expect(header(container, "Tracking ID")?.style.position).toBe("sticky")
    expect(header(container, "Reference")).toBeTruthy()
    expect([...container.querySelectorAll("th")].at(-1)?.style.right).toBe(
      "0px",
    )
  }

  it("hides a column from its menu and Reset layout brings it back", async () => {
    localStorage.clear()
    localStorage.setItem(SIZING, JSON.stringify({ route: 400 }))
    const container = await mount("shipments-table")
    expect(header(container, "Route")?.style.width).toBe("400px")

    await openColumnMenu(header(container, "Reference")!)
    await clickItem(/hide/i)
    expect(header(container, "Reference")).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(LAYOUT) ?? "{}").visibility).toEqual(
      { reference: false },
    )

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reset layout" }))
    })
    expect(header(container, "Reference")).toBeTruthy()
    expect(header(container, "Route")?.style.width).not.toBe("400px")
    expect(localStorage.getItem(LAYOUT)).toBeNull()
    expect(localStorage.getItem(SIZING)).toBeNull()
  })

  it("pins Tracking ID start and actions end, and unpins on request", async () => {
    localStorage.clear()
    const container = await mount("shipments-table")
    expectDefaults(container)
    expect(header(container, "Tracking ID")!.style.left).toBe("0px")
    // A column in the middle is not pinned.
    expect(header(container, "Carrier")!.style.position).toBe("")

    await openColumnMenu(header(container, "Tracking ID")!)
    await clickItem(/unpin/i)
    expect(header(container, "Tracking ID")!.style.position).toBe("")
    expect(JSON.parse(localStorage.getItem(LAYOUT) ?? "{}").pinning).toEqual({
      start: [],
      end: ["actions"],
    })
  })

  it("applies the saved layout after a remount", async () => {
    localStorage.clear()
    const first = await mount("shipments-table")
    await openColumnMenu(header(first, "Reference")!)
    await clickItem(/hide/i)
    await openColumnMenu(header(first, "Tracking ID")!)
    await clickItem(/unpin/i)
    cleanup()

    const second = await mount("shipments-table")
    expect(header(second, "Reference")).toBeUndefined()
    expect(header(second, "Tracking ID")!.style.position).toBe("")
  })

  it.each([
    ["not json", "{not json"],
    ["an empty object", "{}"],
    ["wrong types", '{"pinning":{"start":"x","end":5},"visibility":[1]}'],
    [
      "unknown ids",
      '{"pinning":{"start":["nope"]},"visibility":{"actions":false,"nope":false}}',
    ],
  ])("falls back to the defaults for %s in storage", async (_name, stored) => {
    localStorage.clear()
    localStorage.setItem(LAYOUT, stored)
    const container = await mount("shipments-table")
    const actions = [...container.querySelectorAll("th")].at(-1)!
    // The row menu column can never be hidden by stored state.
    expect(actions.textContent).toContain("Actions")
    expect(actions.style.right).toBe("0px")
    if (_name === "unknown ids") {
      // Unknown start ids are dropped, so the field is empty, not the default.
      expect(header(container, "Tracking ID")!.style.position).toBe("")
    } else expectDefaults(container)
  })

  it("seeds exact status counts, late shipments and the summary", async () => {
    localStorage.clear()
    const container = await mount("shipments-table")
    const { shipments, NOW } =
      await import("../new-york/blocks/shipments-table/shipments-data")
    expect(shipments).toHaveLength(45)
    const byStatus = (status: string) =>
      shipments.filter(s => s.status === status).length
    expect([
      byStatus("label-created"),
      byStatus("in-transit"),
      byStatus("out-for-delivery"),
      byStatus("delivered"),
      byStatus("exception"),
    ]).toEqual([1, 15, 1, 26, 2])
    expect(
      shipments.filter(s => s.status !== "delivered" && s.eta < NOW),
    ).toHaveLength(6)
    const today = shipments.filter(
      s => s.deliveredAt?.toISOString().slice(0, 10) === "2026-11-02",
    )
    expect(today).toHaveLength(4)
    expect(container.textContent).toContain(
      "16 in transit · 4 delivered today · 2 exceptions",
    )
  })
})

describe("transactions-table", () => {
  const loadedText = () =>
    screen.getByText(/^Loaded [\d,]+ of [\d,]+/).textContent ?? ""
  const wait = (ms: number) =>
    act(async () => {
      await new Promise(resolve => setTimeout(resolve, ms))
    })

  it("loads a page of 100, then 100 more", async () => {
    await mount("transactions-table")
    expect(loadedText()).toContain("Loaded 100 of 20,000")
    const headers = [...document.querySelectorAll("thead th")]
      .map(th => th.textContent?.trim())
      .filter(Boolean)
    expect(headers).toEqual([
      "Date",
      "Description",
      "Category",
      "Amount",
      "Balance",
      "Status",
    ])
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }))
    })
    expect(screen.getByText("Loading more…")).toBeTruthy()
    await wait(500)
    expect(loadedText()).toContain("Loaded 200 of 20,000")
    // jsdom has no layout, so only a window of the 200 rows is rendered.
    expect(
      document.querySelectorAll("tbody tr[data-row-id]").length,
    ).toBeLessThan(200)
  })

  it("refetches from the server when a category is chosen", async () => {
    await mount("transactions-table")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /category/i }))
    })
    await act(async () => {
      // The first match is a row badge; the filter option is inside the list.
      const hits = await screen.findAllByText("Rent")
      fireEvent.click(
        hits.find(hit => hit.closest("[cmdk-item]")) ??
          hits[0] ??
          document.body,
      )
    })
    // React batches updates made inside an act scope until it exits, so wait
    // in two steps: the search debounce (300ms), then the fake server (350ms).
    await wait(400)
    await wait(500)
    let rent = 0
    let rentIn = 0
    let rentOut = 0
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
      const t = transactionAt(i)
      if (t.category !== "Rent") continue
      rent++
      if (t.amount > 0) rentIn += t.amount
      else rentOut += t.amount
    }
    expect(rent).toBe(780)
    // The stats follow the filter and cover all 780, not the 100 loaded.
    const stat = (label: string) =>
      screen.getByText(label).nextElementSibling?.textContent
    expect(stat("Money in")).toBe(formatSigned(rentIn))
    expect(stat("Money out")).toBe(formatSigned(rentOut))
    expect(loadedText()).toContain(
      `Loaded ${Math.min(rent, PAGE_SIZE)} of ${rent.toLocaleString("en-US")}`,
    )
    // Paging is server-side, so the filters must still offer every option.
    const options = (name: RegExp) =>
      act(async () => {
        fireEvent.click(screen.getByRole("button", { name }))
      })
    const optionLabels = () =>
      [...document.querySelectorAll("[cmdk-item]")].map(el => el.textContent)
    expect(
      optionLabels().filter(label =>
        /^(Groceries|Rent|Salary|Transport|Dining|Utilities|Software|Transfers)$/.test(
          label ?? "",
        ),
      ),
    ).toHaveLength(8)
    await options(/type/i)
    expect(
      optionLabels().filter(l => /credit|debit/i.test(l ?? "")),
    ).toHaveLength(2)
    const rows = [...document.querySelectorAll("tbody tr[data-row-id]")]
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.querySelector("[data-col-id=category]")?.textContent).toBe(
        "Rent",
      )
    }
  })

  it("shows account-wide money in and out from the server, with the balance", async () => {
    await mount("transactions-table")
    // Computed independently from every row, not from the 100 loaded.
    let moneyIn = 0
    let moneyOut = 0
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
      const amount = transactionAt(i).amount
      if (amount > 0) moneyIn += amount
      else moneyOut += amount
    }
    const page = queryTransactions({ cursor: 0, limit: 1 })
    expect([page.moneyIn, page.moneyOut]).toEqual([moneyIn, moneyOut])
    const stat = (label: string) =>
      screen.getByText(label).nextElementSibling?.textContent
    expect(stat("Money in")).toBe(formatSigned(moneyIn))
    expect(stat("Money out")).toBe(formatSigned(moneyOut))
    expect(stat("Current balance")).toBe("$74,686.00")
  })

  it("searches on the server after the debounce", async () => {
    await mount("transactions-table")
    const input = screen.getByPlaceholderText(/search description/i)
    await act(async () => {
      fireEvent.change(input, { target: { value: "larkfield" } })
    })
    await wait(400)
    await wait(500)
    let hits = 0
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
      if (transactionAt(i).description.toLowerCase().includes("larkfield"))
        hits++
    }
    expect(hits).toBe(867)
    expect(loadedText()).toContain("Loaded 100 of 867")
  })

  it("is deterministic and keeps a correct running balance", () => {
    // Anchors: exact values for fixed indexes.
    expect(transactionAt(0)).toEqual({
      id: "TX-020000",
      date: 1793620517778,
      description: "ClearStream Water",
      category: "Utilities",
      type: "debit",
      amount: -6700,
      balance: 7_468_600,
      status: "pending",
      account: "Everyday ••4821",
    })
    expect(transactionAt(7)).toMatchObject({
      id: "TX-019993",
      description: "Corner Crate Co-op",
      amount: -5800,
      status: "posted",
    })
    const page = queryTransactions({ cursor: 100, limit: 100 })
    expect(page.rows[0]?.id).toBe("TX-019900")
    expect(page.nextCursor).toBe(200)
    expect(page.rows).toEqual(
      Array.from({ length: 100 }, (_, i) => transactionAt(100 + i)),
    )
    expect(queryTransactions({ cursor: 19_950, limit: 100 }).nextCursor).toBe(
      null,
    )

    // Running balance, in cents, across the page boundary at 100 and beyond.
    for (let i = 0; i < 500; i++) {
      expect(transactionAt(i + 1).balance + transactionAt(i).amount).toBe(
        transactionAt(i).balance,
      )
    }
    let min = Infinity
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
      min = Math.min(min, transactionAt(i).balance)
    }
    expect(min).toBe(150_000)
  })

  it("filters by type and category with exact totals, and covers every state", () => {
    const sample = Array.from({ length: 2000 }, (_, i) => transactionAt(i))
    let credits = 0
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
      if (transactionAt(i).type === "credit") credits++
    }
    const total = (o: object) =>
      queryTransactions({ cursor: 0, limit: 1, ...o }).total
    expect(credits).toBe(2825)
    expect(total({ type: ["credit"] })).toBe(2825)
    expect(total({ type: ["debit"] })).toBe(TRANSACTION_COUNT - 2825)
    expect(total({ category: ["Rent"] })).toBe(780)
    for (const category of [
      "Groceries",
      "Rent",
      "Salary",
      "Transport",
      "Dining",
      "Utilities",
      "Software",
      "Transfers",
    ]) {
      expect(
        sample.some(t => t.category === category),
        category,
      ).toBe(true)
    }
    expect(sample.filter(t => t.status === "pending")).toHaveLength(6)
    expect(
      sample.every((t, i) => t.date < (sample[i - 1]?.date ?? Infinity)),
    ).toBe(true)
  })
})

describe("inventory-grid", () => {
  const usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })
  // Inventory value in integer cents, like the block computes it.
  const valueOf = (rows: typeof products) =>
    usd.format(
      rows.reduce((sum, p) => sum + Math.round(p.price * 100) * p.stock, 0) /
        100,
    )
  const lowStockProducts = () => products.filter(p => p.stock <= p.reorderAt)
  const stat = (label: string) =>
    screen.getAllByText(label).find(el => el.nextElementSibling)
      ?.nextElementSibling?.textContent ?? ""
  const cellOf = (sku: string, column: string) =>
    document.querySelector(`[data-cell="${sku}:${column}"]`) as HTMLElement
  const first = products[0]
  // First product with its stock lowered to its reorder level.
  const firstLow = { ...first, stock: first.reorderAt }

  // Double-click opens the editor (a real input); Enter commits it.
  async function edit(sku: string, column: string, value: string) {
    await act(async () => {
      fireEvent.doubleClick(cellOf(sku, column))
    })
    const input = cellOf(sku, column).querySelector("input") as HTMLElement
    await act(async () => {
      fireEvent.change(input, { target: { value } })
      fireEvent.keyDown(input, { key: "Enter" })
    })
  }
  async function rowAction(sku: string, name: string) {
    const row = document.querySelector(`tr[data-row-id="${sku}"]`) as Element
    await act(async () => {
      fireEvent.contextMenu(row)
    })
    await act(async () => {
      fireEvent.click(await screen.findByRole("menuitem", { name }))
    })
  }
  const press = async (name: string) =>
    act(async () => {
      fireEvent.click(screen.getByRole("button", { name }))
    })

  it("seeds a realistic mix of products", () => {
    expect(products).toHaveLength(60)
    expect(lowStockProducts()).toHaveLength(9)
    expect(products.filter(p => p.stock === 0)).toHaveLength(2)
    expect(products.filter(p => !p.active)).toHaveLength(7)
    expect(products.filter(p => p.restockDate !== null)).toHaveLength(15)
    for (const category of categories) {
      expect(products.some(p => p.category === category)).toBe(true)
    }
  })

  it("updates low stock, inventory value and the unsaved count when stock is edited", async () => {
    await mount("inventory-grid")
    expect(stat("Products")).toBe("60")
    expect(stat("Low stock")).toBe("9")
    expect(stat("Inventory value")).toBe(valueOf(products))
    expect(screen.queryByText(/^\d+ unsaved change/)).toBeNull()

    await edit(first.sku, "stock", String(first.reorderAt))
    expect(stat("Low stock")).toBe("10")
    expect(stat("Inventory value")).toBe(
      valueOf([firstLow, ...products.slice(1)]),
    )
    expect(screen.getByText("1 unsaved change")).toBeTruthy()
    expect(cellOf(first.sku, "stock").textContent).toContain("Low stock")
  })

  it("discards edits back to the seed", async () => {
    await mount("inventory-grid")
    await edit(first.sku, "stock", String(first.reorderAt))
    await press("Discard")
    expect(screen.queryByText(/^\d+ unsaved change/)).toBeNull()
    expect(stat("Low stock")).toBe("9")
    expect(stat("Inventory value")).toBe(valueOf(products))
  })

  it("adds, duplicates and deletes products as created and deleted changes", async () => {
    await mount("inventory-grid")
    await press("Add product")
    expect(stat("Products")).toBe("61")
    expect(screen.getByText("1 unsaved change")).toBeTruthy()
    // A new product has no name or price yet, so it blocks Save.
    expect(
      (screen.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    await press("Discard")

    await rowAction(first.sku, "Duplicate")
    expect(stat("Products")).toBe("61")
    expect(screen.getByText("1 unsaved change")).toBeTruthy()
    expect(stat("Inventory value")).toBe(valueOf([...products, first]))
    await press("Discard")

    await rowAction(first.sku, "Delete product")
    expect(stat("Products")).toBe("59")
    expect(screen.getByText("1 unsaved change")).toBeTruthy()
    expect(stat("Inventory value")).toBe(valueOf(products.slice(1)))
  })

  it("keeps SKU read-only", async () => {
    await mount("inventory-grid")
    expect(cellOf(first.sku, "sku")).toBeNull()
    expect(
      document.querySelector(`tr[data-row-id="${first.sku}"]`)?.textContent,
    ).toContain(first.sku)
  })

  it("flags an invalid price, blocks Save, and saves once fixed", async () => {
    await mount("inventory-grid")
    const save = () =>
      screen.getByRole("button", { name: "Save" }) as HTMLButtonElement
    const priceButton = () => cellOf(first.sku, "price").querySelector("button")

    await edit(first.sku, "price", "0")
    expect(priceButton()?.getAttribute("aria-invalid")).toBe("true")
    expect(screen.getByText(/Fix 1 invalid cell to save/)).toBeTruthy()
    expect(save().disabled).toBe(true)

    await edit(first.sku, "price", "12.345")
    expect(priceButton()?.getAttribute("aria-invalid")).toBe("true")

    await edit(first.sku, "price", "12.5")
    expect(priceButton()?.getAttribute("aria-invalid")).toBe("false")
    expect(save().disabled).toBe(false)

    vi.useFakeTimers()
    try {
      await act(async () => {
        fireEvent.click(save())
      })
      expect(save().disabled).toBe(true)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
    } finally {
      vi.useRealTimers()
    }
    expect(screen.queryByText(/^\d+ unsaved change/)).toBeNull()
    expect(screen.getByText("Saved 1 change")).toBeTruthy()
    expect(stat("Inventory value")).toBe(
      valueOf([{ ...first, price: 12.5 }, ...products.slice(1)]),
    )
  })

  it("keeps an edit made while saving as an unsaved change", async () => {
    await mount("inventory-grid")
    const second = products[1]
    await edit(first.sku, "price", "12.5")

    vi.useFakeTimers()
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
      })
      expect(screen.getByText("Saving 1 change…")).toBeTruthy()
      await edit(second.sku, "price", "9.99")
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
    } finally {
      vi.useRealTimers()
    }
    expect(screen.getByText("1 unsaved change")).toBeTruthy()
    expect(screen.getByText("Saved 1 change")).toBeTruthy()

    // Discard goes back to the saved first price, not the seed and not 9.99.
    await edit(first.sku, "price", "11")
    await press("Discard")
    expect(stat("Inventory value")).toBe(
      valueOf([{ ...first, price: 12.5 }, ...products.slice(1)]),
    )
  })

  it("shows an edit undone during the save as an unsaved change", async () => {
    await mount("inventory-grid")
    await edit(first.sku, "price", "12.5")
    vi.useFakeTimers()
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
      })
      await press("Undo")
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
      expect(screen.getByText("1 unsaved change")).toBeTruthy()
      expect(cellOf(first.sku, "price").textContent).toBe(
        usd.format(first.price),
      )
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
    } finally {
      vi.useRealTimers()
    }
    expect(screen.queryByText(/^\d+ unsaved change/)).toBeNull()
  })

  it("sends a created row that is edited during the save as an update next time", async () => {
    const persist = vi.fn(
      () => new Promise<void>(resolve => setTimeout(resolve, 600)),
    )
    await mount("inventory-grid", { persist })
    await rowAction(first.sku, "Duplicate")
    vi.useFakeTimers()
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
      })
      await edit("NEW-001", "price", "9.99")
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
      expect(screen.getByText("1 unsaved change")).toBeTruthy()
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600)
      })
    } finally {
      vi.useRealTimers()
    }
    const [firstSave, secondSave] = persist.mock.calls.map(
      call =>
        (call as unknown[])[0] as {
          created: { id: string }[]
          updated: { id: string }[]
        },
    )
    expect(firstSave.created.map(r => r.id)).toEqual(["NEW-001"])
    expect(secondSave.created).toEqual([])
    expect(secondSave.updated.map(r => r.id)).toEqual(["NEW-001"])
  })
})
