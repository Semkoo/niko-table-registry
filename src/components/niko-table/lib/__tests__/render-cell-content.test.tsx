import { renderHook } from "@testing-library/react"
import { render } from "@testing-library/react"
import {
  useTable,
  type ColumnDef,
  type GroupingState,
} from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

import { features } from "@/components/niko-table/lib/data-table-features"
import { renderCellContent } from "@/components/niko-table/lib/render-cell-content"

type Project = {
  id: string
  name: string
  region: string
  budget: number
  subRows?: Project[]
}

const TREE_DATA: Project[] = [
  {
    id: "1",
    name: "Platform",
    region: "Europe",
    budget: 100,
    subRows: [{ id: "1-1", name: "API", region: "Europe", budget: 40 }],
  },
]

const FLAT_DATA: Project[] = [
  { id: "1", name: "Platform", region: "Europe", budget: 100 },
  { id: "2", name: "API", region: "Europe", budget: 40 },
]

const columns: ColumnDef<typeof features, Project>[] = [
  {
    accessorKey: "name",
    cell: ({ getValue }) => (
      <span data-testid="custom">{String(getValue())}</span>
    ),
  },
  { accessorKey: "region" },
  { accessorKey: "budget", aggregationFn: "sum" },
]

function useTreeTable() {
  return useTable({
    features,
    data: TREE_DATA,
    columns,
    state: { expanded: true },
    getSubRows: row => row.subRows,
    getRowId: row => row.id,
  })
}

function useGroupedTable(grouping: GroupingState) {
  return useTable({
    features,
    data: FLAT_DATA,
    columns,
    state: { grouping, expanded: true },
    getRowId: row => row.id,
  })
}

describe("renderCellContent", () => {
  it("keeps the column's own cell renderer on tree parent rows", () => {
    const { result } = renderHook(() => useTreeTable())
    const parentRow = result.current.getRowModel().rows[0]

    expect(parentRow.subRows.length).toBe(1)
    const nameCell = parentRow
      .getAllCells()
      .find(cell => cell.column.id === "name")!

    const { getByTestId } = render(<>{renderCellContent(nameCell)}</>)
    expect(getByTestId("custom").textContent).toBe("Platform")
  })

  it("aggregates on group rows when a grouping is active", () => {
    const { result } = renderHook(() => useGroupedTable(["region"]))
    const groupRow = result.current.getRowModel().rows[0]

    expect(groupRow.getIsGrouped()).toBe(true)

    const budgetCell = groupRow
      .getAllCells()
      .find(cell => cell.column.id === "budget")!
    const { container } = render(<>{renderCellContent(budgetCell)}</>)
    expect(container.textContent).toContain("140")
  })

  it("renders grouped cells with an expand control and leaf count", () => {
    const { result } = renderHook(() => useGroupedTable(["region"]))
    const groupRow = result.current.getRowModel().rows[0]

    const regionCell = groupRow
      .getAllCells()
      .find(cell => cell.column.id === "region")!
    const { container } = render(<>{renderCellContent(regionCell)}</>)

    expect(container.querySelector("button")).not.toBeNull()
    expect(container.textContent).toContain("(2)")
  })
})
