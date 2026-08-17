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
import { flexRender, type Cell } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Renders a body cell with TanStack grouping / aggregation awareness.
 *
 * - Grouped column cell: expand/collapse control + value + leaf count
 * - Aggregated cell: `aggregatedCell` (falls back to `cell`)
 * - Placeholder cell: empty (grouped columns leave gaps on leaf rows)
 * - Otherwise: normal `cell` render
 *
 * Used by every body structure so grouping works the same for regular,
 * virtualized, and DnD tables.
 */
export function renderCellContent<TData, TValue>(
  cell: Cell<TData, TValue>,
): ReactNode {
  const context = cell.getContext()

  // Only branch when a grouping is actually applied. `getIsAggregated()` is
  // also true for any parent row produced by `getSubRows` (tree tables), and
  // TanStack ships a default `aggregatedCell` that stringifies the value — so
  // an unguarded aggregate branch replaces those rows' real cells.
  if (context.table.getState().grouping.length === 0) {
    return flexRender(cell.column.columnDef.cell, context)
  }

  if (cell.getIsPlaceholder()) {
    return null
  }

  if (cell.getIsAggregated()) {
    return flexRender(
      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
      context,
    )
  }

  if (cell.getIsGrouped()) {
    const row = cell.row
    const canExpand = row.getCanExpand()
    const isExpanded = row.getIsExpanded()
    const leafCount = row.subRows.length

    return (
      <div className="flex min-w-0 items-center gap-1">
        {canExpand ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7 shrink-0", "dark:text-muted-foreground")}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse group" : "Expand group"}
            onClick={row.getToggleExpandedHandler()}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </Button>
        ) : null}
        <span className="truncate">
          {flexRender(cell.column.columnDef.cell, context)}
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          ({leafCount})
        </span>
      </div>
    )
  }

  return flexRender(cell.column.columnDef.cell, context)
}
