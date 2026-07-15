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
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import * as React from "react"

import type { CellEditorProps } from "./cell-props"
import { cellTriggerClass } from "./cell-styles"

interface GridCheckboxCellProps extends CellEditorProps {
  /** Truthy raw values (default: "true", "1", "yes"). Comparison is case-insensitive. */
  truthy?: readonly string[]
  /**
   * Accessible name for the checkbox (pass the column label so a screen reader
   * announces WHICH field it is). Falls back to the checked-state text.
   */
  "aria-label"?: string
}

const DEFAULT_TRUTHY = ["true", "1", "yes"] as const

/**
 * Boolean cell — a checkbox that's always interactive (no separate edit mode).
 * Stores `"true"` / `"false"` in the cell's `raw`. Click toggles; and because
 * the grid routes Enter/Space/type-to-edit through `isEditing`, this cell
 * interprets that "edit" as a toggle (then exits), so keyboard works too.
 */
export function GridCheckboxCell({
  cell,
  isFocused,
  isSelected,
  isEditing,
  truthy = DEFAULT_TRUTHY,
  "aria-label": ariaLabel,
  onCommit,
  onEditingChange,
}: GridCheckboxCellProps) {
  const set = new Set(truthy.map(t => t.toLowerCase()))
  const checked = set.has(cell.raw.trim().toLowerCase())

  const toggleRef = React.useRef<() => void>(() => {})
  toggleRef.current = () => {
    const next = !checked
    onCommit({ raw: String(next), value: String(next), status: "valid" })
  }

  // The grid triggers editing on Enter/Space/type — for a checkbox that means
  // "toggle". Do it in a layout effect (before paint) then exit edit mode.
  React.useLayoutEffect(() => {
    if (!isEditing) return
    toggleRef.current()
    onEditingChange(false)
  }, [isEditing, onEditingChange])

  // Reuse the shared cell shell so a checkbox cell fills/highlights EXACTLY like
  // every other cell: the selection-range tint when selected, and nothing while
  // it's the active cell (the active-cell border is drawn by the wrapper
  // overlay, same as text/select cells — so no redundant second outline here).
  // Centered instead of the default left align since it holds a single control.
  return (
    <div
      className={cn(
        cellTriggerClass({
          status: cell.status,
          isFocused,
          isSelected,
          isEmpty: false,
        }),
        "justify-center",
      )}
    >
      <Checkbox
        tabIndex={-1}
        checked={checked}
        onCheckedChange={() => toggleRef.current()}
        aria-label={ariaLabel ?? (checked ? "Checked" : "Unchecked")}
      />
    </div>
  )
}
