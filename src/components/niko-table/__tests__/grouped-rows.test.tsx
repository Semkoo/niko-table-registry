/**
 * Composable group rows.
 *
 * Grouping is opted into by nesting `<DataTableGroupedRows>` in a body — no
 * config flag, no renderer prop, no callback. These tests assert the whole
 * contract: the marker turns the feature on by itself, the built-in row
 * renders, and a nested child replaces it while still reading its group from
 * context.
 */
import * as React from "react"
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { DataTable } from "../core/data-table"
import { DataTableRoot } from "../core/data-table-root"
import { DataTableBody, DataTableHeader } from "../core/data-table-structure"
import {
  DataTableGroupedRows,
  useDataTableGroupRow,
} from "../components/data-table-grouped-rows"
import type { DataTableColumnDef } from "../types"

type Person = { id: string; name: string; department: string; salary: number }

const people: Person[] = [
  { id: "1", name: "Ada", department: "Engineering", salary: 100 },
  { id: "2", name: "Grace", department: "Engineering", salary: 200 },
  { id: "3", name: "Katherine", department: "Design", salary: 300 },
]

const columns: DataTableColumnDef<Person>[] = [
  { id: "department", accessorKey: "department", header: "Department" },
  { id: "name", accessorKey: "name", header: "Name" },
  {
    id: "salary",
    accessorKey: "salary",
    header: "Salary",
    aggregationFn: "sum",
    aggregatedCell: ({ getValue }) => `Σ ${String(getValue() ?? "")}`,
  },
]

async function renderTable(body: React.ReactNode) {
  await act(async () => {
    render(
      <DataTableRoot
        data={people}
        columns={columns}
        initialState={{ grouping: ["department"], expanded: true }}
      >
        <DataTable>
          <DataTableHeader />
          {body}
        </DataTable>
      </DataTableRoot>,
    )
  })
}

const groupRows = () =>
  Array.from(document.querySelectorAll('tr[data-row-type="grouped"]'))

afterEach(cleanup)

describe("DataTableGroupedRows", () => {
  it("renders no group rows when the marker is absent", async () => {
    await renderTable(<DataTableBody />)
    expect(groupRows()).toHaveLength(0)
  })

  it("turns grouping on by its presence alone — no config flag", async () => {
    await renderTable(
      <DataTableBody>
        <DataTableGroupedRows />
      </DataTableBody>,
    )
    // Two departments in the fixture.
    expect(groupRows()).toHaveLength(2)
  })

  it("shows the group value and a row count in the built-in row", async () => {
    await renderTable(
      <DataTableBody>
        <DataTableGroupedRows />
      </DataTableBody>,
    )
    const text = groupRows()
      .map(r => r.textContent ?? "")
      .join(" | ")
    expect(text).toContain("Engineering")
    expect(text).toContain("2 rows")
    expect(text).toContain("Design")
    expect(text).toContain("1 row")
  })

  it("renders aggregated cells from the column definition", async () => {
    await renderTable(
      <DataTableBody>
        <DataTableGroupedRows />
      </DataTableBody>,
    )
    const text = groupRows()
      .map(r => r.textContent ?? "")
      .join(" | ")
    // Engineering: 100 + 200
    expect(text).toContain("Σ 300")
  })

  it("lets a nested child replace the row and read its group from context", async () => {
    function DepartmentGroupRow() {
      const { groupLabel, count, isExpanded } = useDataTableGroupRow()
      return (
        <td colSpan={3} data-testid="custom-group">
          {groupLabel} · {count} · {isExpanded ? "open" : "closed"}
        </td>
      )
    }

    await renderTable(
      <DataTableBody>
        <DataTableGroupedRows>
          <DepartmentGroupRow />
        </DataTableGroupedRows>
      </DataTableBody>,
    )

    const custom = Array.from(
      document.querySelectorAll('[data-testid="custom-group"]'),
    ).map(el => el.textContent?.trim())

    expect(custom).toHaveLength(2)
    expect(custom.join(" | ")).toContain("Engineering · 2 · open")
    // The built-in chevron is gone — the child fully replaced the row body.
    expect(document.querySelector('[aria-label^="Collapse the"]')).toBeNull()
  })

  it("falls back to the built-in row for groups enabledFor rejects", async () => {
    function DesignOnlyRow() {
      const { groupLabel } = useDataTableGroupRow()
      return (
        <td colSpan={3} data-testid="custom-group">
          {groupLabel}
        </td>
      )
    }

    await renderTable(
      <DataTableBody>
        <DataTableGroupedRows
          enabledFor={row => row.getGroupingValue("department") === "Design"}
        >
          <DesignOnlyRow />
        </DataTableGroupedRows>
      </DataTableBody>,
    )

    expect(
      document.querySelectorAll('[data-testid="custom-group"]'),
    ).toHaveLength(1)
    // Engineering still gets the built-in row, so its chevron is present.
    expect(
      document.querySelector('[aria-label^="Collapse the"]'),
    ).not.toBeNull()
  })
})
