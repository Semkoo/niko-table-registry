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
import { cn } from "@/lib/utils"
import * as React from "react"

import { useDataGridInternals } from "../core/data-grid-features"
import type { CellState } from "../types/grid-cell"

/**
 * Beyond this many selected cells we skip the sum/avg scan (huge selections
 * like Ctrl+A over 500k rows) and show just the selected-cell count, so the
 * status bar never blocks a drag/keystroke.
 */
const MAX_STATS_CELLS = 20_000

interface SelectionStats {
  /** Total cells in the selection rectangle. */
  cells: number
  /** Whether the sum/avg scan ran (selection ≤ cap). */
  scanned: boolean
  /** Non-empty cells. */
  count: number
  /** Cells whose value parsed as a number. */
  numericCount: number
  sum: number
  min: number
  max: number
}

/**
 * Opt-in selection status bar — standard Count / Sum / Avg / Min /
 * Max of the current selection. Drop it wherever you want the readout (usually
 * a footer under the table); it renders nothing until a range of `minCells`+ is
 * selected. Requires being inside `<DataGrid>`.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataTable>…</DataTable>
 *   <DataGridStatusBar />
 * </DataGrid>
 */
export function DataGridStatusBar({
  className,
  /** Smallest selection (in cells) that shows the bar. Default 2 — hide for a single cell. */
  minCells = 2,
}: {
  className?: string
  minCells?: number
}) {
  const { selectionBounds, orderedRows, columnIds } = useDataGridInternals()

  const stats = React.useMemo<SelectionStats | null>(() => {
    if (!selectionBounds) return null
    const { minRow, maxRow, minColIndex, maxColIndex } = selectionBounds
    const cells = (maxRow - minRow + 1) * (maxColIndex - minColIndex + 1)
    if (cells < minCells) return null

    const scanned = cells <= MAX_STATS_CELLS
    let count = 0
    let numericCount = 0
    let sum = 0
    let min = Infinity
    let max = -Infinity
    if (scanned) {
      for (let r = minRow; r <= maxRow; r++) {
        const row = orderedRows[r]?.original
        if (!row) continue
        for (let c = minColIndex; c <= maxColIndex; c++) {
          const col = columnIds[c]
          if (!col) continue
          const raw = (row[col] as CellState<string> | undefined)?.raw ?? ""
          if (raw === "") continue
          count++
          // Tolerate thousands separators; blank/whitespace isn't a number.
          const n = Number(raw.replace(/,/g, ""))
          if (raw.trim() !== "" && Number.isFinite(n)) {
            numericCount++
            sum += n
            if (n < min) min = n
            if (n > max) max = n
          }
        }
      }
    }
    return { cells, scanned, count, numericCount, sum, min, max }
  }, [selectionBounds, orderedRows, columnIds, minCells])

  if (!stats) return null

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-4 border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground tabular-nums",
        className,
      )}
    >
      {stats.scanned ? (
        <>
          <StatusStat label="Count" value={stats.count.toLocaleString()} />
          {stats.numericCount > 0 && (
            <>
              <StatusStat label="Sum" value={fmt(stats.sum)} />
              <StatusStat
                label="Avg"
                value={fmt(stats.sum / stats.numericCount)}
              />
              <StatusStat label="Min" value={fmt(stats.min)} />
              <StatusStat label="Max" value={fmt(stats.max)} />
            </>
          )}
        </>
      ) : (
        <StatusStat
          label="Selected"
          value={`${stats.cells.toLocaleString()} cells`}
        />
      )}
    </div>
  )
}

function StatusStat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label} <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}
