"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
/**
 * niko-table grid — headless interaction engine.
 *
 * Part of the niko-table editable DataGrid (registry item `niko-table/grid`).
 * Domain-free. Owns the grid STATE a table model has no concept of: the
 * focused cell, the selection anchor, the edit lifecycle, the copy-source
 * marching-ants — all addressed by ROW ID (not position) so they survive
 * filtering / sorting / reordering. Navigation and selection GEOMETRY live in
 * the container (`<DataGrid>`), which knows the display order; this hook is pure
 * state + id-keyed setters.
 */

import { useCallback, useEffect, useMemo, useReducer, useState } from "react"

import {
  type CellPosition,
  type CellState,
  type GridRow,
} from "../types/grid-cell"

/** Max undo/redo depth. Snapshots share unchanged row objects, so memory is
 *  roughly O(changes), not O(rows × history). */
const MAX_HISTORY = 100

/**
 * A general "what changed last commit" signal (see `UseDataGrid.lastCommit`).
 * `ids` enumerates the touched rows for granular ops (the O(1) hot path);
 * `bulk`/`reset` don't enumerate. `seq` advances on every real commit (never on
 * a no-op) so observers can `useEffect([lastCommit?.seq])`. Domain-free — an
 * analytics hook, a dirty-badge, or `useGridChanges` can all read it.
 */
export type GridCommit =
  | { kind: "set" | "add" | "remove"; ids: readonly string[]; seq: number }
  | { kind: "bulk" | "reset"; seq: number }

/** Meta each commit is tagged with so the reducer can surface `lastCommit`. */
type GridCommitMeta =
  | { kind: "set" | "add" | "remove"; ids: readonly string[] }
  | { kind: "bulk" | "reset" }

interface HistoryState<TRow> {
  rows: TRow[]
  past: TRow[][]
  future: TRow[][]
  lastCommit: GridCommit | null
}

type HistoryAction<TRow> =
  | { type: "commit"; updater: (rows: TRow[]) => TRow[]; meta: GridCommitMeta }
  | { type: "settle"; updater: (rows: TRow[]) => TRow[] }
  | { type: "undo" }
  | { type: "redo" }

/**
 * True when `next` is the same row list as `prev` — either by array identity
 * or by element identity (same length, every `next[i] === prev[i]`).
 *
 * Updaters often `rows.map(...)` and return the same row refs for unchanged
 * rows. Without the element-wise check, a brand-new array of identical refs
 * would still bump `seq` and re-fire `lastCommit` observers (e.g. validation
 * settle loops forever after the first edit).
 */
function isSameRowList<TRow>(prev: TRow[], next: TRow[]): boolean {
  if (next === prev) return true
  if (next.length !== prev.length) return false
  for (let i = 0; i < next.length; i++) {
    if (next[i] !== prev[i]) return false
  }
  return true
}

function historyReducer<TRow>(
  state: HistoryState<TRow>,
  action: HistoryAction<TRow>,
): HistoryState<TRow> {
  const seq = (state.lastCommit?.seq ?? 0) + 1
  switch (action.type) {
    case "commit": {
      const next = action.updater(state.rows)
      if (isSameRowList(state.rows, next)) return state // no-op → no history entry, seq unchanged
      const past =
        state.past.length >= MAX_HISTORY
          ? [...state.past.slice(1), state.rows]
          : [...state.past, state.rows]
      return {
        rows: next,
        past,
        future: [],
        lastCommit: { ...action.meta, seq },
      }
    }
    case "settle": {
      // A non-undoable row update: re-settling derived state (e.g. validation
      // status folded onto cells after an edit) must NOT push a history entry
      // or clear the redo stack, or undo/redo would step through the settle
      // instead of the user's actual edits. Past/future are left untouched.
      const next = action.updater(state.rows)
      if (isSameRowList(state.rows, next)) return state // converged → no change, no seq bump
      return { ...state, rows: next, lastCommit: { kind: "bulk", seq } }
    }
    case "undo": {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]!
      return {
        rows: prev,
        past: state.past.slice(0, -1),
        future: [state.rows, ...state.future],
        lastCommit: { kind: "bulk", seq },
      }
    }
    case "redo": {
      if (state.future.length === 0) return state
      const next = state.future[0]!
      return {
        rows: next,
        past: [...state.past, state.rows],
        future: state.future.slice(1),
        lastCommit: { kind: "bulk", seq },
      }
    }
    default:
      return state
  }
}

export interface UseDataGridConfig<TRow extends GridRow> {
  /** Editable column ids in visual order — the focusable/navigable cells. */
  columnIds: readonly string[]
  /** Factory for a fresh, all-empty row. Owns id generation. */
  createEmptyRow: (id: string) => TRow
  /** Hard cap on rows (e.g. a server's bulk-create max). Default 200. */
  maxRows?: number
  /** Rows to seed on mount. Default 5. Ignored when `initialRows` is given. */
  initialRowCount?: number
  /** Seed with these exact rows (e.g. editing existing data) instead of blanks. */
  initialRows?: TRow[]
  /**
   * Client id generator for runtime inserts (`addRows` / `insertRows`).
   * Default `crypto.randomUUID()`. Injectable for tests.
   *
   * Blank grids seeded via `initialRowCount` (no `initialRows`) use
   * deterministic `row-0`… ids so SSR and hydration agree — `makeId` is not
   * used for that path.
   */
  makeId?: () => string
}

export interface UseDataGrid<TRow extends GridRow> {
  rows: TRow[]
  /** What changed in the last commit — an observe-changes signal for external
   *  layers (e.g. `useGridChanges` for staging/autosave/CRUD). Null until the
   *  first commit; `seq` advances only on a real (non-no-op) commit. */
  lastCommit: GridCommit | null
  /** Active cell (moving corner of the selection + edit target), by id. */
  focusedCell: CellPosition | null
  /** Open cell editor, or null in navigate mode. */
  editingCell: CellPosition | null
  /** Fixed corner of the selection rectangle (null ⇒ single-cell selection). */
  selectionAnchor: CellPosition | null
  /** Char to seed the editor with when editing starts by typing (else null). */
  editSeed: string | null
  /** Select a single cell (collapses any range + closes the editor). */
  selectCell: (pos: CellPosition) => void
  /** Clear the cell selection (focus + anchor + editing). */
  deselect: () => void
  /** Extend the selection so the active corner becomes `pos` (anchor stays). */
  extendSelectionTo: (pos: CellPosition) => void
  /** Open the editor for a cell, optionally seeding it with a typed char. */
  startEditing: (pos: CellPosition, seed?: string | null) => void
  stopEditing: () => void
  /** Set a single resolved cell by row id (O(1): only that row's ref changes). */
  setCell: (rowId: string, columnId: string, next: CellState<string>) => void
  /**
   * Replace the whole rows array (paste expand + fill, sort, etc.). Undoable by
   * default; pass `{ history: false }` to re-settle derived state (validation)
   * without pushing an undo entry or clearing the redo stack.
   */
  updateRows: (
    updater: (rows: TRow[]) => TRow[],
    opts?: { history?: boolean },
  ) => void
  /** Append `count` empty rows; returns the created rows (with ids). */
  addRows: (count: number) => TRow[]
  /** Insert `count` empty rows above/below a row (by id); returns them. */
  insertRows: (
    anchorRowId: string,
    position: "above" | "below",
    count: number,
  ) => TRow[]
  removeRow: (rowId: string) => void
  removeRows: (rowIds: Iterable<string>) => void
  /** Replace every row with blanks (count = seed length or `initialRowCount`). */
  clearAll: () => void
  /** Undo the last data mutation (setCell / paste / insert / delete / clear). */
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Editable column ids in visual order — for the container's navigation. */
  columnIds: readonly string[]
  maxRows: number
}

export function useDataGrid<TRow extends GridRow>(
  config: UseDataGridConfig<TRow>,
): UseDataGrid<TRow> {
  const {
    columnIds,
    createEmptyRow,
    maxRows = 200,
    initialRowCount = 5,
    initialRows,
    makeId = () => crypto.randomUUID(),
  } = config

  const [history, dispatch] = useReducer(
    historyReducer<TRow>,
    null,
    (): HistoryState<TRow> => ({
      // Deterministic ids for the blank seed — `crypto.randomUUID()` here would
      // mismatch SSR vs client. Runtime inserts still go through `makeId`.
      rows:
        initialRows ??
        Array.from({ length: initialRowCount }, (_, i) =>
          createEmptyRow(`row-${i}`),
        ),
      past: [],
      future: [],
      lastCommit: null,
    }),
  )
  const rows = history.rows
  const lastCommit = history.lastCommit
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null)
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [selectionAnchor, setSelectionAnchor] = useState<CellPosition | null>(
    null,
  )
  const [editSeed, setEditSeed] = useState<string | null>(null)

  const selectCell = useCallback((pos: CellPosition) => {
    setFocusedCell(pos)
    setSelectionAnchor(pos)
    setEditingCell(null)
    setEditSeed(null)
  }, [])

  // Clear the cell selection entirely (click-away, deselect a column/row).
  const deselect = useCallback(() => {
    setFocusedCell(null)
    setSelectionAnchor(null)
    setEditingCell(null)
    setEditSeed(null)
  }, [])

  const extendSelectionTo = useCallback(
    (pos: CellPosition) => {
      setSelectionAnchor(anchor => anchor ?? focusedCell ?? pos)
      setFocusedCell(pos)
      // Match `selectCell`: leave edit mode so a shift-drag can't leave an
      // open editor committing against a selection the user has already moved.
      setEditingCell(null)
      setEditSeed(null)
    },
    [focusedCell],
  )

  const startEditing = useCallback(
    (pos: CellPosition, seed: string | null = null) => {
      setFocusedCell(pos)
      setSelectionAnchor(pos)
      setEditingCell(pos)
      setEditSeed(seed)
    },
    [],
  )

  const stopEditing = useCallback(() => {
    setEditingCell(null)
    setEditSeed(null)
  }, [])

  // O(1) commit: only the matching row's object identity changes. All row
  // mutations flow through `dispatch({ type: "commit" })` so each is undoable.
  const setCell = useCallback(
    (rowId: string, columnId: string, next: CellState<string>) => {
      dispatch({
        type: "commit",
        updater: prev =>
          prev.map(row =>
            row.id === rowId ? ({ ...row, [columnId]: next } as TRow) : row,
          ),
        meta: { kind: "set", ids: [rowId] },
      })
    },
    [],
  )

  const updateRows = useCallback(
    (updater: (rows: TRow[]) => TRow[], opts?: { history?: boolean }) => {
      const boundedUpdater = (prev: TRow[]) => {
        // Preserve the updater's no-op identity (`prev` back out) so the
        // reducer's no-op guard holds and no phantom history entry is pushed.
        const next = updater(prev)
        if (next === prev) return prev
        return next.length > maxRows ? next.slice(0, maxRows) : next
      }
      // `history: false` re-settles derived state without an undoable entry —
      // used by validation to fold cell status after an edit (see the reducer's
      // `settle` case). Everything else stays undoable.
      dispatch(
        opts?.history === false
          ? { type: "settle", updater: boundedUpdater }
          : { type: "commit", meta: { kind: "bulk" }, updater: boundedUpdater },
      )
    },
    [maxRows],
  )

  const addRows = useCallback(
    (count: number) => {
      const room = Math.max(0, maxRows - rows.length)
      const toAdd = Math.min(count, room)
      const created = Array.from({ length: toAdd }, () =>
        createEmptyRow(makeId()),
      )
      if (created.length > 0)
        dispatch({
          type: "commit",
          updater: prev => [...prev, ...created],
          meta: { kind: "add", ids: created.map(r => r.id) },
        })
      return created
    },
    [rows.length, createEmptyRow, makeId, maxRows],
  )

  const insertRows = useCallback(
    (anchorRowId: string, position: "above" | "below", count: number) => {
      const room = Math.max(0, maxRows - rows.length)
      const toAdd = Math.min(count, room)
      const created = Array.from({ length: toAdd }, () =>
        createEmptyRow(makeId()),
      )
      if (created.length > 0) {
        dispatch({
          type: "commit",
          updater: prev => {
            const idx = prev.findIndex(r => r.id === anchorRowId)
            if (idx === -1) return [...prev, ...created]
            const at = position === "above" ? idx : idx + 1
            const next = prev.slice()
            next.splice(at, 0, ...created)
            return next
          },
          meta: { kind: "add", ids: created.map(r => r.id) },
        })
      }
      return created
    },
    [rows.length, createEmptyRow, makeId, maxRows],
  )

  // Drop any focus/selection/edit state that pointed at removed rows —
  // otherwise a stale focusedCell leaves the grid cursor-less until the next
  // click, and a stale anchor produces a bogus selection rectangle.
  const releaseRemovedRows = useCallback((removed: (id: string) => boolean) => {
    setFocusedCell(fc => (fc && removed(fc.rowId) ? null : fc))
    setSelectionAnchor(a => (a && removed(a.rowId) ? null : a))
    setEditingCell(ec => (ec && removed(ec.rowId) ? null : ec))
  }, [])

  const removeRow = useCallback(
    (rowId: string) => {
      // Decide OUTSIDE the reducer updater (React may defer/replay it): when
      // the last-row guard blocks the delete, focus/edit state on the
      // surviving row must be kept — releasing it would silently close an
      // open editor and drop its draft even though nothing was deleted.
      if (rows.length <= 1 || !rows.some(r => r.id === rowId)) return
      dispatch({
        type: "commit",
        updater: prev => {
          if (prev.length <= 1) return prev
          const next = prev.filter(r => r.id !== rowId)
          return next.length === prev.length ? prev : next
        },
        meta: { kind: "remove", ids: [rowId] },
      })
      releaseRemovedRows(id => id === rowId)
    },
    [rows, releaseRemovedRows],
  )

  const removeRows = useCallback(
    (rowIds: Iterable<string>) => {
      const ids = new Set(rowIds)
      if (!rows.some(r => ids.has(r.id))) return
      dispatch({
        type: "commit",
        updater: prev => {
          const kept = prev.filter(r => !ids.has(r.id))
          if (kept.length === prev.length) return prev
          return kept.length > 0 ? kept : [createEmptyRow(makeId())]
        },
        meta: { kind: "remove", ids: [...ids] },
      })
      releaseRemovedRows(id => ids.has(id))
    },
    [rows, createEmptyRow, makeId, releaseRemovedRows],
  )

  // Replace every row with blanks. Row count matches the seed (`initialRows`
  // length, else `initialRowCount`) so a 500-row stress demo stays 500-tall.
  const clearAll = useCallback(() => {
    const count = initialRows?.length ?? initialRowCount
    dispatch({
      type: "commit",
      updater: () =>
        Array.from({ length: count }, () => createEmptyRow(makeId())),
      meta: { kind: "reset" },
    })
    setFocusedCell(null)
    setEditingCell(null)
    setSelectionAnchor(null)
    setEditSeed(null)
  }, [createEmptyRow, initialRowCount, initialRows, makeId])

  const undo = useCallback(() => dispatch({ type: "undo" }), [])
  const redo = useCallback(() => dispatch({ type: "redo" }), [])

  // Undo/redo can restore or drop rows without going through removeRow —
  // drop focus/anchor/edit that point at ids no longer in `rows`.
  useEffect(() => {
    const present = new Set(rows.map(r => r.id))
    releaseRemovedRows(id => !present.has(id))
  }, [rows, releaseRemovedRows])

  return useMemo(
    () => ({
      rows,
      lastCommit,
      focusedCell,
      editingCell,
      selectionAnchor,
      editSeed,
      selectCell,
      deselect,
      extendSelectionTo,
      startEditing,
      stopEditing,
      setCell,
      updateRows,
      addRows,
      insertRows,
      removeRow,
      removeRows,
      clearAll,
      undo,
      redo,
      canUndo,
      canRedo,
      columnIds,
      maxRows,
    }),
    [
      rows,
      lastCommit,
      focusedCell,
      editingCell,
      selectionAnchor,
      editSeed,
      selectCell,
      deselect,
      extendSelectionTo,
      startEditing,
      stopEditing,
      setCell,
      updateRows,
      addRows,
      insertRows,
      removeRow,
      removeRows,
      clearAll,
      undo,
      redo,
      canUndo,
      canRedo,
      columnIds,
      maxRows,
    ],
  )
}
