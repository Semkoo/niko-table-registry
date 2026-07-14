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
  useDataGridInternals,
  useRegisterGridFeature,
  type ClipboardFeature,
} from "../core/data-grid-features"
import { parseTsv, serializeSelection } from "../hooks/use-grid-clipboard"
import type {
  CellState,
  CopiedRange,
  SelectionBounds,
} from "../types/grid-cell"

/** Capture the copied rectangle by identity (for the marching-ants outline). */
function buildCopiedRange(
  bounds: SelectionBounds | null,
  orderedRows: readonly { id: string }[],
  columnIds: readonly string[],
): CopiedRange | null {
  if (!bounds) return null
  const rowIds = new Set<string>()
  let firstRowId = ""
  let lastRowId = ""
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    const id = orderedRows[r]?.id
    if (!id) continue
    rowIds.add(id)
    if (r === bounds.minRow) firstRowId = id
    lastRowId = id
  }
  const cols = columnIds.slice(bounds.minColIndex, bounds.maxColIndex + 1)
  return {
    rowIds,
    firstRowId,
    lastRowId,
    columnIds: new Set(cols),
    firstColumnId: cols[0] ?? "",
    lastColumnId: cols[cols.length - 1] ?? "",
  }
}

export interface DataGridClipboardProps {
  /**
   * Resolve a pasted string into a CellState for a column. Required for paste
   * (Ctrl/Cmd+V); without it copy/cut still work. Keeps the grid
   * validation-agnostic.
   */
  resolveCell?: (columnId: string, raw: string) => CellState<string>
}

/**
 * Opt-in clipboard for the grid — copy / cut / paste via the NATIVE clipboard
 * events (input-safe, gives real `clipboardData`), a TSV wire format that
 * round-trips with external tabular editors, and the marching-ants copy outline. Drop it
 * inside `<DataGrid>`; leave it out and the grid attaches no document
 * listeners and ships no clipboard code.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridClipboard resolveCell={resolveCell} />
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */
export function DataGridClipboard({ resolveCell }: DataGridClipboardProps) {
  const {
    grid,
    selectionBounds,
    orderedRows,
    columnIds,
    displayIndexOf,
    getDisplayRow,
    clearSelection,
    wrapperRef,
  } = useDataGridInternals()
  const { flashCells } = useDataTableFlash()
  const [copiedRange, setCopiedRange] = React.useState<CopiedRange | null>(null)
  const { focusedCell, editingCell } = grid

  // Await the clipboard write; returns the rectangle it wrote on success (null
  // on failure or empty selection). It does NOT touch the marching-ants marker —
  // each caller decides: copy shows the outline, cut removes it. Awaiting the
  // write means a rejected write (permissions, focus) never destroys data, and
  // returning the captured bounds means each caller acts on the snapshot it
  // wrote, not whatever the selection has since become.
  const writeSelectionToClipboard =
    React.useCallback(async (): Promise<SelectionBounds | null> => {
      if (!selectionBounds) return null
      const snapshot = selectionBounds
      try {
        await navigator.clipboard.writeText(
          serializeSelection(getDisplayRow, columnIds, snapshot),
        )
      } catch {
        return null
      }
      return snapshot
    }, [selectionBounds, getDisplayRow, columnIds])

  const copySelection = React.useCallback(() => {
    void writeSelectionToClipboard().then(bounds => {
      if (bounds) {
        setCopiedRange(buildCopiedRange(bounds, orderedRows, columnIds))
      }
    })
  }, [writeSelectionToClipboard, orderedRows, columnIds])

  const cutSelection = React.useCallback(() => {
    void writeSelectionToClipboard().then(bounds => {
      if (!bounds) return
      // Match native cut: clear the source and DROP the marching-ants outline —
      // an outline around now-empty cells reads as "still copyable" and is wrong.
      clearSelection()
      setCopiedRange(null)
    })
  }, [writeSelectionToClipboard, clearSelection])

  // Apply pasted TSV text (shared by the native paste event and the
  // context-menu "Paste" action). Anchors at the selection's top-left (or the
  // focused cell), and TILES the copied block across a larger selection when it
  // divides evenly — the standard "paste one to many" behavior.
  const applyPaste = React.useCallback(
    (text: string) => {
      if (!resolveCell || !text) return
      const matrix = parseTsv(text)
      const pr = matrix.length
      const pc = matrix.reduce((m, cells) => Math.max(m, cells.length), 0)
      if (pr === 0 || pc === 0) return

      // Anchor at the selection's top-left; a range defines the paste target,
      // a single cell just anchors a normal (possibly grid-growing) paste.
      const b = selectionBounds
      const startRow = b
        ? b.minRow
        : focusedCell
          ? (displayIndexOf(focusedCell.rowId) ?? 0)
          : 0
      const startCol = b
        ? b.minColIndex
        : focusedCell
          ? columnIds.indexOf(focusedCell.columnId)
          : 0
      const selRows = b ? b.maxRow - b.minRow + 1 : 1
      const selCols = b ? b.maxColIndex - b.minColIndex + 1 : 1

      // Paste-one-to-many: when the selection is LARGER than the copied block
      // and an exact multiple in both axes, tile the block to fill the whole
      // selection (copy 1×1 → fill; copy 1×3 into 3×3 → repeat down). Otherwise
      // paste the block once at the anchor.
      const tile =
        (selRows > pr || selCols > pc) &&
        selRows % pr === 0 &&
        selCols % pc === 0
      const destRows = tile ? selRows : pr
      const destCols = tile ? selCols : pc

      // Grow the grid when a NON-tiled paste runs past the last row (the grid
      // grows rather than dropping overflow; tiling is bounded by the existing
      // selection so it never needs new rows). `addRows` clamps at `maxRows`
      // and commits its own history entry, so a grown paste undoes in two steps.
      const overflow = tile ? 0 : startRow + destRows - orderedRows.length
      const created = overflow > 0 ? grid.addRows(overflow) : []

      const patchById = new Map<string, Record<string, CellState<string>>>()
      for (let dr = 0; dr < destRows; dr++) {
        const rowId =
          orderedRows[startRow + dr]?.id ??
          created[startRow + dr - orderedRows.length]?.id
        if (!rowId) continue
        const patch = patchById.get(rowId) ?? {}
        for (let dc = 0; dc < destCols; dc++) {
          const col = columnIds[startCol + dc]
          if (!col) continue
          const raw = matrix[dr % pr]?.[dc % pc] ?? ""
          patch[col] = resolveCell(col, raw)
        }
        patchById.set(rowId, patch)
      }
      if (patchById.size === 0) return
      grid.updateRows(rows =>
        rows.map(row => {
          const patch = patchById.get(row.id)
          return patch ? { ...row, ...patch } : row
        }),
      )
      setCopiedRange(null)
      // Flash the specific cells that received pasted values (cell-level for
      // value changes, the standard behavior), not whole rows. No scroll — user is here.
      const flashed: { rowId: string; columnId: string }[] = []
      patchById.forEach((patch, rowId) => {
        for (const columnId of Object.keys(patch))
          flashed.push({ rowId, columnId })
      })
      flashCells(flashed, { scrollIntoView: false })
    },
    [
      resolveCell,
      focusedCell,
      selectionBounds,
      orderedRows,
      columnIds,
      displayIndexOf,
      grid,
      flashCells,
    ],
  )

  const pasteFromClipboard = React.useCallback(() => {
    void (async () => {
      try {
        const text = await navigator.clipboard.readText()
        if (text) applyPaste(text)
      } catch {
        // Clipboard read may be blocked (permissions / focus) — Ctrl/Cmd+V still works.
      }
    })()
  }, [applyPaste])

  const clearCopiedRange = React.useCallback(() => setCopiedRange(null), [])

  // Native clipboard events — subscribed ONCE while this component is mounted;
  // handlers read the latest state through a ref instead of re-binding three
  // document listeners on every render.
  const clipboardRef = React.useRef({
    editingCell,
    selectionBounds,
    columnIds,
    orderedRows,
    getDisplayRow,
    resolveCell,
    clearSelection,
    applyPaste,
  })
  clipboardRef.current = {
    editingCell,
    selectionBounds,
    columnIds,
    orderedRows,
    getDisplayRow,
    resolveCell,
    clearSelection,
    applyPaste,
  }

  React.useEffect(() => {
    // Only intercept when the grid actually has focus — the listeners live on
    // `document`, so without this guard a grid with a lingering selection
    // would hijack copy/paste aimed at other inputs on the page.
    const gridHasFocus = () =>
      wrapperRef.current?.contains(document.activeElement) ?? false

    const onCopy = (e: ClipboardEvent) => {
      const s = clipboardRef.current
      if (!gridHasFocus()) return
      if (s.editingCell || !s.selectionBounds) return
      e.clipboardData?.setData(
        "text/plain",
        serializeSelection(s.getDisplayRow, s.columnIds, s.selectionBounds),
      )
      e.preventDefault()
      setCopiedRange(
        buildCopiedRange(s.selectionBounds, s.orderedRows, s.columnIds),
      )
    }
    const onCut = (e: ClipboardEvent) => {
      const s = clipboardRef.current
      if (!gridHasFocus()) return
      if (s.editingCell || !s.selectionBounds) return
      e.clipboardData?.setData(
        "text/plain",
        serializeSelection(s.getDisplayRow, s.columnIds, s.selectionBounds),
      )
      e.preventDefault()
      s.clearSelection()
      setCopiedRange(null)
    }
    const onPaste = (e: ClipboardEvent) => {
      const s = clipboardRef.current
      if (!gridHasFocus()) return
      if (s.editingCell || !s.resolveCell) return
      const text = e.clipboardData?.getData("text/plain")
      if (!text) return
      e.preventDefault()
      s.applyPaste(text)
    }

    document.addEventListener("copy", onCopy)
    document.addEventListener("cut", onCut)
    document.addEventListener("paste", onPaste)
    return () => {
      document.removeEventListener("copy", onCopy)
      document.removeEventListener("cut", onCut)
      document.removeEventListener("paste", onPaste)
    }
  }, [wrapperRef])

  const payload = React.useMemo<ClipboardFeature>(
    () => ({
      copiedRange,
      copySelection,
      cutSelection,
      pasteFromClipboard,
      clearCopiedRange,
      canPaste: !!resolveCell,
    }),
    [
      copiedRange,
      copySelection,
      cutSelection,
      pasteFromClipboard,
      clearCopiedRange,
      resolveCell,
    ],
  )
  useRegisterGridFeature("clipboard", payload)

  return null
}
