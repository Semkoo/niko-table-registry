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
 * niko-table grid — change tracking & persistence (opt-in).
 *
 * The engine (`useDataGrid`) is UNCONTROLLED — it owns the rows. This hook
 * OBSERVES it (via the `lastCommit` signal) and turns local edits into a CRUD
 * change-set, so a consumer can stage, autosave, or do full create/update/delete
 * against a backend. Install/import it ONLY on a grid that persists; grids that
 * don't pay nothing. Plain React, no dependency.
 *
 * Three patterns, one hook:
 *  - Staging:  edit → on Save read `getChangeSet().created` → one bulk mutation
 *              → `reconcile({ succeededIds, failedIds })` → highlight failures.
 *  - Autosave: `useEffect([dirtyRowIds])` + debounce → `getChangeSet()`
 *              → batch upsert → `reconcile`.
 *  - Full CRUD: create/update/delete all fall out of the change-set.
 */
import * as React from "react"

import type { UseDataGrid } from "./use-data-grid"
import type { GridRow } from "../types/grid-cell"

export interface UseGridChangesOptions<TRow extends GridRow> {
  /**
   * The server/pre-existing baseline. These rows' ids are "existing" (edits to
   * them are UPDATEs; removing them is a DELETE). Omit / pass `[]` for a fresh
   * import where everything the user enters is a CREATE. For a live-edit surface,
   * pass the SAME loaded rows you seeded `useDataGrid({ initialRows })` with.
   */
  initialRows?: readonly TRow[]
  /** Row identity. Default `(r) => r.id`. */
  getRowId?: (row: TRow) => string
  /**
   * Compare a current row to its baseline snapshot to filter reverts out of
   * `getChangeSet().updated` (a row edited back to its original value isn't a
   * real update). Default: reference equality — pair it with the engine's
   * structural sharing (unchanged rows keep their reference).
   */
  isEqual?: (current: TRow, baseline: TRow) => boolean
}

/** The precise CRUD delta to send to a backend. */
export interface GridChangeSet<TRow extends GridRow> {
  /** New rows (not in the baseline). */
  created: TRow[]
  /** Existing rows whose values changed (reverts filtered via `isEqual`). */
  updated: TRow[]
  /** Ids of baseline rows that were removed. */
  deleted: string[]
}

/** Outcome of a save, fed back to `reconcile` to settle dirty state. */
export interface GridReconcileResult {
  /** Rows that persisted — cleared from dirty and folded into the baseline. */
  succeededIds?: Iterable<string>
  /** Rows the server rejected — stay dirty and land in `failedRowIds`. */
  failedIds?: Iterable<string>
  // NB: client→server id remapping for created rows (rename the grid row under
  // its DB id) is intentionally NOT in v1 — no current consumer needs it
  // (imports create-then-close), and renaming a row id in an uncontrolled grid
  // is subtle. Consumers that need it keep their own client→server map for now.
}

export interface GridChanges<TRow extends GridRow> {
  /** Ids with unsaved changes (created ∪ updated ∪ deleted). Reactive. */
  dirtyRowIds: ReadonlySet<string>
  /** `dirtyRowIds.size > 0`. */
  isDirty: boolean
  /** Ids the last `reconcile` marked failed — highlight them (status + flashCells). */
  failedRowIds: ReadonlySet<string>
  /** The precise CRUD delta to persist. O(dirty) over a one-time O(n) row index. */
  getChangeSet: () => GridChangeSet<TRow>
  /** Settle dirty state after a save (clear succeeded, keep failed dirty). */
  reconcile: (result: GridReconcileResult) => void
  /** Re-baseline from `rows` (or the grid's current rows) — for a fresh load / new import. */
  reset: (rows?: readonly TRow[]) => void
}

const EMPTY_SET: ReadonlySet<string> = new Set()

export function useGridChanges<TRow extends GridRow>(
  grid: UseDataGrid<TRow>,
  options: UseGridChangesOptions<TRow> = {},
): GridChanges<TRow> {
  const getRowId = options.getRowId ?? ((r: TRow) => r.id)
  const isEqual = options.isEqual ?? ((a: TRow, b: TRow) => a === b)

  // Mutable tracking (refs — never trigger a render on their own).
  const existingIdsRef = React.useRef<Set<string>>(null as never)
  const baselineRef = React.useRef<Map<string, TRow>>(null as never)
  const dirtyRef = React.useRef<Set<string>>(null as never)
  const deletedRef = React.useRef<Set<string>>(null as never)
  const seenSeqRef = React.useRef(0)

  // Lazy one-time init from `initialRows` (the baseline). `reset()` re-bases.
  if (existingIdsRef.current === null) {
    existingIdsRef.current = new Set(
      (options.initialRows ?? []).map(r => getRowId(r)),
    )
    baselineRef.current = new Map(
      (options.initialRows ?? []).map(r => [getRowId(r), r]),
    )
    dirtyRef.current = new Set()
    deletedRef.current = new Set()
  }

  // Reactive mirrors — new identity only when the set's CONTENT changes, so an
  // `useEffect([dirtyRowIds])` autosave fires precisely (not on every keystroke).
  const [dirtyRowIds, setDirtyRowIds] = React.useState<ReadonlySet<string>>(
    () => new Set(dirtyRef.current),
  )
  const [failedRowIds, setFailedRowIds] =
    React.useState<ReadonlySet<string>>(EMPTY_SET)

  const flushDirty = React.useCallback(() => {
    setDirtyRowIds(new Set(dirtyRef.current))
  }, [])

  // Process each commit. `set/add/remove` reclassify only the touched ids (O(1)
  // each — no row scan); `bulk/reset` do a full recompute (O(n), rare).
  React.useEffect(() => {
    const commit = grid.lastCommit
    if (!commit || commit.seq === seenSeqRef.current) return
    seenSeqRef.current = commit.seq

    const existing = existingIdsRef.current
    const dirty = dirtyRef.current
    const deleted = deletedRef.current
    let changed = false

    if (commit.kind === "bulk" || commit.kind === "reset") {
      // Full recompute from the current rows vs the baseline.
      const nextDirty = new Set<string>()
      const nextDeleted = new Set<string>()
      const currentIds = new Set<string>()
      for (const row of grid.rows) {
        const id = getRowId(row)
        currentIds.add(id)
        if (!existing.has(id)) {
          nextDirty.add(id) // created
        } else if (!isEqual(row, baselineRef.current.get(id) as TRow)) {
          nextDirty.add(id) // updated
        }
      }
      for (const id of existing) {
        if (!currentIds.has(id)) {
          nextDirty.add(id) // deleted
          nextDeleted.add(id)
        }
      }
      dirtyRef.current = nextDirty
      deletedRef.current = nextDeleted
      changed = true
    } else if (commit.kind === "remove") {
      for (const id of commit.ids) {
        if (existing.has(id)) {
          if (!dirty.has(id)) changed = true
          dirty.add(id)
          deleted.add(id) // an existing row removed → DELETE
        } else {
          // A new (unsaved) row removed → nothing to persist.
          if (dirty.delete(id)) changed = true
          deleted.delete(id)
        }
      }
    } else if (commit.kind === "set" || commit.kind === "add") {
      // The row is present; existing ⇒ UPDATE, else ⇒ CREATE. Both dirty.
      // (Revert-to-original is filtered later in `getChangeSet`.)
      for (const id of commit.ids) {
        deleted.delete(id)
        if (!dirty.has(id)) {
          dirty.add(id)
          changed = true
        }
      }
    }

    if (changed) flushDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the commit; helpers are stable
  }, [grid.lastCommit])

  const getChangeSet = React.useCallback((): GridChangeSet<TRow> => {
    const existing = existingIdsRef.current
    const baseline = baselineRef.current
    const deleted = deletedRef.current
    // O(n) once: index the current rows by id.
    const byId = new Map<string, TRow>()
    for (const row of grid.rows) byId.set(getRowId(row), row)

    const created: TRow[] = []
    const updated: TRow[] = []
    for (const id of dirtyRef.current) {
      if (deleted.has(id)) continue
      const row = byId.get(id)
      if (!row) continue
      if (!existing.has(id)) {
        created.push(row)
      } else if (!isEqual(row, baseline.get(id) as TRow)) {
        updated.push(row) // reverts filtered here
      }
    }
    return { created, updated, deleted: [...deleted] }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads live refs + grid.rows
  }, [grid])

  const reconcile = React.useCallback(
    (result: GridReconcileResult) => {
      const existing = existingIdsRef.current
      const baseline = baselineRef.current
      const dirty = dirtyRef.current
      const deleted = deletedRef.current
      const byId = new Map<string, TRow>()
      for (const row of grid.rows) byId.set(getRowId(row), row)

      for (const id of result.succeededIds ?? []) {
        dirty.delete(id)
        if (deleted.has(id)) {
          // A persisted DELETE — drop it from the baseline entirely.
          deleted.delete(id)
          existing.delete(id)
          baseline.delete(id)
          continue
        }
        // Fold the persisted created/updated row into the baseline (under its
        // current id) — subsequent edits to it are UPDATEs, and re-basing it to
        // the row's current reference means it reads clean.
        const row = byId.get(id)
        existing.add(id)
        if (row) baseline.set(id, row)
      }

      setFailedRowIds(new Set(result.failedIds ?? []))
      setDirtyRowIds(new Set(dirty))
       
    },
    [grid],
  )

  const reset = React.useCallback(
    (rows?: readonly TRow[]) => {
      const base = rows ?? grid.rows
      existingIdsRef.current = new Set(base.map(r => getRowId(r)))
      baselineRef.current = new Map(base.map(r => [getRowId(r), r]))
      dirtyRef.current = new Set()
      deletedRef.current = new Set()
      seenSeqRef.current = grid.lastCommit?.seq ?? 0
      setDirtyRowIds(EMPTY_SET)
      setFailedRowIds(EMPTY_SET)
       
    },
    [grid],
  )

  return React.useMemo(
    () => ({
      dirtyRowIds,
      isDirty: dirtyRowIds.size > 0,
      failedRowIds,
      getChangeSet,
      reconcile,
      reset,
    }),
    [dirtyRowIds, failedRowIds, getChangeSet, reconcile, reset],
  )
}
