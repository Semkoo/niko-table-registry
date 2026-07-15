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

import type { CellStatus } from "../types/grid-cell"

/** Row height for every grid cell (matches the h-9 form-control rhythm). */
export const CELL_HEIGHT = 36

/**
 * Shared cell-trigger look: a borderless control that fills its cell, turns
 * red when invalid, and shows an inset focus ring. Used by every cell editor
 * so comboboxes and inputs line up pixel-for-pixel.
 */
/**
 * Shared cell-trigger look, applied on top of shadcn `Input` / `Button` so we
 * reuse those primitives (a11y, focus, disabled handling) but strip their
 * border / rounding / default ring / hover fill so they sit flush in a cell.
 * tailwind-merge lets these later utilities win over the primitives' base
 * classes, so we compose rather than fork.
 */
export function cellTriggerClass(opts: {
  status: CellStatus
  isFocused: boolean
  isEmpty: boolean
  /** Within the current selection rectangle (range highlight). */
  isSelected?: boolean
}): string {
  return cn(
    // Layout + reset the primitive chrome (border/rounding/shadow/ring/hover).
    "flex h-9 w-full items-center justify-start gap-1 truncate rounded-none border-0 bg-transparent px-2 text-left text-sm font-normal shadow-none transition-colors outline-none",
    "hover:bg-transparent focus-visible:border-0 focus-visible:ring-0",
    opts.isEmpty && "text-muted-foreground",
    // Range highlight for selected cells — but NOT the active cell, which stays
    // unfilled so it reads as the cursor within the selection.
    // Skipped on invalid cells so the red error fill always wins. Repeat on
    // hover: so the shadcn Button's hover state doesn't wash out the tint.
    opts.isSelected &&
      !opts.isFocused &&
      opts.status !== "invalid" &&
      "bg-primary/10 hover:bg-primary/10",
    opts.status === "invalid" &&
      "text-destructive bg-destructive/10 hover:bg-destructive/10 aria-invalid:bg-destructive/10",
    // NOTE: the active-cell (cursor) border is drawn by `DataGridCell` as an
    // overlay on the cell WRAPPER, not here — a control's own `:focus-visible`
    // reset would otherwise zero out a ring on the focusable element.
  )
}
