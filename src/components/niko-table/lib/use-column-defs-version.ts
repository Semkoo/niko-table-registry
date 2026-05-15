import type { Table } from "@tanstack/react-table"
import * as React from "react"

/**
 * Tracks column-def reference changes and returns a monotonically-increasing
 * version number that bumps whenever any column's `columnDef` reference
 * changes.
 *
 * Why: row components are wrapped in `React.memo` for perf — they only
 * re-render when their props change. The `cell` renderer lives inside
 * `columnDef` (not on row props), so when a consumer rebuilds the
 * `columns` array via `useMemo([externalState, ...])`, the row's memo
 * still sees the same props and skips the re-render. The cell keeps
 * rendering with the stale closure.
 *
 * Appending this version to `columnLayoutSignature` invalidates row
 * memos automatically when column defs are rebuilt — making
 * external-state-dependent cells "just work" without forcing every
 * consumer to wire `getRowMemoKey`.
 *
 * For fine-grained per-row invalidation (only the affected row re-renders
 * instead of all visible rows), consumers can still pass `getRowMemoKey`.
 *
 * Implementation note: uses the React-canonical "adjusting state during
 * render" pattern (setState in render body) so the version derives from
 * the current column defs without touching refs.
 */
export function useColumnDefsVersion<TData>(table: Table<TData>): number {
  const allColumns = table.getAllColumns()
  const defs = allColumns.map(c => c.columnDef)

  const [snapshot, setSnapshot] = React.useState<{
    defs: unknown[]
    version: number
  }>(() => ({ defs, version: 0 }))

  const changed =
    defs.length !== snapshot.defs.length ||
    defs.some((d, i) => d !== snapshot.defs[i])

  if (changed) {
    setSnapshot({ defs, version: snapshot.version + 1 })
    return snapshot.version + 1
  }

  return snapshot.version
}
