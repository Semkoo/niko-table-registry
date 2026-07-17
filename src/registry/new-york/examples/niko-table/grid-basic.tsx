"use client"

/**
 * niko-table/grid — the smallest useful editable grid.
 *
 * Just text cells + clipboard + fill: keyboard cell navigation, type-to-edit,
 * TSV copy/cut/paste, and the corner fill handle. Everything else (dynamic
 * columns, drag-move, row reorder, other cell types) is an opt-in child you add
 * later — see the full-featured example.
 */
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridPasteHint,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import * as React from "react"

const COLUMN_IDS = ["task", "assignee", "status"] as const
const LABELS: Record<string, string> = {
  task: "Task",
  assignee: "Assignee",
  status: "Status",
}

// Text cells are always valid; a resolver just wraps the raw string.
const resolveCell = (_columnId: string, raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw === "" ? "empty" : "valid",
})

const cell = (raw: string): CellState<string> => resolveCell("", raw)

const INITIAL_ROWS: GridRow[] = [
  {
    id: "r1",
    task: cell("Draft proposal"),
    assignee: cell("Bailey"),
    status: cell("In progress"),
  },
  {
    id: "r2",
    task: cell("Review PR"),
    assignee: cell("Noah"),
    status: cell("Blocked"),
  },
  {
    id: "r3",
    task: cell("Ship release"),
    assignee: cell("Mia"),
    status: cell("Todo"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })

const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

export function GridBasic() {
  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      COLUMN_IDS.map(id => ({
        id,
        accessorFn: (row: GridRow) => {
          const v = row[id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: LABELS[id],
        size: 200,
        meta: { label: LABELS[id] },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={id}>
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(id, raw)}
                placeholder={LABELS[id]}
              />
            )}
          </DataGridCell>
        ),
      })),
    [],
  )

  return (
    <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
      <DataGrid grid={grid} className="space-y-2 outline-none">
        {/* Flex-fill + drag-resizable columns */}
        <DataTableColumnResize />
        <DataGridClipboard resolveCell={resolveCell} />
        <DataGridFillHandle />
        <DataGridToolbar>
          <DataGridAddRows count={3} />
          <DataGridPasteHint />
        </DataGridToolbar>
        <DataTable maxHeight={360}>
          <DataTableVirtualizedHeader />
          <DataTableVirtualizedBody<GridRow>
            estimateSize={37}
            fixedRowHeight
            getCellClassName={gridCellClassName}
          >
            <DataTableRowContextMenuSlot>
              <GridRowMenu />
            </DataTableRowContextMenuSlot>
          </DataTableVirtualizedBody>
        </DataTable>
      </DataGrid>
    </DataTableRoot>
  )
}
