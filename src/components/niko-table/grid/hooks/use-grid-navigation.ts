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

import {
  clampGridIndex as clamp,
  type GridDisplayRow,
} from "../core/data-grid-features"
import type { CellPosition, CellState, GridRow } from "../types/grid-cell"
import type { UseDataGrid } from "./use-data-grid"

/** PageUp/Down sizing fallbacks when no row / scroll container is measurable. */
const FALLBACK_ROW_HEIGHT = 36
const FALLBACK_VIEWPORT_HEIGHT = 400

interface UseGridNavigationOptions<TRow extends GridRow> {
  grid: UseDataGrid<TRow>
  orderedRows: readonly GridDisplayRow[]
  columnIds: readonly string[]
  displayIndexOf: (id: string) => number | undefined
  focusedCell: CellPosition | null
  wrapperRef: React.RefObject<HTMLDivElement | null>
}

export interface GridNavigation {
  /** Move the active cell by a delta in DISPLAY order (arrows). */
  moveFocus: (dRow: number, dCol: number, extend?: boolean) => void
  /** Tab to the next/previous cell (appends a row off the end). */
  tabNext: (reverse: boolean) => void
  /** Select or extend to an absolute display cell (Home/End variants). */
  moveTo: (rowIdx: number, colIdx: number, extend: boolean) => void
  /** Ctrl+A — select the whole grid. */
  selectAll: () => void
  /** Ctrl+Arrow — jump to the edge of the contiguous data block (the standard jump-to-data-edge behavior). */
  moveToEdge: (dRow: number, dCol: number, extend: boolean) => void
  /** Rows per "page" for PageUp/PageDown (from the scroll viewport). */
  pageRows: () => number
}

/**
 * Display-order navigation for the grid core: arrows, Tab, Home/End,
 * Ctrl+Arrow edge jumps, select-all, and page sizing.
 */
export function useGridNavigation<TRow extends GridRow>({
  grid,
  orderedRows,
  columnIds,
  displayIndexOf,
  focusedCell,
  wrapperRef,
}: UseGridNavigationOptions<TRow>): GridNavigation {
  const moveFocus = React.useCallback(
    (dRow: number, dCol: number, extend = false) => {
      if (orderedRows.length === 0) return
      const base = focusedCell ?? {
        rowId: orderedRows[0]!.id,
        columnId: columnIds[0]!,
      }
      const curRow = displayIndexOf(base.rowId) ?? 0
      const nextRow = clamp(curRow + dRow, 0, orderedRows.length - 1)
      const curCol = columnIds.indexOf(base.columnId)
      const nextCol = clamp(curCol + dCol, 0, columnIds.length - 1)
      const pos: CellPosition = {
        rowId: orderedRows[nextRow]!.id,
        columnId: columnIds[nextCol]!,
      }
      if (extend) grid.extendSelectionTo(pos)
      else grid.selectCell(pos)
    },
    [orderedRows, displayIndexOf, focusedCell, columnIds, grid],
  )

  const tabNext = React.useCallback(
    (reverse: boolean) => {
      if (orderedRows.length === 0) return
      const lastCol = columnIds.length - 1
      const base = focusedCell ?? {
        rowId: orderedRows[0]!.id,
        columnId: columnIds[0]!,
      }
      const rowDisp = displayIndexOf(base.rowId) ?? 0
      const colIdx = columnIds.indexOf(base.columnId)

      let nextRowDisp = rowDisp
      let nextCol: number
      if (reverse) {
        if (colIdx > 0) nextCol = colIdx - 1
        else {
          nextCol = lastCol
          nextRowDisp = Math.max(0, rowDisp - 1)
        }
      } else if (colIdx < lastCol) {
        nextCol = colIdx + 1
      } else {
        nextCol = 0
        if (rowDisp + 1 >= orderedRows.length) {
          // Tab off the last cell → append a row and land on it.
          const created = grid.addRows(1)
          if (created.length > 0) {
            grid.selectCell({
              rowId: created[0]!.id,
              columnId: columnIds[0]!,
            })
          }
          return
        }
        nextRowDisp = rowDisp + 1
      }
      grid.selectCell({
        rowId: orderedRows[nextRowDisp]!.id,
        columnId: columnIds[nextCol]!,
      })
    },
    [orderedRows, displayIndexOf, focusedCell, columnIds, grid],
  )

  const moveTo = React.useCallback(
    (rowIdx: number, colIdx: number, extend: boolean) => {
      if (orderedRows.length === 0) return
      const r = clamp(rowIdx, 0, orderedRows.length - 1)
      const c = clamp(colIdx, 0, columnIds.length - 1)
      const pos: CellPosition = {
        rowId: orderedRows[r]!.id,
        columnId: columnIds[c]!,
      }
      if (extend) grid.extendSelectionTo(pos)
      else grid.selectCell(pos)
    },
    [orderedRows, columnIds, grid],
  )

  const selectAll = React.useCallback(() => {
    if (orderedRows.length === 0) return
    grid.selectCell({ rowId: orderedRows[0]!.id, columnId: columnIds[0]! })
    grid.extendSelectionTo({
      rowId: orderedRows[orderedRows.length - 1]!.id,
      columnId: columnIds[columnIds.length - 1]!,
    })
  }, [orderedRows, columnIds, grid])

  // Ctrl+Arrow — from a filled cell, land on the last filled cell of the
  // contiguous block; from an empty/edge cell, skip to the next filled cell
  // (or the far edge).
  const moveToEdge = React.useCallback(
    (dRow: number, dCol: number, extend: boolean) => {
      if (!focusedCell || orderedRows.length === 0) return
      const rowMax = orderedRows.length - 1
      const colMax = columnIds.length - 1
      const startRow = displayIndexOf(focusedCell.rowId) ?? 0
      const startCol = columnIds.indexOf(focusedCell.columnId)
      const inBounds = (r: number, c: number) =>
        r >= 0 && r <= rowMax && c >= 0 && c <= colMax
      const isEmptyAt = (r: number, c: number) => {
        const row = orderedRows[r]?.original
        const col = columnIds[c]
        if (!row || !col) return true
        // Rows created before a dynamically added column have no entry for it.
        const cell = row[col] as CellState<string> | undefined
        return (cell?.raw ?? "") === ""
      }

      let r = startRow
      let c = startCol
      if (!inBounds(r + dRow, c + dCol)) {
        moveTo(r, c, extend)
        return
      }
      if (isEmptyAt(r, c) || isEmptyAt(r + dRow, c + dCol)) {
        // Skip to the next filled cell (or the far edge).
        r += dRow
        c += dCol
        while (inBounds(r + dRow, c + dCol) && isEmptyAt(r, c)) {
          r += dRow
          c += dCol
        }
      } else {
        // Walk to the last filled cell of the contiguous block.
        while (inBounds(r + dRow, c + dCol) && !isEmptyAt(r + dRow, c + dCol)) {
          r += dRow
          c += dCol
        }
      }
      moveTo(r, c, extend)
    },
    [focusedCell, orderedRows, columnIds, displayIndexOf, moveTo],
  )

  const pageRows = React.useCallback(() => {
    const scrollEl = wrapperRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    )
    const rowEl = wrapperRef.current?.querySelector<HTMLElement>("[data-index]")
    const rowH = rowEl?.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT
    const viewport = scrollEl?.clientHeight || FALLBACK_VIEWPORT_HEIGHT
    return Math.max(1, Math.floor(viewport / rowH) - 1)
  }, [wrapperRef])

  return React.useMemo(
    () => ({ moveFocus, tabNext, moveTo, selectAll, moveToEdge, pageRows }),
    [moveFocus, tabNext, moveTo, selectAll, moveToEdge, pageRows],
  )
}
