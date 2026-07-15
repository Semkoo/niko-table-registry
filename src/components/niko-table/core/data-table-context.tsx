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
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react"
import { useGeneratedOptions } from "../hooks/use-generated-options"
import type { DataTableColumnDef, DataTableInstance, Option } from "../types"

export type DataTableContextState = {
  isLoading: boolean
}

/** Alignment for `scrollRowIntoView`, mirroring TanStack Virtual's `align`. */
export type ScrollAlign = "auto" | "start" | "center" | "end"

/** Scroll a row into view by its position in the current row model. */
export type ScrollRowIntoView = (
  index: number,
  opts?: { align?: ScrollAlign },
) => void

/**
 * The active-selection SPAN for a grid-style cross-highlight — EVERY column
 * and row in the current selection lights up (header + gutter), not just the
 * focused cell. Grid-agnostic: the editable grid sets it from its selection
 * rectangle. `null` disables the highlight (the default for read-only tables).
 *
 * Columns are addressed by id (there are few and all render, so a Set is
 * cheap); rows by an inclusive row-model index range (rows are virtualized, so
 * a Set of ids would be unbounded for a large selection — the body tests each
 * visible row's `index` against the range in O(1)).
 */
export interface ActiveSelection {
  /** Ids of columns whose header should highlight. */
  columnIds: ReadonlySet<string>
  /** Inclusive row-model index range whose rows/gutter should highlight. */
  rowRange: { min: number; max: number }
}
export type ActiveCell = ActiveSelection | null

export interface FlashRowsOptions {
  /** How long the highlight lasts, ms. Default 1400. */
  durationMs?: number
  /** Scroll the first flashed row into view first. Default true. */
  scrollIntoView?: boolean
}

/**
 * Briefly highlight rows (by id) so users see what just changed — e.g. after a
 * mutation ("which row did adding a member update?"). Scrolls the row into view
 * (reusing the virtualizer bridge) then plays a soft fade pulse. A row flash
 * lights every cell in the row (works even under pinned columns).
 */
export type FlashRows = (ids: string[], opts?: FlashRowsOptions) => void

/** A single cell target for `flashCells`. */
export interface FlashCellRef {
  rowId: string
  columnId: string
}

/**
 * Briefly highlight individual cells (cell-level, for value-level changes —
 * e.g. an inline edit or paste). Same fade pulse as `flashRows`, scoped to cells.
 */
export type FlashCells = (
  cells: FlashCellRef[],
  opts?: FlashRowsOptions,
) => void

/** Internal key for a flashing cell (row id + column id). */
export function flashCellKey(rowId: string, columnId: string): string {
  return `${rowId}:${columnId}`
}

type DataTableContextProps<TData> = DataTableContextState & {
  table: DataTableInstance<TData>
  columns: DataTableColumnDef<TData>[]
  generatedOptionsMap: Record<string, Option[]>
  setIsLoading: (isLoading: boolean) => void
  /** Ids of rows currently flashing (used by the body to animate them). */
  flashingRowIds: ReadonlySet<string>
  /** Keys (`flashCellKey`) of cells currently flashing. */
  flashingCellKeys: ReadonlySet<string>
  /** Flash rows by id — scroll into view + soft fade pulse. */
  flashRows: FlashRows
  /** Flash individual cells (value-level changes). */
  flashCells: FlashCells
  /**
   * Scroll a row into view. Works on virtualized bodies (via the virtualizer,
   * which registers itself) and plain bodies (DOM `scrollIntoView` fallback).
   * A stable, virtualizer-agnostic handle so consumers never touch the
   * virtualizer directly — the registry owner can change virtualization
   * internals without breaking consumers.
   */
  scrollRowIntoView: ScrollRowIntoView
  /**
   * Internal: the virtualized body registers its scroll function here on mount
   * and clears it (null) on unmount. Non-virtualized bodies never register, so
   * `scrollRowIntoView` falls back to a DOM query.
   */
  registerRowScroller: (fn: ScrollRowIntoView | null) => void
  /**
   * The table's scroll container (`<DataTable>`'s `[data-slot="table-container"]`
   * viewport). `<DataTable>` registers it on mount; opt-in features like
   * `<DataTableColumnAutoFit />` read it to measure/observe available width.
   * `null` until the container mounts (or when no `<DataTable>` is used).
   */
  scrollContainer: HTMLElement | null
  /** Internal: `<DataTable>` registers its scroll container element here. */
  registerScrollContainer: (el: HTMLElement | null) => void
  /**
   * Toggle a row's selection with standard Shift-range support: a plain
   * click toggles one row and sets the anchor; a Shift+click selects every row
   * between the anchor and this one (in current display order). Wire a select
   * checkbox to this instead of `row.toggleSelected()` to get range selection.
   */
  toggleRowSelection: (rowId: string, shiftKey: boolean) => void
}

// ---------------------------------------------------------------------------
// Active-cell cross-highlight — its OWN context pair, deliberately outside the
// main context value. The active cell changes on every keystroke in an
// editable grid; if it lived in the main value, every `useDataTable` consumer
// (toolbar, filters, header, body, empty states) would re-render per arrow
// key. Split out, only the header + body — the two subscribers — re-render,
// and read-only tables (where it stays `null`) never re-render at all.
// ---------------------------------------------------------------------------

const ActiveCellValueContext = createContext<ActiveCell>(null)
const ActiveCellSetterContext = createContext<
  ((cell: ActiveCell) => void) | null
>(null)

/**
 * The active-selection span for the grid-style cross-highlight (`null` when
 * inactive). In a header, `activeCell.columnIds.has(column.id)` lights the
 * active columns; in a body/gutter, the row's **display** index (position in
 * `getRowModel().rows` / the virtualizer index) within `activeCell.rowRange`
 * lights the active rows — not TanStack's source-data `row.index`.
 */
export function useDataTableActiveCell(): ActiveCell {
  return useContext(ActiveCellValueContext)
}

/**
 * Set (or clear, with `null`) the active-cell cross-highlight. The setter is
 * stable, so subscribing to it never causes re-renders. Used by the grid's
 * `<DataGridCrossHighlight>` opt-in.
 */
export function useDataTableActiveCellSetter(): (cell: ActiveCell) => void {
  const setter = useContext(ActiveCellSetterContext)
  if (setter === null) {
    throw new Error(
      "useDataTableActiveCellSetter must be used within DataTableRoot",
    )
  }
  return setter
}

// ---------------------------------------------------------------------------
// Column-resize preview context
// ---------------------------------------------------------------------------
// Resizing runs in `onEnd` mode: columns don't change width until the drag
// ends, so the memoized header/body never re-render mid-drag — that's what
// keeps resizing smooth on heavy (avatar/badge) tables. To still show a live
// guide line that follows the cursor, the provider publishes the in-flight
// resize offset here. Only `<ColumnResizePreviewLine>` subscribes, so nothing
// else in the table re-renders per pointer move.
// ---------------------------------------------------------------------------

export interface ColumnResizeInfo {
  /** Id of the column being dragged, or `null` when no resize is active. */
  resizingColumnId: string | null
  /** Pixel delta from the drag start (add to the column's right edge). */
  deltaOffset: number
}

const ColumnResizeInfoContext = createContext<ColumnResizeInfo>({
  resizingColumnId: null,
  deltaOffset: 0,
})

/**
 * Live column-resize offset for the preview guide line. Returns the idle value
 * (`{ resizingColumnId: null, deltaOffset: 0 }`) when no drag is in flight (or
 * outside a provider), so it's safe to call unconditionally.
 */
export function useColumnResizeInfo(): ColumnResizeInfo {
  return useContext(ColumnResizeInfoContext)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTableContext = createContext<DataTableContextProps<any> | undefined>(
  undefined,
)

export function useDataTable<TData>(): DataTableContextProps<TData> {
  const context = useContext(DataTableContext)
  if (context === undefined) {
    throw new Error("useDataTable must be used within DataTableRoot")
  }
  return context as DataTableContextProps<TData>
}

export enum DataTableActions {
  SET,
  SET_IS_LOADING,
}

type DataTableAction = {
  type: DataTableActions.SET_IS_LOADING
  value: boolean
}

function dataTableReducer(
  state: DataTableContextState,
  action: DataTableAction,
): DataTableContextState {
  switch (action.type) {
    case DataTableActions.SET_IS_LOADING:
      return { ...state, isLoading: action.value }
    default:
      return state
  }
}

function deriveInitialState(isLoading?: boolean): DataTableContextState {
  return {
    isLoading: isLoading ?? false,
  }
}

interface DataTableProviderProps<TData> {
  children: React.ReactNode
  table: DataTableInstance<TData>
  columns?: DataTableColumnDef<TData>[]
  isLoading?: boolean
}

/**
 * A set of currently-"flashing" string keys with per-key auto-expiry timers.
 * `flash(keys, durationMs)` adds them and removes each after its duration.
 * Shared by row flash (keys = row ids) and cell flash (keys = `flashCellKey`).
 */
function useFlashSet(): [
  ReadonlySet<string>,
  (keys: string[], durationMs: number) => void,
] {
  const [set, setSet] = React.useState<Set<string>>(() => new Set())
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  React.useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach(timer => clearTimeout(timer))
      t.clear()
    }
  }, [])
  const flash = useCallback((keys: string[], durationMs: number) => {
    if (keys.length === 0) return
    setSet(prev => {
      const next = new Set(prev)
      for (const k of keys) next.add(k)
      return next
    })
    for (const k of keys) {
      const existing = timers.current.get(k)
      if (existing) clearTimeout(existing)
      timers.current.set(
        k,
        setTimeout(() => {
          setSet(prev => {
            if (!prev.has(k)) return prev
            const next = new Set(prev)
            next.delete(k)
            return next
          })
          timers.current.delete(k)
        }, durationMs),
      )
    }
  }, [])
  return [set, flash]
}

export function DataTableProvider<TData>({
  children,
  table,
  columns,
  isLoading: externalIsLoading,
}: DataTableProviderProps<TData>) {
  const [state, dispatch] = useReducer(
    dataTableReducer,
    deriveInitialState(externalIsLoading),
  )

  const setIsLoading = useCallback((value: boolean) => {
    dispatch({
      type: DataTableActions.SET_IS_LOADING,
      value,
    })
  }, [])

  // Narrow, virtualizer-agnostic scroll bridge. The virtualized body registers
  // its `scrollToIndex` here; `scrollRowIntoView` calls through it, or falls
  // back to a DOM query for non-virtualized bodies. Both callbacks are stable.
  const rowScrollerRef = React.useRef<ScrollRowIntoView | null>(null)
  const registerRowScroller = useCallback((fn: ScrollRowIntoView | null) => {
    rowScrollerRef.current = fn
  }, [])

  // The scroll container is state (not a ref) so opt-in consumers like
  // `<DataTableColumnAutoFit />` re-run once it mounts. Set once on mount and
  // cleared on unmount by `<DataTable>`'s ref callback.
  const [scrollContainer, setScrollContainer] =
    React.useState<HTMLElement | null>(null)
  const registerScrollContainer = useCallback(
    (el: HTMLElement | null) => setScrollContainer(el),
    [],
  )
  const scrollRowIntoView = useCallback<ScrollRowIntoView>((index, opts) => {
    if (rowScrollerRef.current) {
      rowScrollerRef.current(index, opts)
      return
    }
    if (typeof document !== "undefined") {
      // Virtualized rows carry `data-index`; plain body rows carry
      // `data-row-index` — match either so the DOM fallback works for both.
      // Map the virtualizer-style `align` onto scrollIntoView's `block`.
      const block: ScrollLogicalPosition =
        opts?.align === undefined || opts.align === "auto"
          ? "nearest"
          : opts.align
      document
        .querySelector(`[data-index="${index}"], [data-row-index="${index}"]`)
        ?.scrollIntoView({ block })
    }
  }, [])

  // Row / cell flash — highlight-what-changed. Two identity sets (rows by id,
  // cells by `flashCellKey`) with per-key timers so overlapping flashes each get
  // their full duration; the body plays a fade pulse on matching cells.
  const [flashingRowIds, flashRowKeys] = useFlashSet()
  const [flashingCellKeys, flashCellKeys] = useFlashSet()

  // Active-cell cross-highlight (grid-style) — provided through its own
  // context pair (see above) so per-keystroke updates in an editable grid
  // don't churn the main context value. `setActiveCell` is stable.
  const [activeCell, setActiveCell] = React.useState<ActiveCell>(null)

  // Anchor for Shift-range row selection. Ref, not state — it's
  // read/written only inside the click handler, never rendered.
  const rowSelectionAnchorRef = React.useRef<string | null>(null)
  const toggleRowSelection = useCallback(
    (rowId: string, shiftKey: boolean) => {
      const model = table.getRowModel()
      const row = model.rowsById[rowId]
      if (!row) return
      const anchorId = rowSelectionAnchorRef.current
      if (shiftKey && anchorId != null && model.rowsById[anchorId]) {
        // Select every row between the anchor and this one in DISPLAY order.
        // Use positions in `model.rows` — TanStack's `row.index` is the
        // source-data index and diverges after sort/filter.
        const a = model.rows.findIndex(r => r.id === anchorId)
        const b = model.rows.findIndex(r => r.id === rowId)
        if (a === -1 || b === -1) return
        const next = { ...table.getState().rowSelection }
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          const r = model.rows[i]
          if (r?.getCanSelect()) next[r.id] = true
        }
        table.setRowSelection(next)
        return
      }
      row.toggleSelected()
      rowSelectionAnchorRef.current = rowId
    },
    [table],
  )

  const scrollFirstIdIntoView = useCallback(
    (ids: string[]) => {
      const model = table.getRowModel()
      for (const id of ids) {
        // Display index — `scrollRowIntoView` / the virtualizer speak display
        // space, not TanStack's source-data `row.index`.
        const idx = model.rows.findIndex(r => r.id === id)
        if (idx !== -1) {
          scrollRowIntoView(idx, { align: "center" })
          return
        }
      }
    },
    [table, scrollRowIntoView],
  )

  const flashRows = useCallback<FlashRows>(
    (ids, opts) => {
      if (ids.length === 0) return
      if (opts?.scrollIntoView ?? true) scrollFirstIdIntoView(ids)
      flashRowKeys(ids, opts?.durationMs ?? 1400)
    },
    [flashRowKeys, scrollFirstIdIntoView],
  )

  const flashCells = useCallback<FlashCells>(
    (cells, opts) => {
      if (cells.length === 0) return
      if (opts?.scrollIntoView ?? true)
        scrollFirstIdIntoView(cells.map(c => c.rowId))
      flashCellKeys(
        cells.map(c => flashCellKey(c.rowId, c.columnId)),
        opts?.durationMs ?? 1400,
      )
    },
    [flashCellKeys, scrollFirstIdIntoView],
  )

  /**
   * Derive `isLoading` at READ time, not via a sync useEffect.
   *
   * WHY: The previous pattern — `useEffect(() => setIsLoading(externalIsLoading))`
   * — is a "copy prop into state" anti-pattern. Under React 19 + Next.js 16
   * (Turbopack), it can schedule a reducer dispatch that lands on an unmounted
   * component instance during HMR or Strict Mode double-mount, producing:
   *
   *   "Can't perform a React state update on a component that hasn't mounted
   *   yet. This indicates that you have a side-effect in your render function
   *   that asynchronously tries to update the component."
   *
   * FIX: When `externalIsLoading` is provided it wins (matches the original
   * effect's intent); otherwise fall back to the reducer-managed state.
   * No cross-commit dispatch, no race, no unmount-target warning.
   *
   * BEHAVIOR NOTE: If a caller both passes `isLoading` as a prop AND calls
   * `setIsLoading()` from inside the tree, the prop wins and the internal
   * call becomes a no-op. This matches the documented contract of a
   * controlled prop and was already the intended behavior of the effect.
   */
  const effectiveIsLoading = externalIsLoading ?? state.isLoading

  // Table instance ref is stable across state changes — extract individual
  // state slices so context consumers re-render on filter/sort/select.
  const tableState = table.getState()

  const globalFilter = tableState.globalFilter
  const sorting = tableState.sorting
  const columnFilters = tableState.columnFilters
  const columnVisibility = tableState.columnVisibility
  const expanded = tableState.expanded
  const rowSelection = tableState.rowSelection
  const pagination = tableState.pagination
  const columnPinning = tableState.columnPinning
  const columnOrder = tableState.columnOrder
  const columnSizing = tableState.columnSizing

  // Lightweight state hash beats JSON.stringify for large selections
  // (~0.1ms vs 20-50ms at 1k rows) while still triggering consumer updates.
  const tableStateKey = React.useMemo(() => {
    // Full sorted-keys hash — a "first 3 keys" signature collided on
    // sequential row IDs (`r1,r2,r3` vs `r1,r2,r4`).
    const getObjectHash = (
      obj: Record<string, unknown> | undefined,
    ): string => {
      if (!obj) return "0"
      const keys = Object.keys(obj)
      if (keys.length === 0) return "0"
      return keys.sort().join(",")
    }

    const paginationKey = `${pagination.pageIndex ?? 0}:${pagination.pageSize ?? 0}`

    // Handle globalFilter - can be string or object (for complex filters)
    const globalFilterHash =
      typeof globalFilter === "string"
        ? globalFilter
        : globalFilter && typeof globalFilter === "object"
          ? getObjectHash(globalFilter)
          : ""

    return {
      globalFilter: globalFilterHash,
      sortingHash: JSON.stringify(sorting),
      columnFiltersHash: JSON.stringify(columnFilters),
      columnVisibilityHash: getObjectHash(
        columnVisibility as Record<string, unknown> | undefined,
      ),
      expandedHash: getObjectHash(
        expanded as Record<string, unknown> | undefined,
      ),
      rowSelectionHash: getObjectHash(
        rowSelection as Record<string, unknown> | undefined,
      ),
      paginationKey,
      columnPinningHash: JSON.stringify(columnPinning),
      columnOrderHash: JSON.stringify(columnOrder),
      // Column widths — so a resize re-runs the context value memo and the
      // memoized header/body pick up the new `column.getSize()`.
      columnSizingHash: JSON.stringify(columnSizing),
    }
  }, [
    globalFilter,
    sorting,
    columnFilters,
    columnVisibility,
    expanded,
    rowSelection,
    pagination,
    columnPinning,
    columnOrder,
    columnSizing,
  ])

  // Generate options for all select/multiSelect columns in a single pass.
  // This replaces N separate per-column scans in faceted filter consumers.
  const generatedOptionsMap = useGeneratedOptions(table)

  // Publish the in-flight resize offset for the preview guide line (see
  // ColumnResizeInfoContext). `columnSizingInfo` mutates every pointer move
  // during a drag; this provider re-renders with it (it owns no memo boundary),
  // but the memoized value below stays stable — only the preview line, which
  // reads this dedicated context, re-renders per frame.
  const columnSizingInfo = table.getState().columnSizingInfo
  const resizingColumnId = columnSizingInfo.isResizingColumn || null
  const resizeDeltaOffset = columnSizingInfo.deltaOffset ?? 0
  const columnResizeInfo = React.useMemo<ColumnResizeInfo>(
    () => ({ resizingColumnId, deltaOffset: resizeDeltaOffset }),
    [resizingColumnId, resizeDeltaOffset],
  )

  // Memoize so context consumers (10+ filter/action components) only re-render
  // when table, columns, loading, or actual table state changes.
  const value = React.useMemo(
    () =>
      ({
        table,
        columns:
          columns || (table.options.columns as DataTableColumnDef<TData>[]),
        isLoading: effectiveIsLoading,
        generatedOptionsMap,
        setIsLoading,
        scrollRowIntoView,
        registerRowScroller,
        scrollContainer,
        registerScrollContainer,
        flashingRowIds,
        flashingCellKeys,
        flashRows,
        flashCells,
        toggleRowSelection,
      }) as DataTableContextProps<TData>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tableStateKey is load-bearing for reactivity (see block comment above)
    [
      table,
      columns,
      effectiveIsLoading,
      generatedOptionsMap,
      setIsLoading,
      scrollRowIntoView,
      registerRowScroller,
      scrollContainer,
      registerScrollContainer,
      flashingRowIds,
      flashingCellKeys,
      flashRows,
      flashCells,
      toggleRowSelection,
      tableStateKey,
    ],
  )

  return (
    <DataTableContext.Provider value={value}>
      <ActiveCellSetterContext.Provider value={setActiveCell}>
        <ActiveCellValueContext.Provider value={activeCell}>
          <ColumnResizeInfoContext.Provider value={columnResizeInfo}>
            <style href="niko-row-flash" precedence="default">
              {ROW_FLASH_KEYFRAMES}
            </style>
            {children}
          </ColumnResizeInfoContext.Provider>
        </ActiveCellValueContext.Provider>
      </ActiveCellSetterContext.Provider>
    </DataTableContext.Provider>
  )
}

/**
 * Self-contained flash animation (no dependency on app globals). Soft fade
 * pulse: a primary-tinted background fades to transparent once, ~1.2s.
 */
const ROW_FLASH_KEYFRAMES = `@keyframes niko-row-flash {
  0% { background-color: color-mix(in oklab, var(--primary) 24%, transparent); }
  100% { background-color: transparent; }
}`

export { DataTableContext }
