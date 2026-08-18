/**
 * End-to-end feature checks against the rendered table.
 *
 * TanStack Table v9 only exposes an API when its feature is registered in
 * `tableFeatures`, and a missing row model degrades silently (rows just come
 * back unsorted/unfiltered). These tests drive each feature through the public
 * component surface and assert on the DOM, so a missing registration in
 * `lib/data-table-features.ts` fails here instead of in production.
 */
import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { DataTable } from "../core/data-table"
import { DataTableRoot, type DataTableConfig } from "../core/data-table-root"
import { DataTableBody, DataTableHeader } from "../core/data-table-structure"
import { useDataTable } from "../core/data-table-context"
import type { DataTableColumnDef, DataTableInstance } from "../types"

type Person = {
  id: string
  name: string
  department: string
  salary: number
  hiredAt: string
}

const people: Person[] = [
  {
    id: "1",
    name: "Carol",
    department: "Design",
    salary: 120,
    hiredAt: "2021-03-01",
  },
  {
    id: "2",
    name: "alice",
    department: "Engineering",
    salary: 300,
    hiredAt: "2019-07-15",
  },
  {
    id: "3",
    name: "Bob",
    department: "Engineering",
    salary: 200,
    hiredAt: "2020-01-20",
  },
  {
    id: "4",
    name: "Dave",
    department: "Design",
    salary: 100,
    hiredAt: "2022-11-05",
  },
]

const columns: DataTableColumnDef<Person>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "salary", header: "Salary", aggregationFn: "sum" },
  { accessorKey: "hiredAt", header: "Hired" },
]

/** Exposes the live table instance so tests can drive the real API. */
function CaptureTable({
  onTable,
}: {
  onTable: (table: DataTableInstance<Person>) => void
}) {
  const { table } = useDataTable<Person>()
  React.useEffect(() => {
    onTable(table)
  }, [table, onTable])
  return null
}

/**
 * Renders the table and returns the live instance plus a helper that reads the
 * rendered first column, which is what a user actually sees.
 */
async function renderTable(
  config?: DataTableConfig,
  rootProps?: { getRowCanExpand?: () => boolean },
) {
  let table!: DataTableInstance<Person>
  await act(async () => {
    render(
      <DataTableRoot
        data={people}
        columns={columns}
        config={config}
        {...rootProps}
      >
        <CaptureTable
          onTable={instance => {
            table = instance
          }}
        />
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>,
    )
  })

  const columnText = (columnIndex = 0) =>
    Array.from(document.querySelectorAll("tbody tr")).map(
      row => row.querySelectorAll("td")[columnIndex]?.textContent?.trim() ?? "",
    )

  /** Runs a table mutation and flushes the resulting render. */
  const run = async (fn: () => void) => {
    await act(async () => {
      fn()
    })
  }

  return { table, columnText, run }
}

afterEach(cleanup)

describe("table features (v9 registration)", () => {
  it("renders every row and column by default", async () => {
    const { columnText } = await renderTable()
    expect(columnText()).toEqual(["Carol", "alice", "Bob", "Dave"])
    expect(screen.getAllByRole("columnheader")).toHaveLength(4)
  })

  it("sorts rows, including case-insensitive text and numbers", async () => {
    const { table, columnText, run } = await renderTable({
      enableSorting: true,
    })

    await run(() => table.getColumn("name")!.toggleSorting(false))
    expect(columnText()).toEqual(["alice", "Bob", "Carol", "Dave"])

    await run(() => table.getColumn("name")!.toggleSorting(true))
    expect(columnText()).toEqual(["Dave", "Carol", "Bob", "alice"])

    await run(() => table.getColumn("salary")!.toggleSorting(false))
    expect(columnText(2)).toEqual(["100", "120", "200", "300"])
  })

  it("multi-sorts on department then salary", async () => {
    const { table, columnText, run } = await renderTable({
      enableSorting: true,
    })

    await run(() =>
      table.setSorting([
        { id: "department", desc: false },
        { id: "salary", desc: true },
      ]),
    )
    expect(columnText()).toEqual(["Carol", "Dave", "alice", "Bob"])
  })

  it("filters a column through the registered `extended` filter fn", async () => {
    const { table, columnText, run } = await renderTable({
      enableFilters: true,
    })

    await run(() =>
      table.getColumn("department")!.setFilterValue({
        id: "department",
        value: "Engineering",
        variant: "text",
        operator: "iLike",
        filterId: "test-department",
      }),
    )
    expect(columnText()).toEqual(["alice", "Bob"])

    await run(() => table.getColumn("department")!.setFilterValue(undefined))
    expect(columnText()).toHaveLength(4)
  })

  it("filters with a plain column filter value", async () => {
    const { table, columnText, run } = await renderTable({
      enableFilters: true,
    })

    await run(() => table.getColumn("name")!.setFilterValue("o"))
    expect(columnText()).toEqual(["Carol", "Bob"])
  })

  it("applies the global filter across columns", async () => {
    const { table, columnText, run } = await renderTable({
      enableFilters: true,
    })

    await run(() => table.setGlobalFilter("Engineering"))
    expect(columnText()).toEqual(["alice", "Bob"])

    await run(() => table.setGlobalFilter(""))
    expect(columnText()).toHaveLength(4)
  })

  it("paginates and reports page count", async () => {
    const { table, columnText, run } = await renderTable({
      enablePagination: true,
      initialPageSize: 2,
    })

    expect(columnText()).toEqual(["Carol", "alice"])
    expect(table.getPageCount()).toBe(2)

    await run(() => table.nextPage())
    expect(columnText()).toEqual(["Bob", "Dave"])

    await run(() => table.previousPage())
    expect(columnText()).toEqual(["Carol", "alice"])
  })

  it("selects rows and keeps only selected ids in state", async () => {
    const { table, run } = await renderTable({ enableRowSelection: true })

    await run(() => table.getRowModel().rows[0]!.toggleSelected(true))
    expect(table.getSelectedRowModel().rows).toHaveLength(1)
    expect(table.atoms.rowSelection?.get()).toEqual({ "1": true })

    await run(() => table.toggleAllRowsSelected(true))
    expect(table.getIsAllRowsSelected()).toBe(true)
    // v9 changed `getIsSomeRowsSelected` to mean "at least one", so the
    // indeterminate check must pair it with the all-selected predicate.
    expect(table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()).toBe(
      false,
    )

    await run(() => table.getRowModel().rows[0]!.toggleSelected(false))
    expect(table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()).toBe(
      true,
    )
    // Deselected rows are absent from `RowSelectionState` in v9, never `false`.
    expect(Object.values(table.atoms.rowSelection?.get() ?? {})).not.toContain(
      false,
    )
  })

  it("groups rows and aggregates the grouped column", async () => {
    const { table, run } = await renderTable({
      enableGrouping: true,
      enableExpanding: true,
    })

    await run(() => table.setGrouping(["department"]))

    const groupRows = table.getRowModel().rows
    expect(groupRows).toHaveLength(2)
    expect(groupRows.map(row => row.getValue("department"))).toEqual([
      "Design",
      "Engineering",
    ])
    // `aggregationFn: "sum"` must resolve from the registered aggregation fns.
    expect(groupRows[0]!.getValue("salary")).toBe(220)
    expect(groupRows[1]!.getValue("salary")).toBe(500)

    await run(() => groupRows[0]!.toggleExpanded(true))
    expect(table.getRowModel().rows.length).toBeGreaterThan(2)
  })

  it("expands a row that renders extra content", async () => {
    const { table, run } = await renderTable(
      { enableExpanding: true },
      { getRowCanExpand: () => true },
    )
    const row = table.getRowModel().rows[0]!

    expect(row.getIsExpanded()).toBe(false)
    await run(() => row.toggleExpanded(true))
    expect(table.getRowModel().rows[0]!.getIsExpanded()).toBe(true)
  })

  it("hides and restores columns", async () => {
    const { table, run } = await renderTable()

    await run(() => table.getColumn("salary")!.toggleVisibility(false))
    expect(screen.getAllByRole("columnheader")).toHaveLength(3)

    await run(() => table.getColumn("salary")!.toggleVisibility(true))
    expect(screen.getAllByRole("columnheader")).toHaveLength(4)
  })

  it("pins columns with v9 logical start/end positions", async () => {
    const { table, run } = await renderTable()

    await run(() => table.getColumn("name")!.pin("start"))
    await run(() => table.getColumn("hiredAt")!.pin("end"))

    expect(table.getColumn("name")!.getIsPinned()).toBe("start")
    expect(table.getColumn("hiredAt")!.getIsPinned()).toBe("end")
    expect(table.atoms.columnPinning?.get()).toEqual({
      start: ["name"],
      end: ["hiredAt"],
    })
    expect(table.getStartLeafColumns().map(column => column.id)).toEqual([
      "name",
    ])
    expect(table.getEndLeafColumns().map(column => column.id)).toEqual([
      "hiredAt",
    ])
  })

  it("reorders columns", async () => {
    const { table, run } = await renderTable()

    await run(() =>
      table.setColumnOrder(["salary", "name", "department", "hiredAt"]),
    )
    expect(
      screen.getAllByRole("columnheader").map(cell => cell.textContent?.trim()),
    ).toEqual(["Salary", "Name", "Department", "Hired"])
  })

  it("resizes columns through the sizing feature", async () => {
    const { table, run } = await renderTable({ enableColumnResizing: true })

    await run(() => table.setColumnSizing({ name: 320 }))
    expect(table.getColumn("name")!.getSize()).toBe(320)
    expect(table.getColumn("name")!.getIsResizing()).toBe(false)
  })

  it("exposes faceted values for filter UIs", async () => {
    const { table } = await renderTable()
    const department = table.getColumn("department")!

    expect([...department.getFacetedUniqueValues().keys()].sort()).toEqual([
      "Design",
      "Engineering",
    ])
    expect(table.getColumn("salary")!.getFacetedMinMaxValues()).toEqual([
      100, 300,
    ])
  })
})
