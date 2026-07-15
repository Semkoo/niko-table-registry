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
  clampGridIndex as clamp,
  useDataGridInternals,
  useRegisterGridFeature,
  type MoveFeature,
} from "../core/data-grid-features"
import {
  emptyCell,
  type CellPosition,
  type CellState,
  type SelectionBounds,
} from "../types/grid-cell"

/**
 * Opt-in drag-to-move for the grid (border-drag) — grab the selection's
 * outer border and drag the whole block to a new location. The values MOVE
 * (source clears); holding Ctrl/Cmd COPIES instead (toggleable mid-drag). Drop
 * it inside `<DataGrid>`; leave it out and no grab strips render and no move
 * code ships.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridMove />
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */
export function DataGridMove() {
  const { selectionBounds, wrapperRef, pointerRef, envRef, selectRange } =
    useDataGridInternals()
  const { flashCells } = useDataTableFlash()

  const [moveBounds, setMoveBounds] = React.useState<SelectionBounds | null>(
    null,
  )
  const moveModeRef = React.useRef(false)
  const moveSourceRef = React.useRef<SelectionBounds | null>(null)
  const moveGrabRef = React.useRef<{ row: number; col: number } | null>(null)
  const moveOffsetRef = React.useRef({ dr: 0, dc: 0 })
  const moveCopyRef = React.useRef(false)
  const moveRafRef = React.useRef<number | null>(null)
  const dragCleanupRef = React.useRef<(() => void) | null>(null)

  // Move (or copy) the source block by (dr, dc). Reads the whole source block
  // into memory FIRST so an overlapping source/target is safe, clears the source
  // on a move, stamps the target, then selects + flashes the landing rectangle.
  const applyMove = React.useCallback(
    (source: SelectionBounds, dr: number, dc: number, copy: boolean) => {
      if (dr === 0 && dc === 0) return
      const env = envRef.current
      const patch = new Map<string, Record<string, CellState<string>>>()
      const ensure = (rowId: string) => {
        const existing = patch.get(rowId)
        if (existing) return existing
        const created: Record<string, CellState<string>> = {}
        patch.set(rowId, created)
        return created
      }

      // 1. Snapshot the source block, and (for a move) clear it.
      const block: (CellState<string> | undefined)[][] = []
      for (let r = source.minRow; r <= source.maxRow; r++) {
        const srcRow = env.orderedRows[r]?.original
        const srcRowId = env.orderedRows[r]?.id
        const rowVals: (CellState<string> | undefined)[] = []
        for (let c = source.minColIndex; c <= source.maxColIndex; c++) {
          const col = env.columnIds[c]
          rowVals.push(
            srcRow && col ? (srcRow[col] as CellState<string>) : undefined,
          )
          if (!copy && srcRowId && col)
            ensure(srcRowId)[col] = emptyCell<string>()
        }
        block.push(rowVals)
      }

      // 2. Stamp the target (writes win over the source-clear on overlap).
      // Every in-bounds source cell overwrites its destination — an empty
      // source cell stamps empty (the move replaces the whole rectangle, it
      // doesn't merge). Only populated cells flash.
      const flashed: { rowId: string; columnId: string }[] = []
      for (let r = source.minRow; r <= source.maxRow; r++) {
        const targetRowId = env.orderedRows[r + dr]?.id
        if (!targetRowId) continue
        for (let c = source.minColIndex; c <= source.maxColIndex; c++) {
          const col = env.columnIds[c + dc]
          if (!col) continue
          const val = block[r - source.minRow]?.[c - source.minColIndex]
          ensure(targetRowId)[col] = val ? { ...val } : emptyCell<string>()
          if (val && val.status !== "empty") {
            flashed.push({ rowId: targetRowId, columnId: col })
          }
        }
      }
      if (patch.size === 0) return
      env.grid.updateRows(rows =>
        rows.map(row => {
          const p = patch.get(row.id)
          return p ? { ...row, ...p } : row
        }),
      )
      selectRange({
        minRow: source.minRow + dr,
        maxRow: source.maxRow + dr,
        minColIndex: source.minColIndex + dc,
        maxColIndex: source.maxColIndex + dc,
      })
      flashCells(flashed, { scrollIntoView: false })
    },
    [envRef, selectRange, flashCells],
  )

  // rAF loop while dragging: ghost the landing rectangle under the pointer
  // (clamped in-grid) and auto-scroll at both axes' edges.
  const moveStep = React.useCallback(() => {
    if (!moveModeRef.current) {
      moveRafRef.current = null
      return
    }
    const env = envRef.current
    const source = moveSourceRef.current
    const grab = moveGrabRef.current
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
    if (attr && source && grab) {
      const sep = attr.indexOf(":")
      const tRow = env.displayIndexOf(attr.slice(0, sep))
      const tCol = env.columnIds.indexOf(attr.slice(sep + 1))
      if (tRow !== undefined && tCol >= 0) {
        // Offset so the grabbed cell tracks the pointer, clamped so the whole
        // block stays inside the grid.
        const maxRow = env.orderedRows.length - 1
        const maxCol = env.columnIds.length - 1
        const dr = clamp(
          tRow - grab.row,
          -source.minRow,
          maxRow - source.maxRow,
        )
        const dc = clamp(
          tCol - grab.col,
          -source.minColIndex,
          maxCol - source.maxColIndex,
        )
        moveOffsetRef.current = { dr, dc }
        setMoveBounds({
          minRow: source.minRow + dr,
          maxRow: source.maxRow + dr,
          minColIndex: source.minColIndex + dc,
          maxColIndex: source.maxColIndex + dc,
        })
      }
    }
    moveRafRef.current = requestAnimationFrame(moveStep)
  }, [envRef, pointerRef, wrapperRef])

  const onSelectionMoveMouseDown = React.useCallback(
    (e: React.MouseEvent, grabPos: CellPosition) => {
      if (!selectionBounds || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const env = envRef.current
      const grabRow = env.displayIndexOf(grabPos.rowId)
      const grabCol = env.columnIds.indexOf(grabPos.columnId)
      if (grabRow === undefined || grabCol < 0) return
      // Seed the pointer — the rAF loop may run before the first mousemove.
      pointerRef.current = { x: e.clientX, y: e.clientY }
      moveSourceRef.current = selectionBounds
      moveGrabRef.current = { row: grabRow, col: grabCol }
      moveOffsetRef.current = { dr: 0, dc: 0 }
      moveCopyRef.current = e.ctrlKey || e.metaKey
      moveModeRef.current = true
      setMoveBounds(selectionBounds)
      if (moveRafRef.current == null)
        moveRafRef.current = requestAnimationFrame(moveStep)

      // Drag-scoped listeners — attached only for the duration of this drag.
      // The mousemove tracks the live copy-vs-move modifier (press/release
      // Ctrl/Cmd mid-drag); the mouseup applies and cleans everything up.
      const onDragMove = (ev: MouseEvent) => {
        moveCopyRef.current = ev.ctrlKey || ev.metaKey
      }
      const onUp = () => {
        cleanup()
        moveModeRef.current = false
        if (moveRafRef.current != null) {
          cancelAnimationFrame(moveRafRef.current)
          moveRafRef.current = null
        }
        const source = moveSourceRef.current
        const { dr, dc } = moveOffsetRef.current
        if (source) applyMove(source, dr, dc, moveCopyRef.current)
        setMoveBounds(null)
        moveSourceRef.current = null
        moveGrabRef.current = null
      }
      const cleanup = () => {
        dragCleanupRef.current = null
        window.removeEventListener("mousemove", onDragMove)
        window.removeEventListener("mouseup", onUp)
      }
      dragCleanupRef.current = cleanup
      window.addEventListener("mousemove", onDragMove)
      window.addEventListener("mouseup", onUp)
    },
    [selectionBounds, envRef, moveStep, applyMove, pointerRef],
  )

  // Unmount safety: cancel a drag in flight.
  React.useEffect(
    () => () => {
      if (moveRafRef.current != null) cancelAnimationFrame(moveRafRef.current)
      dragCleanupRef.current?.()
    },
    [],
  )

  const payload = React.useMemo<MoveFeature>(
    () => ({ moveBounds, onSelectionMoveMouseDown }),
    [moveBounds, onSelectionMoveMouseDown],
  )
  useRegisterGridFeature("move", payload)

  return null
}
