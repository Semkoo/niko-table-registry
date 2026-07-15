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
import { cn } from "@/lib/utils"
import * as React from "react"

import type { CellEditorProps } from "../cells/cell-props"
import type { UseDataGrid } from "../hooks/use-data-grid"
import {
  type CellPosition,
  type CellState,
  type GridRow,
  type SelectionBounds,
  emptyCell,
  isCellInBounds,
} from "../types/grid-cell"
import { useDataGridFeatures } from "./data-grid-features"

// ---------------------------------------------------------------------------
// Context — the CORE container provides the engine, the display-space
// selection rectangle, navigation, and selection actions to cells + menus.
// Opt-in capabilities (clipboard, fill, move, cross-highlight) publish through
// the separate features context — see `data-grid-features.tsx`.
// ---------------------------------------------------------------------------

export interface DataGridContextValue<TRow extends GridRow> {
  grid: UseDataGrid<TRow>
  /** Selection rectangle in DISPLAY space (post filter/sort). */
  selectionBounds: SelectionBounds | null
  /**
   * Editable columns in DISPLAY order — the engine's columns filtered/ordered
   * by the table's visibility, pinning, and column order.
   */
  columnIds: readonly string[]
  /**
   * Map a row id → its index in the current display order (post filter/sort).
   * Prefer this over TanStack's `row.index`, which is the source-data index.
   */
  displayIndexOf: (rowId: string) => number | undefined
  /** Mouse-down on a cell: focus (or shift-extend) + begin a drag-select. */
  onCellMouseDown: (pos: CellPosition, e: React.MouseEvent) => void
  /** Mouse-enter on a cell while dragging: extend the selection. */
  onCellMouseEnter: (pos: CellPosition) => void
  /** Move the active cell in DISPLAY order (arrows). */
  moveFocus: (deltaRow: number, deltaCol: number, extend?: boolean) => void
  /** Tab to the next/previous cell in display order (appends a row off the end). */
  tabNext: (reverse: boolean) => void
  // Selection actions (display-order aware — implemented by the container).
  clearSelection: () => void
  deleteSelectedRows: () => void
  insertRowsAbove: () => void
  insertRowsBelow: () => void
  /** Select the whole column (top to bottom). */
  selectColumn: (columnId: string) => void
  /** Select the whole row (all columns). */
  selectRow: (rowId: string) => void
  /** Fill every selected cell with one value (Ctrl/Cmd+Enter). */
  fillSelectionWith: (next: CellState<string>) => void
  hasSelection: boolean
}

const MISSING = Symbol("no-data-grid-context")
const DataGridContext = React.createContext<
  DataGridContextValue<GridRow> | typeof MISSING
>(MISSING)

export function DataGridContextProvider<TRow extends GridRow>({
  value,
  children,
}: {
  value: DataGridContextValue<TRow>
  children: React.ReactNode
}) {
  return (
    <DataGridContext.Provider
      value={value as unknown as DataGridContextValue<GridRow>}
    >
      {children}
    </DataGridContext.Provider>
  )
}

export function useDataGridContext<
  TRow extends GridRow,
>(): DataGridContextValue<TRow> {
  const ctx = React.useContext(DataGridContext)
  if (ctx === MISSING) {
    throw new Error("useDataGridContext must be used within <DataGrid>")
  }
  return ctx as unknown as DataGridContextValue<TRow>
}

// ---------------------------------------------------------------------------
// useGridCell — derive a cell's editor + wrapper props. Addressed by row id;
// selection membership tested against the display-space rectangle. Overlay
// geometry for OPT-IN features (copy outline, fill preview, move ghost) is
// derived only when the matching feature component is mounted.
// ---------------------------------------------------------------------------

/** Which sides of a cell sit on a rectangle's perimeter (else null). */
interface CopyEdges {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

/** The sides of `bounds`' perimeter this display cell sits on, or null. */
function edgesOf(
  bounds: SelectionBounds | null | undefined,
  displayIndex: number,
  colIndex: number,
): CopyEdges | null {
  if (!bounds || !isCellInBounds(bounds, displayIndex, colIndex)) return null
  return {
    top: displayIndex === bounds.minRow,
    bottom: displayIndex === bounds.maxRow,
    left: colIndex === bounds.minColIndex,
    right: colIndex === bounds.maxColIndex,
  }
}

export interface GridCellRender {
  editorProps: CellEditorProps
  wrapperProps: {
    "data-cell": string
    onMouseDown: (e: React.MouseEvent) => void
    onMouseEnter: () => void
    onDoubleClick: () => void
  }
  /** Copy-outline edges for this cell, or null (requires `<DataGridClipboard>`). */
  copyEdges: CopyEdges | null
  /** Bottom-right corner of the selection (requires `<DataGridFillHandle>`). */
  isFillCorner: boolean
  /** Fill-preview edges, or null (requires `<DataGridFillHandle>`). */
  fillEdges: CopyEdges | null
  /** Selection-perimeter grab edges, or null (requires `<DataGridMove>`). */
  selectionEdges: CopyEdges | null
  /** Drag-to-move ghost edges, or null (requires `<DataGridMove>`). */
  moveEdges: CopyEdges | null
}

export function useGridCell(
  row: GridRow,
  columnId: string,
  displayIndex?: number,
): GridCellRender {
  const {
    grid,
    onCellMouseDown,
    onCellMouseEnter,
    moveFocus,
    fillSelectionWith,
    displayIndexOf,
  } = useDataGridContext()
  const resolvedDisplayIndex = displayIndexOf(row.id) ?? displayIndex ?? 0
  const state = useGridCellState(row, columnId, resolvedDisplayIndex)
  const pos: CellPosition = { rowId: row.id, columnId }

  const editorProps: CellEditorProps = {
    cell: state.cell,
    isFocused: state.isFocused,
    isSelected: state.isSelected,
    isEditing: state.isEditing,
    editSeed: state.editSeed,
    onEditingChange: editing =>
      editing ? grid.startEditing(pos) : grid.stopEditing(),
    onCommit: next => grid.setCell(row.id, columnId, next),
    onFillSelection: fillSelectionWith,
    onMoveFocus: moveFocus,
  }

  return {
    editorProps,
    wrapperProps: {
      "data-cell": `${row.id}:${columnId}`,
      onMouseDown: e => onCellMouseDown(pos, e),
      onMouseEnter: () => onCellMouseEnter(pos),
      onDoubleClick: () => grid.startEditing(pos),
    },
    copyEdges: state.copyEdges,
    isFillCorner: state.isFillCorner,
    fillEdges: state.fillEdges,
    selectionEdges: state.selectionEdges,
    moveEdges: state.moveEdges,
  }
}

/** The per-cell visual state — everything the cell chrome derives per render. */
interface GridCellState {
  cell: CellState<string>
  isFocused: boolean
  isSelected: boolean
  isEditing: boolean
  editSeed: string | null
  copyEdges: CopyEdges | null
  isFillCorner: boolean
  fillEdges: CopyEdges | null
  selectionEdges: CopyEdges | null
  moveEdges: CopyEdges | null
}

function useGridCellState(
  row: GridRow,
  columnId: string,
  displayIndex: number,
): GridCellState {
  const { grid, selectionBounds, columnIds } = useDataGridContext()
  const features = useDataGridFeatures()

  const isFocused =
    grid.focusedCell?.rowId === row.id && grid.focusedCell.columnId === columnId
  const isEditing =
    grid.editingCell?.rowId === row.id && grid.editingCell.columnId === columnId
  // DISPLAY-space column index (respects hiding/pinning/reorder).
  const colIndex = columnIds.indexOf(columnId)
  const isSelected = isCellInBounds(selectionBounds, displayIndex, colIndex)

  // Fill-handle anchor: the selection's bottom-right corner (opt-in).
  const isFillCorner =
    !!features.fill &&
    !!selectionBounds &&
    displayIndex === selectionBounds.maxRow &&
    colIndex === selectionBounds.maxColIndex

  // Fill-preview perimeter (only while dragging the fill handle).
  const fillEdges = features.fill
    ? edgesOf(features.fill.fillBounds, displayIndex, colIndex)
    : null

  // Selection perimeter — the sides a drag-to-move grab zone is drawn on.
  const selectionEdges =
    features.move && isSelected
      ? edgesOf(selectionBounds, displayIndex, colIndex)
      : null

  // Drag-to-move ghost perimeter (where the block will land on release).
  const moveEdges = features.move
    ? edgesOf(features.move.moveBounds, displayIndex, colIndex)
    : null

  // Copy outline: a cell in the copied rectangle draws a dashed border on the
  // sides that lie on the rectangle's perimeter, forming one continuous outline.
  const copiedRange = features.clipboard?.copiedRange ?? null
  const copyEdges: CopyEdges | null =
    copiedRange &&
    copiedRange.rowIds.has(row.id) &&
    copiedRange.columnIds.has(columnId)
      ? {
          top: copiedRange.firstRowId === row.id,
          bottom: copiedRange.lastRowId === row.id,
          left: copiedRange.firstColumnId === columnId,
          right: copiedRange.lastColumnId === columnId,
        }
      : null

  const cell =
    (row[columnId] as CellState<string> | undefined) ?? emptyCell<string>()

  return {
    cell,
    isFocused,
    isSelected,
    isEditing,
    editSeed: isEditing ? grid.editSeed : null,
    copyEdges,
    isFillCorner,
    fillEdges,
    selectionEdges,
    moveEdges,
  }
}

// ---------------------------------------------------------------------------
// DataGridCell — per-cell chrome: data-cell attr, mouse handlers, feature
// overlays, and moving DOM focus onto the active cell (fires when the row
// mounts, so it works with virtualization). Feature overlays render only when
// the matching opt-in component is mounted inside <DataGrid>.
//
// PERF: the grid context changes on every focus move, which re-runs this
// component for EVERY mounted cell (hundreds when virtualized). The state
// derivation above is a handful of comparisons — cheap — but reconciling each
// cell's editor subtree is not. So the actual DOM lives in a memoized inner
// component fed only value-comparable props + identity-stable handlers (the
// latest-ref pattern): per keystroke, only the handful of cells whose visual
// state changed re-render; the rest stop at the memo.
// ---------------------------------------------------------------------------

/** Identity-stable handlers a cell hands to its wrapper + editor. */
interface StableCellHandlers {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onDoubleClick: () => void
  onEditingChange: (editing: boolean) => void
  onCommit: (next: CellState<string>) => void
  onFillSelection: (next: CellState<string>) => void
  onMoveFocus: (deltaRow: number, deltaCol: number, extend?: boolean) => void
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  onFillHandleDoubleClick: () => void
  onSelectionMoveMouseDown: (e: React.MouseEvent) => void
}

function edgesEqual(a: CopyEdges | null, b: CopyEdges | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.top === b.top &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.left === b.left
  )
}

interface DataGridCellInnerProps {
  dataCell: string
  state: GridCellState
  /** The fill handle is rendered (feature mounted + corner cell). */
  showFillHandle: boolean
  /** The drag-to-move grab strips are rendered (feature mounted). */
  showMoveStrips: boolean
  handlers: StableCellHandlers
  children: (props: CellEditorProps) => React.ReactNode
}

function cellInnerPropsEqual(
  prev: DataGridCellInnerProps,
  next: DataGridCellInnerProps,
): boolean {
  const a = prev.state
  const b = next.state
  return (
    prev.dataCell === next.dataCell &&
    prev.showFillHandle === next.showFillHandle &&
    prev.showMoveStrips === next.showMoveStrips &&
    prev.handlers === next.handlers &&
    prev.children === next.children &&
    a.cell === b.cell &&
    a.isFocused === b.isFocused &&
    a.isSelected === b.isSelected &&
    a.isEditing === b.isEditing &&
    a.editSeed === b.editSeed &&
    a.isFillCorner === b.isFillCorner &&
    edgesEqual(a.copyEdges, b.copyEdges) &&
    edgesEqual(a.fillEdges, b.fillEdges) &&
    edgesEqual(a.selectionEdges, b.selectionEdges) &&
    edgesEqual(a.moveEdges, b.moveEdges)
  )
}

const DataGridCellInner = React.memo(function DataGridCellInner({
  dataCell,
  state,
  showFillHandle,
  showMoveStrips,
  handlers: h,
  children,
}: DataGridCellInnerProps) {
  const {
    cell,
    isFocused,
    isSelected,
    isEditing,
    editSeed,
    copyEdges,
    fillEdges,
    selectionEdges,
    moveEdges,
  } = state
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (!isFocused || isEditing) return
    const el = ref.current?.querySelector<HTMLElement>("input, button")
    if (el && !el.contains(document.activeElement)) {
      el.focus({ preventScroll: true })
    }
  }, [isFocused, isEditing])

  const editorProps: CellEditorProps = {
    cell,
    isFocused,
    isSelected,
    isEditing,
    editSeed,
    onEditingChange: h.onEditingChange,
    onCommit: h.onCommit,
    onFillSelection: h.onFillSelection,
    onMoveFocus: h.onMoveFocus,
  }

  return (
    <div
      ref={ref}
      className="relative h-full w-full"
      data-cell={dataCell}
      onMouseDown={h.onMouseDown}
      onMouseEnter={h.onMouseEnter}
      onDoubleClick={h.onDoubleClick}
    >
      {copyEdges && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[6] border-0 border-dashed border-primary",
            copyEdges.top && "border-t",
            copyEdges.right && "border-r",
            copyEdges.bottom && "border-b",
            copyEdges.left && "border-l",
          )}
        />
      )}
      {/* Fill-drag preview outline (dashed). */}
      {fillEdges && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[6] border-0 border-dashed border-primary",
            fillEdges.top && "border-t",
            fillEdges.right && "border-r",
            fillEdges.bottom && "border-b",
            fillEdges.left && "border-l",
          )}
        />
      )}
      {/* Drag-to-move ghost — where the block lands on release (solid outline +
          faint tint, distinct from the dashed fill/copy previews). */}
      {moveEdges && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[7] border-0 border-primary bg-primary/5",
            moveEdges.top && "border-t-2",
            moveEdges.right && "border-r-2",
            moveEdges.bottom && "border-b-2",
            moveEdges.left && "border-l-2",
          )}
        />
      )}
      {/* Active-cell (cursor) border — drawn as an overlay on the wrapper, NOT
          on the focusable control, so it can't be zeroed out by the control's
          own `:focus-visible` reset. Bold + brand-colored, grid-style. */}
      {isFocused && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[7] border-2 border-primary"
        />
      )}
      {/* Drag-to-move grab zones — thin strips along the selection's outer
          border. Hovering shows a move cursor; mouse-down drags the whole block
          to a new location (border-drag). Only on the perimeter so cell
          interior clicks still select/edit; suppressed while editing. The fill
          handle (below) sits above these at the bottom-right corner. */}
      {selectionEdges && showMoveStrips && !isEditing && (
        <>
          {selectionEdges.top && (
            <div
              onMouseDown={h.onSelectionMoveMouseDown}
              className="absolute top-0 right-0 left-0 z-[8] h-1.5 cursor-move"
            />
          )}
          {selectionEdges.bottom && (
            <div
              onMouseDown={h.onSelectionMoveMouseDown}
              className="absolute right-0 bottom-0 left-0 z-[8] h-1.5 cursor-move"
            />
          )}
          {selectionEdges.left && (
            <div
              onMouseDown={h.onSelectionMoveMouseDown}
              className="absolute top-0 bottom-0 left-0 z-[8] w-1.5 cursor-move"
            />
          )}
          {selectionEdges.right && (
            <div
              onMouseDown={h.onSelectionMoveMouseDown}
              className="absolute top-0 right-0 bottom-0 z-[8] w-1.5 cursor-move"
            />
          )}
        </>
      )}
      {/* Fill handle — the small square at the selection's bottom-right corner.
          Drag to fill (down or across); double-click to auto-fill down. Sits
          FLUSH INSIDE the cell corner: the body `<td>` is `overflow-hidden`, so a
          handle hanging outside (negative offsets) would be clipped and unusable.
          A larger transparent hit-area wraps the visible 8px square so it's easy
          to grab on either the bottom edge (fill down) or right edge (fill across). */}
      {state.isFillCorner && showFillHandle && (
        <div
          onMouseDown={h.onFillHandleMouseDown}
          onDoubleClick={e => {
            e.stopPropagation()
            h.onFillHandleDoubleClick()
          }}
          className="group/fill absolute right-0 bottom-0 z-[9] flex size-3.5 cursor-crosshair items-end justify-end"
          aria-label="Fill handle — drag to fill the selection"
        >
          <div className="size-2 rounded-[1px] border border-background bg-primary shadow-sm transition-transform group-hover/fill:scale-125" />
        </div>
      )}
      {children(editorProps)}
    </div>
  )
}, cellInnerPropsEqual)

export function DataGridCell({
  row,
  columnId,
  displayIndex: displayIndexProp,
  children,
}: {
  row: GridRow
  columnId: string
  /**
   * Optional fallback. Prefer omitting — the cell resolves display index from
   * row id via the grid's display order, so sort/filter stay correct. Passing
   * TanStack's `row.index` (source-data index) will be ignored when the row is
   * still in the current display model.
   */
  displayIndex?: number
  children: (props: CellEditorProps) => React.ReactNode
}) {
  const {
    grid,
    onCellMouseDown,
    onCellMouseEnter,
    moveFocus,
    fillSelectionWith,
    displayIndexOf,
  } = useDataGridContext()
  const features = useDataGridFeatures()
  const displayIndex = displayIndexOf(row.id) ?? displayIndexProp ?? 0
  const state = useGridCellState(row, columnId, displayIndex)

  // Latest-ref + one stable handler set per cell instance. The handlers read
  // through the ref, so their identity never changes and the memoized inner
  // keeps holding while the grid context churns on every focus move.
  const latest = React.useRef({
    grid,
    features,
    onCellMouseDown,
    onCellMouseEnter,
    moveFocus,
    fillSelectionWith,
    rowId: row.id,
    columnId,
  })
  latest.current = {
    grid,
    features,
    onCellMouseDown,
    onCellMouseEnter,
    moveFocus,
    fillSelectionWith,
    rowId: row.id,
    columnId,
  }

  const handlers = React.useMemo<StableCellHandlers>(() => {
    const posOf = () => ({
      rowId: latest.current.rowId,
      columnId: latest.current.columnId,
    })
    return {
      onMouseDown: e => latest.current.onCellMouseDown(posOf(), e),
      onMouseEnter: () => latest.current.onCellMouseEnter(posOf()),
      onDoubleClick: () => latest.current.grid.startEditing(posOf()),
      onEditingChange: editing =>
        editing
          ? latest.current.grid.startEditing(posOf())
          : latest.current.grid.stopEditing(),
      onCommit: next =>
        latest.current.grid.setCell(
          latest.current.rowId,
          latest.current.columnId,
          next,
        ),
      onFillSelection: next => latest.current.fillSelectionWith(next),
      onMoveFocus: (dRow, dCol, extend) =>
        latest.current.moveFocus(dRow, dCol, extend),
      onFillHandleMouseDown: e =>
        latest.current.features.fill?.onFillHandleMouseDown(e),
      onFillHandleDoubleClick: () =>
        latest.current.features.fill?.onFillHandleDoubleClick(),
      onSelectionMoveMouseDown: e =>
        latest.current.features.move?.onSelectionMoveMouseDown(e, posOf()),
    }
  }, [])

  return (
    <DataGridCellInner
      dataCell={`${row.id}:${columnId}`}
      state={state}
      showFillHandle={!!features.fill}
      showMoveStrips={!!features.move}
      handlers={handlers}
    >
      {children}
    </DataGridCellInner>
  )
}
