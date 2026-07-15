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

import { useDataTableFlash } from "../../hooks/use-data-table-flash"
import {
  GRID_EDGE_SPEED,
  GRID_EDGE_ZONE,
  useDataGridInternals,
  useRegisterGridFeature,
  type FillFeature,
} from "../core/data-grid-features"
import { emptyCell } from "../types/grid-cell"
import type { CellState, SelectionBounds } from "../types/grid-cell"

/**
 * The fill rectangle while dragging the fill handle to a target cell. Single
 * axis (the standard behavior): extends the source selection toward the target on the
 * dominant axis only (down/up OR left/right).
 */
function computeFillBounds(
  source: SelectionBounds,
  targetRow: number,
  targetCol: number,
): SelectionBounds {
  const vert = Math.max(
    Math.max(0, targetRow - source.maxRow),
    Math.max(0, source.minRow - targetRow),
  )
  const horiz = Math.max(
    Math.max(0, targetCol - source.maxColIndex),
    Math.max(0, source.minColIndex - targetCol),
  )
  if (vert === 0 && horiz === 0) return source
  if (vert >= horiz) {
    return targetRow > source.maxRow
      ? { ...source, maxRow: targetRow }
      : { ...source, minRow: targetRow }
  }
  return targetCol > source.maxColIndex
    ? { ...source, maxColIndex: targetCol }
    : { ...source, minColIndex: targetCol }
}

/**
 * Opt-in fill handle for the grid — the small square at the selection's
 * bottom-right corner. Drag it to fill down/across (tiles the source values,
 * the standard behavior); double-click to auto-fill down to the last row. After a fill
 * the filled range becomes the selection (standard behavior). Drop it inside
 * `<DataGrid>`; leave it out and no handle renders and no fill code ships.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridFillHandle />
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */
export function DataGridFillHandle() {
  const { selectionBounds, wrapperRef, pointerRef, envRef, selectRange } =
    useDataGridInternals()
  const { flashCells } = useDataTableFlash()

  const [fillBounds, setFillBounds] = React.useState<SelectionBounds | null>(
    null,
  )
  const fillModeRef = React.useRef(false)
  const fillSourceRef = React.useRef<SelectionBounds | null>(null)
  const fillBoundsRef = React.useRef<SelectionBounds | null>(null)
  fillBoundsRef.current = fillBounds
  const fillRafRef = React.useRef<number | null>(null)
  const onUpRef = React.useRef<(() => void) | null>(null)

  // Copy the source selection's values into the fill extension (tiled), flash.
  const applyFill = React.useCallback(
    (source: SelectionBounds, fill: SelectionBounds) => {
      const env = envRef.current
      const srcRows = source.maxRow - source.minRow + 1
      const srcCols = source.maxColIndex - source.minColIndex + 1
      const patch = new Map<string, Record<string, CellState<string>>>()
      const flashed: { rowId: string; columnId: string }[] = []
      for (let r = fill.minRow; r <= fill.maxRow; r++) {
        for (let c = fill.minColIndex; c <= fill.maxColIndex; c++) {
          const inSource =
            r >= source.minRow &&
            r <= source.maxRow &&
            c >= source.minColIndex &&
            c <= source.maxColIndex
          if (inSource) continue
          const targetRowId = env.orderedRows[r]?.id
          const targetCol = env.columnIds[c]
          if (!targetRowId || !targetCol) continue
          const sr =
            source.minRow +
            ((((r - source.minRow) % srcRows) + srcRows) % srcRows)
          const sc =
            source.minColIndex +
            ((((c - source.minColIndex) % srcCols) + srcCols) % srcCols)
          const srcRow = env.orderedRows[sr]?.original
          const srcColId = env.columnIds[sc]
          if (!srcRow || !srcColId) continue
          const p = patch.get(targetRowId) ?? {}
          // Blank source cells may be unmaterialized (absent) — fall back to a
          // fresh empty cell so the destination always gets a valid CellState.
          const src = srcRow[srcColId] as CellState<string> | undefined
          p[targetCol] = src ? { ...src } : emptyCell<string>()
          patch.set(targetRowId, p)
          flashed.push({ rowId: targetRowId, columnId: targetCol })
        }
      }
      if (patch.size === 0) return
      env.grid.updateRows(rows =>
        rows.map(row => {
          const pp = patch.get(row.id)
          return pp ? { ...row, ...pp } : row
        }),
      )
      flashCells(flashed, { scrollIntoView: false })
    },
    [envRef, flashCells],
  )

  // rAF loop while dragging: track the pointer, live-preview the fill
  // rectangle, and auto-scroll at both axes' edges (a horizontal fill needs
  // horizontal auto-scroll just as a fill-down needs vertical).
  const fillStep = React.useCallback(() => {
    if (!fillModeRef.current) {
      fillRafRef.current = null
      return
    }
    const env = envRef.current
    const source = fillSourceRef.current
    const scrollEl = wrapperRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    )
    const { x, y } = pointerRef.current
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect()
      if (y < rect.top + GRID_EDGE_ZONE) scrollEl.scrollTop -= GRID_EDGE_SPEED
      else if (y > rect.bottom - GRID_EDGE_ZONE)
        scrollEl.scrollTop += GRID_EDGE_SPEED
      if (x < rect.left + GRID_EDGE_ZONE) scrollEl.scrollLeft -= GRID_EDGE_SPEED
      else if (x > rect.right - GRID_EDGE_ZONE)
        scrollEl.scrollLeft += GRID_EDGE_SPEED
    }
    const attr = document
      .elementFromPoint(x, y)
      ?.closest("[data-cell]")
      ?.getAttribute("data-cell")
    if (attr && source) {
      const sep = attr.indexOf(":")
      const tRow = env.displayIndexOf(attr.slice(0, sep))
      const tCol = env.columnIds.indexOf(attr.slice(sep + 1))
      if (tRow !== undefined && tCol >= 0) {
        setFillBounds(computeFillBounds(source, tRow, tCol))
      }
    }
    fillRafRef.current = requestAnimationFrame(fillStep)
  }, [envRef, pointerRef, wrapperRef])

  const onFillHandleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (!selectionBounds) return
      e.preventDefault()
      e.stopPropagation()
      // Seed the pointer — the rAF loop may run before the first mousemove.
      pointerRef.current = { x: e.clientX, y: e.clientY }
      fillSourceRef.current = selectionBounds
      fillModeRef.current = true
      setFillBounds(selectionBounds)
      if (fillRafRef.current == null)
        fillRafRef.current = requestAnimationFrame(fillStep)

      // Drag-scoped mouseup — attached only for the duration of this drag.
      const onUp = () => {
        onUpRef.current = null
        fillModeRef.current = false
        if (fillRafRef.current != null) {
          cancelAnimationFrame(fillRafRef.current)
          fillRafRef.current = null
        }
        const source = fillSourceRef.current
        const fill = fillBoundsRef.current
        if (source && fill) {
          applyFill(source, fill)
          selectRange(fill) // extend the selection over the fill, the standard behavior
        }
        setFillBounds(null)
        fillSourceRef.current = null
      }
      onUpRef.current = onUp
      window.addEventListener("mouseup", onUp, { once: true })
    },
    [selectionBounds, fillStep, applyFill, selectRange, pointerRef],
  )

  // Double-click the handle → auto-fill down to the grid's last row.
  const onFillHandleDoubleClick = React.useCallback(() => {
    const rowCount = envRef.current.orderedRows.length
    if (!selectionBounds || rowCount === 0) return
    const fill = { ...selectionBounds, maxRow: rowCount - 1 }
    if (fill.maxRow > selectionBounds.maxRow) {
      applyFill(selectionBounds, fill)
      selectRange(fill) // highlight the filled range, the standard behavior
    }
  }, [selectionBounds, envRef, applyFill, selectRange])

  // Unmount safety: cancel a drag in flight.
  React.useEffect(
    () => () => {
      if (fillRafRef.current != null) cancelAnimationFrame(fillRafRef.current)
      if (onUpRef.current) {
        window.removeEventListener("mouseup", onUpRef.current)
        onUpRef.current = null
      }
    },
    [],
  )

  const payload = React.useMemo<FillFeature>(
    () => ({ fillBounds, onFillHandleMouseDown, onFillHandleDoubleClick }),
    [fillBounds, onFillHandleMouseDown, onFillHandleDoubleClick],
  )
  useRegisterGridFeature("fill", payload)

  return null
}
