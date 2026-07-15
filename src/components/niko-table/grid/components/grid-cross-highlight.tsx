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

import {
  useDataTableActiveCellSetter,
  type ActiveCell,
} from "../../core/data-table-context"
import { useDataGridInternals } from "../core/data-grid-features"

/**
 * Opt-in grid-style cross-highlight — EVERY column and row in the current
 * selection lights up: the column HEADERS in the selection, and each selected
 * row's `data-active-row` marker (style your row-number gutter with
 * `group-data-[active-row=true]:…`). Drop it inside `<DataGrid>`; leave it out
 * and selection changes never touch the table's active-cell context.
 *
 * @example
 * <DataGrid grid={grid}>
 *   <DataGridCrossHighlight />
 *   <DataTable>…</DataTable>
 * </DataGrid>
 */
export function DataGridCrossHighlight() {
  const { selectionBounds, columnIds } = useDataGridInternals()
  const setActiveCell = useDataTableActiveCellSetter()

  // Span of the selection: the ids of its columns (few, all rendered → Set)
  // and its inclusive row-index range (rows are virtualized → range, not Set).
  const active = React.useMemo<ActiveCell>(() => {
    if (!selectionBounds) return null
    const cols = new Set<string>()
    for (
      let c = selectionBounds.minColIndex;
      c <= selectionBounds.maxColIndex;
      c++
    ) {
      const id = columnIds[c]
      if (id) cols.add(id)
    }
    return {
      columnIds: cols,
      rowRange: { min: selectionBounds.minRow, max: selectionBounds.maxRow },
    }
  }, [selectionBounds, columnIds])

  // Publish on change; clear only on unmount (a per-change cleanup-to-null would
  // flash the highlight off then on between selections).
  React.useEffect(() => {
    setActiveCell(active)
  }, [active, setActiveCell])
  React.useEffect(() => () => setActiveCell(null), [setActiveCell])

  return null
}
