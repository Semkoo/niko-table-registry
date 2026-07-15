import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"

import type { CellState, GridRow } from "../../types/grid-cell"
import { useDataGrid } from "../use-data-grid"

const cell = (
  raw: string,
  status: CellState<string>["status"] = "valid",
): CellState<string> => ({
  raw,
  value: raw || null,
  status,
  error: status === "invalid" ? "bad" : undefined,
})

const createEmptyRow = (id: string): GridRow => ({ id })

test("settle with unchanged row refs does not bump lastCommit.seq (no loop)", () => {
  let n = 0
  const { result } = renderHook(() =>
    useDataGrid<GridRow>({
      columnIds: ["a", "b"],
      createEmptyRow,
      initialRows: [{ id: "r1", a: cell("1"), b: cell("2") }],
      initialRowCount: 0,
      makeId: () => `n${n++}`,
    }),
  )

  act(() => {
    result.current.setCell("r1", "a", cell("edited"))
  })
  const seqAfterEdit = result.current.lastCommit!.seq

  act(() => {
    result.current.updateRows(
      rows =>
        rows.map(row => {
          // Same refs when nothing to settle — maps to a new array.
          return row
        }),
      { history: false },
    )
  })

  expect(result.current.lastCommit!.seq).toBe(seqAfterEdit)
})

test("settle that changes a row bumps lastCommit once", () => {
  let n = 0
  const { result } = renderHook(() =>
    useDataGrid<GridRow>({
      columnIds: ["a", "b"],
      createEmptyRow,
      initialRows: [{ id: "r1", a: cell("1"), b: cell("2") }],
      initialRowCount: 0,
      makeId: () => `n${n++}`,
    }),
  )

  act(() => {
    result.current.setCell("r1", "a", cell("edited"))
  })
  const seqAfterEdit = result.current.lastCommit!.seq

  act(() => {
    result.current.updateRows(
      rows =>
        rows.map(row => ({
          ...row,
          b: cell("settled", "invalid"),
        })),
      { history: false },
    )
  })

  expect(result.current.lastCommit!.seq).toBe(seqAfterEdit + 1)
  expect(result.current.canUndo).toBe(true)
  // Settle must not push an undo entry — undoing should revert the setCell, not the settle.
  act(() => {
    result.current.undo()
  })
  expect((result.current.rows[0]!.a as CellState<string>).raw).toBe("1")
})
