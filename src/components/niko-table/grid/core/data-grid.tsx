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

import { TooltipProvider } from "@/components/ui/tooltip"

import { useDataTable } from "../../core/data-table-context"
import { useDataTableScroll } from "../../hooks/use-data-table-scroll"
import type { UseDataGrid } from "../hooks/use-data-grid"
import { useGridKeyboard } from "../hooks/use-grid-keyboard"
import { useGridNavigation } from "../hooks/use-grid-navigation"
import {
  emptyCell,
  type CellPosition,
  type CellState,
  type GridRow,
  type SelectionBounds,
} from "../types/grid-cell"
import { DataGridContextProvider } from "./data-grid-context"
import {
  DataGridFeaturesProvider,
  DataGridInternalsProvider,
  GRID_EDGE_SPEED,
  GRID_EDGE_ZONE,
  type DataGridInternals,
  type GridEnv,
  type GridFeatures,
  type RegisterGridFeature,
} from "./data-grid-features"

export interface DataGridProps<TRow extends GridRow> {
  grid: UseDataGrid<TRow>
  children: React.ReactNode
  className?: string
  /**
   * Called when the user presses `?` (with a focused cell, not editing) — wire
   * it to open a keyboard-shortcuts help dialog. When unset, `?` types normally.
   */
  onRequestShortcuts?: () => void
}

/**
 * The DataGrid container — the irreducible core. Place INSIDE `DataTableRoot`,
 * wrapping the `DataTable`. It reads the table's DISPLAY order (post
 * filter/sort) and owns the selection rectangle, keyboard navigation, drag
 * range-select, and the scroll-into-view seam. Cells (addressed by row id)
 * read their state from `DataGridContext`.
 *
 * Everything else is opt-in, composable children (mix and match — an unmounted
 * feature attaches no listeners and tree-shakes out of the bundle):
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridClipboard resolveCell={resolveCell} />  // copy/cut/paste
 *   <DataGridFillHandle />                           // corner-drag fill
 *   <DataGridMove />                                 // border-drag move/copy
 *   <DataGridCrossHighlight />                       // header/gutter highlight
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */

// Radix's TooltipProvider reads `delayDuration`, Base UI's reads `delay`;
// spread so it typechecks in both shadcn generations.
const gridTooltipDelay = { delayDuration: 0, delay: 0 }

export function DataGrid<TRow extends GridRow>({
  grid,
  children,
  className,
  onRequestShortcuts,
}: DataGridProps<TRow>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const { scrollRowIntoView } = useDataTableScroll()
  const { table } = useDataTable<TRow>()

  // Display order (post filter/sort) — the source of truth for navigation.
  // `row.index` is the row's SOURCE (data-array) position, which diverges from
  // its display position once the table is sorted or filtered — so we build the
  // id→DISPLAY-index map from `rows` array positions. Memoized on the row-model
  // identity: it rebuilds only when the model actually changes (incl. per edit),
  // not on unrelated renders.
  const rowModel = table.getRowModel()
  const orderedRows = rowModel.rows
  const displayIndexById = React.useMemo(() => {
    const map = new Map<string, number>()
    orderedRows.forEach((r, i) => map.set(r.id, i))
    return map
  }, [orderedRows])
  const displayIndexOf = React.useCallback(
    (id: string): number | undefined => displayIndexById.get(id),
    [displayIndexById],
  )

  const { focusedCell, editingCell, selectionAnchor } = grid

  // Display-space COLUMNS: the engine's editable columns filtered + ordered by
  // what the table actually renders (visibility, pinning, column order). Keeps
  // keyboard traversal, selection bounds, and paste targeting aligned with the
  // mounted cells when the user hides or pins columns via the header menus.
  const { columnVisibility, columnOrder, columnPinning } = table.getState()
  const gridColumnIds = grid.columnIds
  const columnIds = React.useMemo(() => {
    const editable = new Set(gridColumnIds)
    return table
      .getVisibleLeafColumns()
      .map(c => c.id)
      .filter(id => editable.has(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visibility/order/pinning are the reactive inputs behind getVisibleLeafColumns()
  }, [table, gridColumnIds, columnVisibility, columnOrder, columnPinning])

  // Selection rectangle in DISPLAY space.
  const selectionBounds = React.useMemo<SelectionBounds | null>(() => {
    if (!focusedCell) return null
    const anchor = selectionAnchor ?? focusedCell
    const aRow = displayIndexOf(anchor.rowId)
    const fRow = displayIndexOf(focusedCell.rowId)
    if (aRow === undefined || fRow === undefined) return null
    const aCol = columnIds.indexOf(anchor.columnId)
    const fCol = columnIds.indexOf(focusedCell.columnId)
    // Hidden / reordered-away columns yield -1 — never treat that as a bound.
    if (aCol < 0 || fCol < 0) return null
    return {
      minRow: Math.min(aRow, fRow),
      maxRow: Math.max(aRow, fRow),
      minColIndex: Math.min(aCol, fCol),
      maxColIndex: Math.max(aCol, fCol),
    }
  }, [focusedCell, selectionAnchor, columnIds, displayIndexOf])

  // Drop focus when the focused row/column leaves the display model (filter,
  // hide column). Keeps Enter / type-to-edit from targeting a ghost cell.
  const deselect = grid.deselect
  React.useEffect(() => {
    if (!focusedCell) return
    const rowGone = displayIndexOf(focusedCell.rowId) === undefined
    const colGone = columnIds.indexOf(focusedCell.columnId) < 0
    if (rowGone || colGone) deselect()
  }, [focusedCell, displayIndexOf, columnIds, deselect])

  // --- opt-in features (registered by mounted children) -------------------
  const [features, setFeatures] = React.useState<GridFeatures>({})
  const registerFeature = React.useCallback<RegisterGridFeature>(
    (key, payload) => {
      setFeatures(prev =>
        prev[key] === payload ? prev : { ...prev, [key]: payload },
      )
    },
    [],
  )

  // --- scroll-into-view seam ---------------------------------------------
  // Coarse vertical scroll (for far-off rows that aren't rendered yet) goes
  // through the virtualizer's `scrollToIndex`. Then we fine-tune BOTH axes from
  // the focused cell's real rect — the virtualizer's `align: "auto"` no-ops when
  // the target row is already rendered (within overscan) but below the visible
  // fold, so single-step arrow nav wouldn't scroll. Direct measurement fixes it,
  // and it mirrors exactly how the horizontal axis already worked.
  React.useLayoutEffect(() => {
    if (!focusedCell) return
    const idx = displayIndexOf(focusedCell.rowId)
    if (idx !== undefined) scrollRowIntoView(idx, { align: "auto" })

    // rAF so the row is mounted (after a virtualized vertical scroll) before we
    // measure its cell for the fine-grained adjustment.
    const raf = requestAnimationFrame(() => {
      const wrapper = wrapperRef.current
      const scrollEl = wrapper?.querySelector<HTMLElement>(
        '[data-slot="table-container"]',
      )
      const cellEl = wrapper?.querySelector<HTMLElement>(
        `[data-cell="${focusedCell.rowId}:${focusedCell.columnId}"]`,
      )
      if (!scrollEl || !cellEl) return
      const cont = scrollEl.getBoundingClientRect()
      const cell = cellEl.getBoundingClientRect()

      // Horizontal: sticky pins overlap the edges. Only LEFT-pinned cells have
      // a non-auto `left` — right pins are also sticky but must inset the
      // right edge (treating every sticky td as left used to yank scrollLeft).
      const rowEl = cellEl.closest("tr")
      let leftInset = 0
      let rightInset = 0
      rowEl?.querySelectorAll<HTMLElement>("td").forEach(td => {
        // The focused cell itself must not inset the scroll: a pinned focused
        // cell is already visible, and counting it would yank scrollLeft.
        if (td === cellEl) return
        const style = getComputedStyle(td)
        if (style.position !== "sticky") return
        const rect = td.getBoundingClientRect()
        if (style.left !== "auto") {
          leftInset = Math.max(leftInset, rect.right - cont.left)
        }
        if (style.right !== "auto") {
          rightInset = Math.max(rightInset, cont.right - rect.left)
        }
      })
      if (cell.left < cont.left + leftInset) {
        scrollEl.scrollLeft -= cont.left + leftInset - cell.left
      } else if (cell.right > cont.right - rightInset) {
        scrollEl.scrollLeft += cell.right - (cont.right - rightInset)
      }

      // Vertical: the sticky header overlaps the top edge — offset past it
      // (mirror of `leftInset`) so the focused row never hides under the header.
      const headerEl = scrollEl.querySelector<HTMLElement>("thead")
      const topInset = headerEl?.getBoundingClientRect().height ?? 0
      if (cell.top < cont.top + topInset) {
        scrollEl.scrollTop -= cont.top + topInset - cell.top
      } else if (cell.bottom > cont.bottom) {
        scrollEl.scrollTop += cell.bottom - cont.bottom
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [focusedCell, displayIndexOf, scrollRowIntoView])

  // --- navigation (display order) ----------------------------------------
  const nav = useGridNavigation({
    grid,
    orderedRows,
    columnIds,
    displayIndexOf,
    focusedCell,
    wrapperRef,
  })
  const { moveFocus, tabNext } = nav

  // Display index → the row's data (for lazy TSV serialization).
  const getDisplayRow = React.useCallback(
    (i: number): GridRow | undefined => orderedRows[i]?.original as GridRow,
    [orderedRows],
  )

  // --- selection actions (used by keyboard + GridRowMenu + features) ------
  const selectedRowIds = React.useCallback((): string[] => {
    if (!selectionBounds) return []
    const ids: string[] = []
    for (let r = selectionBounds.minRow; r <= selectionBounds.maxRow; r++) {
      const id = orderedRows[r]?.id
      if (id) ids.push(id)
    }
    return ids
  }, [selectionBounds, orderedRows])

  const clearSelection = React.useCallback(() => {
    if (!selectionBounds) return
    const ids = new Set(selectedRowIds())
    const { minColIndex, maxColIndex } = selectionBounds
    grid.updateRows(rows =>
      rows.map(row => {
        if (!ids.has(row.id)) return row
        const patched = { ...row } as TRow
        for (let c = minColIndex; c <= maxColIndex; c++) {
          const col = columnIds[c]
          if (col) (patched as GridRow)[col] = emptyCell<string>()
        }
        return patched
      }),
    )
  }, [selectionBounds, selectedRowIds, columnIds, grid])

  const deleteSelectedRows = React.useCallback(() => {
    const ids = selectedRowIds()
    if (ids.length > 0) grid.removeRows(ids)
  }, [selectedRowIds, grid])

  const insertRowsAbove = React.useCallback(() => {
    if (!selectionBounds) return
    const topId = orderedRows[selectionBounds.minRow]?.id
    const count = selectionBounds.maxRow - selectionBounds.minRow + 1
    if (topId) grid.insertRows(topId, "above", count)
  }, [selectionBounds, orderedRows, grid])

  const insertRowsBelow = React.useCallback(() => {
    if (!selectionBounds) return
    const bottomId = orderedRows[selectionBounds.maxRow]?.id
    const count = selectionBounds.maxRow - selectionBounds.minRow + 1
    if (bottomId) grid.insertRows(bottomId, "below", count)
  }, [selectionBounds, orderedRows, grid])

  // Select an entire column (header click) — top to bottom, that one column.
  // Clicking a column that's already fully selected deselects it (toggle).
  const selectColumn = React.useCallback(
    (columnId: string) => {
      if (orderedRows.length === 0) return
      const c = columnIds.indexOf(columnId)
      const b = selectionBounds
      const already =
        b != null &&
        b.minRow === 0 &&
        b.maxRow === orderedRows.length - 1 &&
        b.minColIndex === c &&
        b.maxColIndex === c
      if (already) {
        grid.deselect()
        return
      }
      grid.selectCell({ rowId: orderedRows[0]!.id, columnId })
      grid.extendSelectionTo({
        rowId: orderedRows[orderedRows.length - 1]!.id,
        columnId,
      })
    },
    [orderedRows, columnIds, selectionBounds, grid],
  )

  // Select an entire row (row-number click) — all columns, that one row.
  // Clicking a row that's already fully selected deselects it (toggle).
  const selectRow = React.useCallback(
    (rowId: string) => {
      if (columnIds.length === 0) return
      const r = displayIndexOf(rowId)
      const b = selectionBounds
      const already =
        b != null &&
        r != null &&
        b.minRow === r &&
        b.maxRow === r &&
        b.minColIndex === 0 &&
        b.maxColIndex === columnIds.length - 1
      if (already) {
        grid.deselect()
        return
      }
      grid.selectCell({ rowId, columnId: columnIds[0]! })
      grid.extendSelectionTo({
        rowId,
        columnId: columnIds[columnIds.length - 1]!,
      })
    },
    [columnIds, selectionBounds, displayIndexOf, grid],
  )

  // Fill every selected cell with one value (Ctrl/Cmd+Enter from an editor).
  const fillSelectionWith = React.useCallback(
    (cell: CellState<string>) => {
      if (!selectionBounds) return
      const ids = new Set(selectedRowIds())
      const { minColIndex, maxColIndex } = selectionBounds
      grid.updateRows(rows =>
        rows.map(row => {
          if (!ids.has(row.id)) return row
          const patched = { ...row } as TRow
          for (let c = minColIndex; c <= maxColIndex; c++) {
            const col = columnIds[c]
            if (col) (patched as GridRow)[col] = { ...cell }
          }
          return patched
        }),
      )
    },
    [selectionBounds, selectedRowIds, columnIds, grid],
  )

  // Latest values once-subscribed listeners / rAF loops read (shared with
  // feature components through the internals context).
  const envRef = React.useRef<GridEnv>({
    orderedRows: [],
    columnIds: [],
    displayIndexOf,
    grid: grid as unknown as UseDataGrid<GridRow>,
    selectionBounds: null,
  })
  envRef.current = {
    orderedRows,
    columnIds,
    displayIndexOf,
    grid: grid as unknown as UseDataGrid<GridRow>,
    selectionBounds,
  }

  // Select the whole display-space rectangle (fill/move land here after apply).
  const selectRange = React.useCallback((bounds: SelectionBounds) => {
    const env = envRef.current
    const anchorRowId = env.orderedRows[bounds.minRow]?.id
    const anchorColId = env.columnIds[bounds.minColIndex]
    const focusRowId = env.orderedRows[bounds.maxRow]?.id
    const focusColId = env.columnIds[bounds.maxColIndex]
    if (!anchorRowId || !anchorColId || !focusRowId || !focusColId) return
    env.grid.selectCell({ rowId: anchorRowId, columnId: anchorColId })
    env.grid.extendSelectionTo({ rowId: focusRowId, columnId: focusColId })
  }, [])

  // --- drag range-select --------------------------------------------------
  const draggingRef = React.useRef(false)
  const pointerRef = React.useRef({ x: 0, y: 0 })
  const rafRef = React.useRef<number | null>(null)

  const dragStep = React.useCallback(() => {
    if (!draggingRef.current) {
      rafRef.current = null
      return
    }
    const scrollEl = wrapperRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    )
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect()
      const { x, y } = pointerRef.current
      if (y < rect.top + GRID_EDGE_ZONE) scrollEl.scrollTop -= GRID_EDGE_SPEED
      else if (y > rect.bottom - GRID_EDGE_ZONE)
        scrollEl.scrollTop += GRID_EDGE_SPEED
      if (x < rect.left + GRID_EDGE_ZONE) scrollEl.scrollLeft -= GRID_EDGE_SPEED
      else if (x > rect.right - GRID_EDGE_ZONE)
        scrollEl.scrollLeft += GRID_EDGE_SPEED

      const attr = document
        .elementFromPoint(x, y)
        ?.closest("[data-cell]")
        ?.getAttribute("data-cell")
      if (attr) {
        const sep = attr.indexOf(":")
        grid.extendSelectionTo({
          rowId: attr.slice(0, sep),
          columnId: attr.slice(sep + 1),
        })
      }
    }
    rafRef.current = requestAnimationFrame(dragStep)
  }, [grid])

  // Is a cell inside the current selection rectangle (display space)?
  const isPosInSelection = React.useCallback(
    (pos: CellPosition): boolean => {
      if (!selectionBounds) return false
      const r = displayIndexOf(pos.rowId)
      if (r === undefined) return false
      const c = columnIds.indexOf(pos.columnId)
      return (
        r >= selectionBounds.minRow &&
        r <= selectionBounds.maxRow &&
        c >= selectionBounds.minColIndex &&
        c <= selectionBounds.maxColIndex
      )
    },
    [selectionBounds, displayIndexOf, columnIds],
  )

  const onCellMouseDown = React.useCallback(
    (pos: CellPosition, e: React.MouseEvent) => {
      // A cell editor (date calendar, combobox, etc.) portals its content out of
      // this cell's DOM, but React events still bubble through the React tree to
      // this handler. A mousedown INSIDE an open editor must NOT reselect the
      // cell — `selectCell` clears `editingCell`, unmounting the editor before
      // its own click / onSelect fires, so picking a value by mouse would
      // silently no-op. Editors mark their portaled surface with
      // `data-grid-cell-editor`.
      if (
        (e.target as HTMLElement | null)?.closest?.("[data-grid-cell-editor]")
      )
        return
      // Right-click: keep the selection if the cell is inside it (so the context
      // menu acts on the whole range, the standard behavior); otherwise move to the cell.
      // Never start a drag — let the context menu open.
      if (e.button === 2) {
        if (!isPosInSelection(pos)) grid.selectCell(pos)
        return
      }
      if (e.shiftKey) grid.extendSelectionTo(pos)
      else grid.selectCell(pos)
      // Seed the pointer from the mousedown itself — the drag rAF may run
      // before the first mousemove, and a stale pointer would extend the
      // selection toward wherever the cursor last was.
      pointerRef.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = true
      if (rafRef.current == null)
        rafRef.current = requestAnimationFrame(dragStep)
    },
    [grid, dragStep, isPosInSelection],
  )

  const onCellMouseEnter = React.useCallback(
    (pos: CellPosition) => {
      if (draggingRef.current) grid.extendSelectionTo(pos)
    },
    [grid],
  )

  // Core listeners: track the pointer (shared with features through
  // `pointerRef`), end a drag range-select, and clear the selection on a
  // click OUTSIDE the grid (clicking away deselects, the standard behavior). Feature
  // components (fill, move) attach their own drag-scoped listeners only while
  // their drag is active.
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      draggingRef.current = false
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    const onDocDown = (e: MouseEvent) => {
      const wrapper = wrapperRef.current
      const target = e.target as HTMLElement | null
      if (!wrapper || !target) return
      // Inside the grid → keep the selection.
      if (wrapper.contains(target)) return
      // Inside a portaled grid surface (menu / dialog / popover / cell editor)
      // → keep it too, so acting on the selection doesn't clear it first.
      if (
        target.closest(
          '[role="menu"],[role="dialog"],[data-slot*="menu"],[data-slot*="dialog"],[data-slot*="popover"],[data-grid-cell-editor]',
        )
      ) {
        return
      }
      grid.deselect()
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("mousedown", onDocDown, true)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("mousedown", onDocDown, true)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- grid.deselect is stable; mount-once listeners
  }, [])

  // --- keyboard model -----------------------------------------------------
  // The scoped keydown state machine (see `use-grid-keyboard.ts`). Escape also
  // clears the clipboard feature's copy marker when that feature is mounted.
  const onKeyDownCapture = useGridKeyboard({
    grid,
    nav,
    focusedCell,
    editingCell,
    displayIndexOf,
    rowCount: orderedRows.length,
    columnCount: columnIds.length,
    clearSelection,
    clearCopiedRange: features.clipboard?.clearCopiedRange,
    onRequestShortcuts,
  })

  const contextValue = React.useMemo(
    () => ({
      grid,
      selectionBounds,
      columnIds,
      displayIndexOf,
      onCellMouseDown,
      onCellMouseEnter,
      moveFocus,
      tabNext,
      clearSelection,
      deleteSelectedRows,
      insertRowsAbove,
      insertRowsBelow,
      selectColumn,
      selectRow,
      fillSelectionWith,
      hasSelection: selectionBounds !== null,
    }),
    [
      grid,
      selectionBounds,
      columnIds,
      displayIndexOf,
      onCellMouseDown,
      onCellMouseEnter,
      moveFocus,
      tabNext,
      clearSelection,
      deleteSelectedRows,
      insertRowsAbove,
      insertRowsBelow,
      selectColumn,
      selectRow,
      fillSelectionWith,
    ],
  )

  const internals = React.useMemo<DataGridInternals>(
    () => ({
      grid: grid as unknown as UseDataGrid<GridRow>,
      selectionBounds,
      orderedRows,
      columnIds,
      displayIndexOf,
      getDisplayRow,
      selectRange,
      clearSelection,
      wrapperRef,
      pointerRef,
      envRef,
    }),
    [
      grid,
      selectionBounds,
      orderedRows,
      columnIds,
      displayIndexOf,
      getDisplayRow,
      selectRange,
      clearSelection,
    ],
  )

  return (
    <TooltipProvider {...gridTooltipDelay}>
      <DataGridContextProvider value={contextValue}>
        <DataGridInternalsProvider value={internals}>
          <DataGridFeaturesProvider
            features={features}
            register={registerFeature}
          >
            <div
              ref={wrapperRef}
              role="grid"
              tabIndex={0}
              onKeyDownCapture={onKeyDownCapture}
              className={className ?? "outline-none"}
            >
              {children}
            </div>
          </DataGridFeaturesProvider>
        </DataGridInternalsProvider>
      </DataGridContextProvider>
    </TooltipProvider>
  )
}
