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

import type { CellPosition, GridRow } from "../types/grid-cell"
import type { UseDataGrid } from "./use-data-grid"
import type { GridNavigation } from "./use-grid-navigation"

interface UseGridKeyboardOptions<TRow extends GridRow> {
  grid: UseDataGrid<TRow>
  nav: GridNavigation
  focusedCell: CellPosition | null
  editingCell: CellPosition | null
  displayIndexOf: (id: string) => number | undefined
  rowCount: number
  columnCount: number
  clearSelection: () => void
  /** From the clipboard feature, when mounted — Escape clears the copy marker. */
  clearCopiedRange: (() => void) | undefined
  onRequestShortcuts: (() => void) | undefined
}

/**
 * The grid's scoped keyboard state machine — a raw `keydown` handler, NOT a
 * hotkey lib, because a grid is an input surface (type-to-edit must catch any
 * printable char, matching how text and grid editors handle input). Attach to the
 * grid wrapper's `onKeyDownCapture` (capture phase beats inner comboboxes).
 */
export function useGridKeyboard<TRow extends GridRow>({
  grid,
  nav,
  focusedCell,
  editingCell,
  displayIndexOf,
  rowCount,
  columnCount,
  clearSelection,
  clearCopiedRange,
  onRequestShortcuts,
}: UseGridKeyboardOptions<TRow>) {
  const { moveFocus, tabNext, moveTo, selectAll, moveToEdge, pageRows } = nav

  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (editingCell) return

    // Only treat keys as grid shortcuts when they originate from a cell (or
    // the grid wrapper itself, so focusing the grid + arrows still works).
    // Toolbar buttons, add-row footers, and other controls nested inside the
    // wrapper keep their native keyboard behavior (Enter/Space activation).
    const target = event.target as HTMLElement
    if (target !== event.currentTarget && !target.closest("[data-cell]")) {
      return
    }

    // Undo / redo — Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y. (Cmd+C/X/V fall
    // through to `<DataGridClipboard>`'s native listeners; while editing, the
    // input's own undo handles it — gated by the `editingCell` guard above.)
    const mod = event.metaKey || event.ctrlKey
    if (mod) {
      const k = event.key.toLowerCase()
      if (k === "z") {
        event.preventDefault()
        event.stopPropagation()
        if (event.shiftKey) grid.redo()
        else grid.undo()
        return
      }
      if (k === "y") {
        event.preventDefault()
        event.stopPropagation()
        grid.redo()
        return
      }
      if (k === "a") {
        event.preventDefault()
        event.stopPropagation()
        selectAll()
        return
      }
    }

    switch (event.key) {
      case "Tab":
        event.preventDefault()
        event.stopPropagation()
        tabNext(event.shiftKey)
        return
      // Ctrl/Cmd+Arrow jumps to the data-block edge; plain Arrow moves one cell.
      case "ArrowUp":
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveToEdge(-1, 0, event.shiftKey)
        else moveFocus(-1, 0, event.shiftKey)
        return
      case "ArrowDown":
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveToEdge(1, 0, event.shiftKey)
        else moveFocus(1, 0, event.shiftKey)
        return
      case "ArrowLeft":
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveToEdge(0, -1, event.shiftKey)
        else moveFocus(0, -1, event.shiftKey)
        return
      case "ArrowRight":
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveToEdge(0, 1, event.shiftKey)
        else moveFocus(0, 1, event.shiftKey)
        return
      case "Home":
        // Home → first column of the row; Ctrl+Home → first cell of the grid.
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveTo(0, 0, event.shiftKey)
        else if (focusedCell)
          moveTo(displayIndexOf(focusedCell.rowId) ?? 0, 0, event.shiftKey)
        return
      case "End":
        // End → last column of the row; Ctrl+End → last cell of the grid.
        event.preventDefault()
        event.stopPropagation()
        if (mod) moveTo(rowCount - 1, columnCount - 1, event.shiftKey)
        else if (focusedCell)
          moveTo(
            displayIndexOf(focusedCell.rowId) ?? 0,
            columnCount - 1,
            event.shiftKey,
          )
        return
      case "PageUp":
        event.preventDefault()
        event.stopPropagation()
        moveFocus(-pageRows(), 0, event.shiftKey)
        return
      case "PageDown":
        event.preventDefault()
        event.stopPropagation()
        moveFocus(pageRows(), 0, event.shiftKey)
        return
      case "Delete":
      case "Backspace":
        // Clear the selected cells (standard behavior). Editing is guarded above.
        event.preventDefault()
        event.stopPropagation()
        clearSelection()
        return
      case "Enter":
        if (focusedCell) {
          event.preventDefault()
          event.stopPropagation()
          grid.startEditing(focusedCell)
        }
        return
      case "Escape":
        event.preventDefault()
        event.stopPropagation()
        clearCopiedRange?.()
        if (focusedCell) grid.selectCell(focusedCell)
        return
    }
    // `?` opens the shortcuts help (opt-in) instead of type-to-edit.
    if (
      focusedCell &&
      onRequestShortcuts &&
      event.key === "?" &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      event.preventDefault()
      event.stopPropagation()
      onRequestShortcuts()
      return
    }

    if (
      focusedCell &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.key.length === 1
    ) {
      event.preventDefault()
      event.stopPropagation()
      grid.startEditing(focusedCell, event.key === " " ? undefined : event.key)
    }
  }
}
