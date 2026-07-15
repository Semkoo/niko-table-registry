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
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"
import type { CellStatus } from "../types/grid-cell"

import { cellTriggerClass } from "./cell-styles"

export interface GridCellDisplayProps {
  status: CellStatus
  isFocused: boolean
  isSelected: boolean
  /** Text alignment — right for numbers, left (default) otherwise. */
  align?: "left" | "right"
  /**
   * Reason the cell is invalid (from your `resolve`). When `status` is
   * `"invalid"` and this is set, the cell shows it in a tooltip on hover/focus —
   * inline, per cell, no summary block. Valid/empty cells render the bare shell.
   */
  error?: string
  /** The rendered value (label / raw / placeholder) — already resolved by the cell. */
  children: React.ReactNode
}

/**
 * The read-only cell shell — a borderless, focusable button that fills the cell
 * and carries the selection/invalid styling. EVERY cell type renders this while
 * not editing.
 *
 * Deliberately hook-free and dependency-light: a grid shows ~280 cells at once
 * but edits ONE, so the display path must be cheap. Each cell type's heavy
 * editor (input, combobox, date picker, …) lives in a SEPARATE component that
 * the cell mounts only when `isEditing` — so a 279-cell viewport never carries
 * 279 date-picker subtrees, refs, or effects. New cell types MUST follow this
 * split: `isEditing ? <XEditor …/> : <GridCellDisplay …>{label}</GridCellDisplay>`.
 */
export function GridCellDisplay({
  status,
  isFocused,
  isSelected,
  align = "left",
  error,
  children,
}: GridCellDisplayProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      tabIndex={-1}
      aria-invalid={status === "invalid"}
      className={cn(
        cellTriggerClass({
          status,
          isFocused,
          isSelected,
          isEmpty: status === "empty",
        }),
        align === "right" && "justify-end",
      )}
    >
      <span
        className={cn("flex-1 truncate", align === "right" && "text-right")}
      >
        {children}
      </span>
    </Button>
  )

  // Only invalid cells with a reason get the tooltip wrapper — valid/empty
  // cells (the overwhelming majority) render the bare shell, keeping the
  // display path cheap across a 280-cell viewport.
  if (status !== "invalid" || !error) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{error}</TooltipContent>
    </Tooltip>
  )
}
