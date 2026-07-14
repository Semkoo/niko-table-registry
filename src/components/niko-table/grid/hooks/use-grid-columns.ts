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
import * as React from "react"

/** GridRow's reserved row-identity key — a column may not shadow it. */
const RESERVED_COLUMN_ID = "id"

/**
 * A dynamic column descriptor. `type` is a consumer-defined tag (e.g. "text",
 * "select", "date") that the consumer maps to a cell editor + resolver — the
 * grid itself stays type-agnostic. Extra per-type config (e.g. `options` for a
 * select) rides along and is passed straight back to the consumer's renderer.
 */
export interface GridColumnSpec {
  id: string
  label: string
  type: string
  width?: number
  options?: readonly string[]
}

export interface GridColumnsApi {
  /** Current columns, in display order. Build your `tableColumns` from this. */
  columns: GridColumnSpec[]
  /** Derived id list, in order — feed straight to `useDataGrid({ columnIds })`. */
  columnIds: string[]
  /**
   * Append (or insert at `atIndex`) a new column and return it. Missing fields
   * default to a text column labelled "Column N". Existing rows need no change
   * — a cell with no value for the new column renders empty.
   */
  addColumn: (
    spec?: Partial<GridColumnSpec>,
    atIndex?: number,
  ) => GridColumnSpec
  /** Remove a column. Its cell data is left orphaned in the rows (harmless). */
  removeColumn: (id: string) => void
  /** Rename a column's header label. */
  renameColumn: (id: string, label: string) => void
  /** Replace a column's type (and optional per-type config). */
  setColumnType: (
    id: string,
    type: string,
    extra?: Pick<GridColumnSpec, "options">,
  ) => void
  /** Move a column one slot left (`-1`) or right (`1`). No-op at the edges. */
  moveColumn: (id: string, dir: -1 | 1) => void
  /**
   * Reorder columns to match `orderedIds` (e.g. from a drag-reorder view menu's
   * `onColumnOrderChange`). Ids not listed keep their relative order at the end.
   */
  reorderColumns: (orderedIds: string[]) => void
}

export interface UseGridColumnsOptions {
  initialColumns: GridColumnSpec[]
  /** Mint a unique id for a new column. Default: an incrementing `newcol_N`. */
  makeColumnId?: () => string
}

/**
 * Owns the grid's column definitions as STATE so they can be added, renamed,
 * retyped, reordered, and removed at runtime. Opt-in: a grid with a fixed
 * column set never uses this. Pass `.columnIds` to `useDataGrid` and build your
 * TanStack `tableColumns` from `.columns`; drop `<DataGridColumns value={…}>`
 * around the table to wire the header menu + add-column button.
 */
export function useGridColumns({
  initialColumns,
  makeColumnId,
}: UseGridColumnsOptions): GridColumnsApi {
  // Drop any column that shadows the reserved `id` key (would corrupt row.id).
  const [columns, setColumns] = React.useState<GridColumnSpec[]>(() =>
    initialColumns.filter(c => c.id !== RESERVED_COLUMN_ID),
  )

  const idRef = React.useRef(0)
  const mintId = React.useCallback(
    () => makeColumnId?.() ?? `newcol_${idRef.current++}`,
    [makeColumnId],
  )
  // Monotonic default-label counter. Reading `columns.length` would be stale
  // across a batch of synchronous addColumn calls (state updates are async), so
  // rapid back-to-back adds would collide on the same "Column N"; a ref doesn't.
  const labelIndexRef = React.useRef(initialColumns.length)

  const addColumn = React.useCallback<GridColumnsApi["addColumn"]>(
    (spec, atIndex) => {
      // Resolve id + label UP FRONT so the returned column matches exactly what
      // gets inserted. A spec that shadows the reserved `id` key is remapped.
      const created: GridColumnSpec = {
        id: spec?.id && spec.id !== RESERVED_COLUMN_ID ? spec.id : mintId(),
        label: spec?.label || `Column ${(labelIndexRef.current += 1)}`,
        type: spec?.type ?? "text",
        ...(spec?.width !== undefined ? { width: spec.width } : {}),
        ...(spec?.options !== undefined ? { options: spec.options } : {}),
      }
      setColumns(prev => {
        const at =
          atIndex === undefined
            ? prev.length
            : Math.max(0, Math.min(atIndex, prev.length))
        const copy = prev.slice()
        copy.splice(at, 0, created)
        return copy
      })
      return created
    },
    [mintId],
  )

  const removeColumn = React.useCallback((id: string) => {
    setColumns(prev =>
      prev.length <= 1 ? prev : prev.filter(c => c.id !== id),
    )
  }, [])

  const renameColumn = React.useCallback((id: string, label: string) => {
    setColumns(prev => prev.map(c => (c.id === id ? { ...c, label } : c)))
  }, [])

  const setColumnType = React.useCallback<GridColumnsApi["setColumnType"]>(
    (id, type, extra) => {
      setColumns(prev =>
        prev.map(c =>
          c.id === id ? { ...c, type, options: extra?.options } : c,
        ),
      )
    },
    [],
  )

  const moveColumn = React.useCallback((id: string, dir: -1 | 1) => {
    setColumns(prev => {
      const i = prev.findIndex(c => c.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const copy = prev.slice()
      const [moved] = copy.splice(i, 1)
      copy.splice(j, 0, moved!)
      return copy
    })
  }, [])

  const reorderColumns = React.useCallback((orderedIds: string[]) => {
    setColumns(prev => {
      const rank = new Map(orderedIds.map((id, i) => [id, i]))
      // Stable sort by the requested rank; unlisted ids keep their order last.
      return prev
        .map((c, i) => ({ c, i }))
        .sort((a, b) => {
          const ra = rank.get(a.c.id)
          const rb = rank.get(b.c.id)
          if (ra === undefined && rb === undefined) return a.i - b.i
          if (ra === undefined) return 1
          if (rb === undefined) return -1
          return ra - rb
        })
        .map(({ c }) => c)
    })
  }, [])

  const columnIds = React.useMemo(() => columns.map(c => c.id), [columns])

  return React.useMemo(
    () => ({
      columns,
      columnIds,
      addColumn,
      removeColumn,
      renameColumn,
      setColumnType,
      moveColumn,
      reorderColumns,
    }),
    [
      columns,
      columnIds,
      addColumn,
      removeColumn,
      renameColumn,
      setColumnType,
      moveColumn,
      reorderColumns,
    ],
  )
}
