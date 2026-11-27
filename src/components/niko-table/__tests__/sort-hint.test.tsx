import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DataTableRoot } from "../core/data-table-root"
import { DataTableSortHint } from "../components/data-table-column-sort"

const data = [{ id: "1", name: "A" }]
const columns = [{ accessorKey: "name", header: "Name" }]

describe("DataTableSortHint", () => {
  it("shows the Shift + click hint when multi-sort is on", () => {
    render(
      <DataTableRoot data={data} columns={columns}>
        <DataTableSortHint />
      </DataTableRoot>,
    )
    expect(screen.getByText("Shift")).toBeTruthy()
    expect(screen.getByText(/to sort by more than one column/)).toBeTruthy()
  })

  it("renders nothing when multi-sort is off", () => {
    const { container } = render(
      <DataTableRoot
        data={data}
        columns={columns}
        config={{ enableMultiSort: false }}
      >
        <DataTableSortHint />
      </DataTableRoot>,
    )
    expect(container.textContent).not.toContain("Shift")
  })
})
