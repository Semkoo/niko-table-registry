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
 * niko-table grid — clipboard pure helpers.
 *
 * Part of the niko-table editable DataGrid (registry item `niko-table/grid`).
 * Domain-free, unit-testable without React. The copy/cut/paste WIRING lives in
 * the `<DataGrid>` container (it needs the display order); these helpers do the
 * TSV serialization/parsing over display-ordered rows.
 */

import type { CellState, GridRow } from "../types/grid-cell"

/**
 * Read a row's cell raw text. Rows created before a dynamically added column
 * have no CellState entry for it — treat that as empty, never crash.
 */
function rawOf(row: GridRow, columnId: string): string {
  return (row[columnId] as CellState<string> | undefined)?.raw ?? ""
}

/**
 * Quote a cell for TSV when it contains a tab, newline, or quote — the same
 * convention Excel/Google Sheets use on their clipboard, so multi-line cells
 * round-trip instead of tearing into extra rows.
 */
function encodeTsvCell(raw: string): string {
  return /[\t\n\r"]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw
}

/**
 * Split clipboard text into a matrix: rows on newlines, cells on tabs.
 * Quote-aware: a cell wrapped in double quotes may contain literal tabs and
 * newlines, and `""` escapes a quote (Excel/Sheets clipboard convention).
 */
export function parseTsv(text: string): string[][] {
  // Strip only ONE trailing newline (the terminator external editors append) —
  // NOT all of them, so a selection ending in blank rows round-trips.
  const normalized = text.replace(/\r\n?/g, "\n").replace(/\n$/, "")
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"' && cell === "") {
      inQuotes = true
    } else if (ch === "\t") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += ch
    }
  }
  row.push(cell)
  rows.push(row)
  return rows
}

/**
 * Serialize a selection rectangle to TSV (raw cell text). Rows are pulled lazily
 * by DISPLAY index via `getRow`, so this is O(selection) — it never touches rows
 * outside the rectangle (important at large row counts). `getRow` typically maps
 * a display index to the TanStack row's `.original`.
 */
export function serializeSelection(
  getRow: (displayIndex: number) => GridRow | undefined,
  columnIds: readonly string[],
  bounds: {
    minRow: number
    maxRow: number
    minColIndex: number
    maxColIndex: number
  },
): string {
  const lines: string[] = []
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    const row = getRow(r)
    if (!row) continue
    const cells: string[] = []
    for (let c = bounds.minColIndex; c <= bounds.maxColIndex; c++) {
      const columnId = columnIds[c]
      cells.push(columnId ? encodeTsvCell(rawOf(row, columnId)) : "")
    }
    lines.push(cells.join("\t"))
  }
  return lines.join("\n")
}
