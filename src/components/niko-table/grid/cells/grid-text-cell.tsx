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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import * as React from "react"

import type { CellState } from "../types/grid-cell"
import type { CellEditorProps } from "./cell-props"
import { cellTriggerClass } from "./cell-styles"
import { GridCellDisplay } from "./grid-cell-display"

export interface GridTextCellProps extends CellEditorProps {
  placeholder?: string
  /** Resolve raw text into a validated cell (date / time / number parsers). */
  resolve: (raw: string) => CellState<string>
  /** Text alignment — right for numbers. Default left. */
  align?: "left" | "right"
  /** Virtual-keyboard hint for the editing input (e.g. "decimal" for numbers). */
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  /**
   * Format the DISPLAY value (e.g. `25` → `$25.00`). Applied only while not
   * editing — the editor always shows the raw text so entry stays precise.
   * Only called for valid, non-empty cells; invalid/empty fall back to raw.
   */
  format?: (raw: string) => string
}

/**
 * Free-text cell. Two modes, like an editable grid cell: a read-only display shell
 * while merely selected (single-click select + drag-select work), and a real
 * `<input>` once editing starts (double-click, Enter, or typing). Typing seeds
 * the input so it overwrites; the value resolves on blur / Enter and highlights
 * when unparsable.
 *
 * The `<input>` + its draft/commit machinery live in `GridTextEditor`, which
 * mounts ONLY when this cell edits — so a viewport of ~280 cells carries the
 * input machinery on one cell, not all of them (see `GridCellDisplay`).
 */
export function GridTextCell(props: GridTextCellProps) {
  const { cell, placeholder, isFocused, isSelected, isEditing, align, format } =
    props

  if (!isEditing) {
    // Format only valid, non-empty values; invalid/empty show raw (+ placeholder)
    // so a user's in-progress or unparsable text is never masked.
    const display =
      format && cell.status === "valid" ? format(cell.raw) : cell.raw
    return (
      <GridCellDisplay
        status={cell.status}
        error={cell.error}
        isFocused={isFocused}
        isSelected={isSelected}
        align={align}
      >
        {display || placeholder}
      </GridCellDisplay>
    )
  }
  return <GridTextEditor {...props} />
}

/**
 * Number cell — `GridTextCell` right-aligned with a numeric keyboard. Validity
 * (is this a number?) is the consumer's `resolve`'s job, so this stays a thin
 * preset and the grid remains type-agnostic.
 */
export function GridNumberCell(
  props: Omit<GridTextCellProps, "align" | "inputMode">,
) {
  return <GridTextCell {...props} align="right" inputMode="decimal" />
}

/** The editing `<input>` — mounted only while this cell is being edited. */
function GridTextEditor({
  cell,
  placeholder,
  resolve,
  isSelected,
  editSeed,
  align,
  inputMode,
  onEditingChange,
  onCommit,
  onFillSelection,
  onMoveFocus,
}: GridTextCellProps) {
  const commit = (value: string) => {
    // Unchanged value (including leaving an untouched empty cell via
    // Enter/Tab/blur) is a no-op — committing would push a phantom
    // undo-history entry for a visit that changed nothing.
    if (value === cell.raw) return
    onCommit(resolve(value))
  }

  // The un-committed draft. The input is uncontrolled (`defaultValue`), and
  // editing can be torn down EXTERNALLY before blur fires — clicking another
  // cell runs `selectCell` (which clears `editingCell`) in the same mousedown,
  // so this component unmounts while the input still holds the draft and its
  // `onBlur` never dispatches. We mirror the draft into a ref and commit it on
  // unmount (also covers the row being virtualized away mid-edit). Escape
  // clears the draft first, so cancel still discards.
  const draftRef = React.useRef<string | null>(null)
  const commitRef = React.useRef(commit)
  commitRef.current = commit

  const commitDraft = (value: string) => {
    draftRef.current = null
    commit(value)
  }

  // useLayoutEffect cleanup, NOT useEffect: it runs before the browser paints,
  // so the commit's re-render lands in the same frame. A passive effect would
  // let the teardown frame paint the OLD value first — a stale-data flash.
  React.useLayoutEffect(
    () => () => {
      if (draftRef.current != null) commitRef.current(draftRef.current)
    },
    [],
  )

  return (
    <Input
      autoFocus
      type="text"
      inputMode={inputMode}
      defaultValue={editSeed ?? cell.raw}
      placeholder={placeholder}
      aria-invalid={cell.status === "invalid"}
      onFocus={e => {
        // Type-to-edit seeds the input with the typed character — that seed IS
        // a draft, so a click-away with no further typing must still commit it.
        // A plain double-click open (no seed) leaves the draft null, so closing
        // without typing stays a no-op (no phantom history entry).
        if (editSeed != null && draftRef.current == null) {
          draftRef.current = e.currentTarget.value
        }
      }}
      onChange={e => {
        draftRef.current = e.target.value
      }}
      onBlur={e => {
        commitDraft(e.target.value)
        onEditingChange(false)
      }}
      onKeyDown={e => {
        // Commit the current value, close the editor, and move the focus.
        const commitAndMove = (dRow: number, dCol: number) => {
          commitDraft(e.currentTarget.value)
          onEditingChange(false)
          onMoveFocus?.(dRow, dCol)
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onFillSelection) {
          // Ctrl/Cmd+Enter: fill the whole selection with this value.
          e.preventDefault()
          draftRef.current = null
          onFillSelection(resolve(e.currentTarget.value))
          onEditingChange(false)
        } else if (e.key === "Enter") {
          e.preventDefault()
          commitAndMove(1, 0)
        } else if (e.key === "Tab") {
          e.preventDefault()
          commitAndMove(0, e.shiftKey ? -1 : 1)
        } else if (e.key === "Escape") {
          e.preventDefault()
          draftRef.current = null // cancel discards the draft
          onEditingChange(false)
        }
      }}
      className={cn(
        cellTriggerClass({
          status: cell.status,
          isFocused: true,
          isSelected,
          isEmpty: false,
        }),
        align === "right" && "text-right",
      )}
    />
  )
}
