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
/**
 * niko-table grid — the cell editor contract.
 *
 * Any component satisfying `CellEditorProps` can be a grid cell: text input,
 * searchable dropdown, date picker, number spinner, multi-select. Domain-free.
 */

import type { CellState } from "../types/grid-cell"

export interface CellEditorProps {
  cell: CellState<string>
  /** The active cell (shows the focus ring; the edit target). */
  isFocused: boolean
  /** Within the current selection rectangle (range highlight). */
  isSelected: boolean
  /** Whether this cell's editor is open. */
  isEditing: boolean
  /** Char to seed the editor with when editing started by typing (else null). */
  editSeed?: string | null
  /** Open/close this cell's editor. */
  onEditingChange: (editing: boolean) => void
  onCommit: (next: CellState<string>) => void
  /**
   * Commit this value to EVERY selected cell (Ctrl/Cmd+Enter). When absent the
   * editor falls back to `onCommit` (single cell).
   */
  onFillSelection?: (next: CellState<string>) => void
  /** Move the active cell after committing (e.g. Enter in a text cell). */
  onMoveFocus?: (deltaRow: number, deltaCol: number) => void
  /** Resolved display label for the cell's value (entity/select cells). */
  displayLabel?: string | null
}

/** Option shape for combobox/select cells. */
export interface GridComboboxOption {
  label: string
  value: string
}
