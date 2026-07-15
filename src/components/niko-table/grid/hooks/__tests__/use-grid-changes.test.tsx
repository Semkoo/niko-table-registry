import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"

import type { CellState, GridRow } from "../../types/grid-cell"
import { useDataGrid } from "../use-data-grid"
import { useGridChanges, type UseGridChangesOptions } from "../use-grid-changes"

const cell = (raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw ? "valid" : "empty",
})
const createEmptyRow = (id: string): GridRow => ({ id })
const row = (id: string, a: string): GridRow => ({ id, a: cell(a) })

function setup(
  initialRows?: GridRow[],
  changeOpts?: Partial<UseGridChangesOptions<GridRow>>,
) {
  let n = 0
  const makeId = () => `n${n++}`
  return renderHook(() => {
    const grid = useDataGrid<GridRow>({
      columnIds: ["a", "b"],
      createEmptyRow,
      initialRows,
      initialRowCount: 0,
      makeId,
    })
    const changes = useGridChanges(grid, { initialRows, ...changeOpts })
    return { grid, changes }
  })
}

test("fresh import: untouched rows aren't dirty; adds + edits are creates", () => {
  const { result } = setup([])
  expect(result.current.changes.isDirty).toBe(false)

  let created: GridRow[] = []
  act(() => {
    created = result.current.grid.addRows(2)
  })
  expect(result.current.changes.isDirty).toBe(true)
  expect(result.current.changes.getChangeSet().created).toHaveLength(2)

  act(() => {
    result.current.grid.setCell(created[0]!.id, "a", cell("hi"))
  })
  const cs = result.current.changes.getChangeSet()
  expect(cs.created).toHaveLength(2)
  expect(cs.updated).toHaveLength(0)
  expect(cs.deleted).toHaveLength(0)
})

test("existing baseline: update / create / delete classify correctly", () => {
  const initial = [row("e1", "one"), row("e2", "two")]
  const { result } = setup(initial)
  expect(result.current.changes.isDirty).toBe(false)

  act(() => result.current.grid.setCell("e1", "a", cell("edited")))
  act(() => {
    result.current.grid.addRows(1)
  })
  act(() => result.current.grid.removeRow("e2"))

  const cs = result.current.changes.getChangeSet()
  expect(cs.updated.map(r => r.id)).toEqual(["e1"])
  expect(cs.created).toHaveLength(1)
  expect(cs.deleted).toEqual(["e2"])
})

test("a new row that is then removed is not persisted", () => {
  const { result } = setup([])
  let created: GridRow[] = []
  act(() => {
    created = result.current.grid.addRows(2)
  })
  act(() => result.current.grid.removeRow(created[0]!.id))
  const cs = result.current.changes.getChangeSet()
  expect(cs.created.map(r => r.id)).toEqual([created[1]!.id])
  expect(result.current.changes.dirtyRowIds.has(created[0]!.id)).toBe(false)
})

test("getChangeSet filters a revert-to-original (value isEqual)", () => {
  const initial = [row("e1", "orig")]
  const isEqual = (a: GridRow, b: GridRow) =>
    (a.a as CellState<string>)?.raw === (b.a as CellState<string>)?.raw
  const { result } = setup(initial, { isEqual })

  act(() => result.current.grid.setCell("e1", "a", cell("changed")))
  expect(result.current.changes.getChangeSet().updated).toHaveLength(1)

  act(() => result.current.grid.setCell("e1", "a", cell("orig")))
  // dirtyRowIds is conservative (still flags e1) but getChangeSet is precise:
  expect(result.current.changes.getChangeSet().updated).toHaveLength(0)
})

test("reconcile clears succeeded, keeps failed + populates failedRowIds", () => {
  const { result } = setup([])
  let created: GridRow[] = []
  act(() => {
    created = result.current.grid.addRows(2)
  })
  const [n1, n2] = [created[0]!.id, created[1]!.id]

  act(() =>
    result.current.changes.reconcile({ succeededIds: [n1], failedIds: [n2] }),
  )
  expect(result.current.changes.dirtyRowIds.has(n1)).toBe(false)
  expect(result.current.changes.dirtyRowIds.has(n2)).toBe(true)
  expect([...result.current.changes.failedRowIds]).toEqual([n2])
  expect(result.current.changes.getChangeSet().created.map(r => r.id)).toEqual([
    n2,
  ])
})

test("reconcile folds a succeeded create into the baseline (clean)", () => {
  const { result } = setup([])
  act(() => {
    result.current.grid.addRows(1)
  })
  const id = result.current.grid.rows[0]!.id
  act(() => result.current.changes.reconcile({ succeededIds: [id] }))
  expect(result.current.changes.isDirty).toBe(false)
  expect(result.current.changes.getChangeSet().created).toHaveLength(0)
})

test("reset re-baselines the current rows as clean", () => {
  const { result } = setup([])
  act(() => {
    result.current.grid.addRows(1)
  })
  expect(result.current.changes.isDirty).toBe(true)
  act(() => result.current.changes.reset())
  expect(result.current.changes.isDirty).toBe(false)
})

test("undo / redo re-classify via the bulk recompute", () => {
  const { result } = setup([])
  act(() => {
    result.current.grid.addRows(1)
  })
  expect(result.current.changes.isDirty).toBe(true)
  act(() => result.current.grid.undo())
  expect(result.current.changes.isDirty).toBe(false)
  act(() => result.current.grid.redo())
  expect(result.current.changes.isDirty).toBe(true)
})
