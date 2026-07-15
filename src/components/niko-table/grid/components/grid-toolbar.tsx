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
import { Plus, Redo2, Undo2, X } from "lucide-react"

import { useDataGridContext } from "../core/data-grid-context"
import type { GridRow } from "../types/grid-cell"

/** Undo the last data change (also Cmd/Ctrl+Z). */
export function DataGridUndo() {
  const { grid } = useDataGridContext<GridRow>()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => grid.undo()}
          disabled={!grid.canUndo}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Undo the last change (Cmd/Ctrl+Z)</TooltipContent>
    </Tooltip>
  )
}

/** Redo the last undone change (also Cmd/Ctrl+Shift+Z or Ctrl+Y). */
export function DataGridRedo() {
  const { grid } = useDataGridContext<GridRow>()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => grid.redo()}
          disabled={!grid.canRedo}
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Redo the last undone change (Cmd/Ctrl+Shift+Z)
      </TooltipContent>
    </Tooltip>
  )
}

/** Toolbar layout wrapper — compose the pieces below (or your own) inside it. */
export function DataGridToolbar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  )
}

/**
 * Append N empty rows to the grid. `count={1}` reads "Add row" (the singular);
 * any other count reads "Add {count} rows". Pass `className` to restyle — e.g. a
 * full-width dashed "Add row" bar under the grid body for a spreadsheet-style
 * always-visible single-row append. `label` overrides the text entirely.
 */
export function DataGridAddRows({
  count = 5,
  className,
  label,
}: {
  count?: number
  className?: string
  label?: React.ReactNode
}) {
  const { grid, columnIds } = useDataGridContext<GridRow>()
  const atCap = grid.rows.length >= grid.maxRows
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => {
        const created = grid.addRows(count)
        // Focus the first new row's first cell — the container scrolls on focus
        // change, so this brings the new rows into view and readies them for typing.
        const first = created[0]
        if (first && columnIds[0]) {
          grid.selectCell({ rowId: first.id, columnId: columnIds[0] })
        }
      }}
      disabled={atCap}
    >
      <Plus className="size-4" />
      {label ?? (count === 1 ? "Add row" : `Add ${count} rows`)}
    </Button>
  )
}

/** Replace every row with blanks (same count as the seed). */
export function DataGridClearAll() {
  const { grid } = useDataGridContext<GridRow>()
  return (
    <Button type="button" variant="outline" onClick={() => grid.clearAll()}>
      <X className="size-4" />
      Clear all
    </Button>
  )
}

/** Static hint that tabular data can be pasted in. */
export function DataGridPasteHint() {
  return (
    <span className="text-sm text-muted-foreground">
      Paste a spreadsheet (Ctrl/Cmd+V) to fill rows
    </span>
  )
}
